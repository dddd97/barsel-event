module Api
  module Admin
    class AdminsController < BaseController
      before_action :ensure_super_admin
      before_action :set_admin, only: [:show, :update, :destroy]

      def index
        @admins = ::Admin.includes(:created_events).all
        render json: @admins.map { |admin| admin_json(admin) }
      end

      def show
        render json: admin_json(@admin)
      end

      def create
        @admin = ::Admin.new
        @admin.name = admin_params[:name]
        @admin.email = admin_params[:email]
        @admin.role = admin_params[:role] || 'admin'
        @admin.password = admin_params[:password]
        @admin.password_confirmation = admin_params[:password_confirmation]
        
        # Set super_admin field based on role for backward compatibility
        @admin.super_admin = (@admin.role == 'super_admin')
        
        Rails.logger.info "Creating admin: #{@admin.name} with role: #{@admin.role}"
        
        if @admin.save
          begin
            AuditLog.create!(
              admin: current_admin,
              action: 'create',
              resource_type: 'Admin',
              resource_id: @admin.id,
              details: "Admin '#{@admin.name}' (#{@admin.email}) berhasil ditambahkan dengan role #{@admin.role_display_name}"
            )
          rescue => e
            Rails.logger.warn "Failed to create audit log: #{e.message}"
          end
          
          render json: admin_json(@admin), status: :created
        else
          Rails.logger.error "Failed to create admin: #{@admin.errors.full_messages}"
          render json: { 
            error: 'Gagal membuat admin', 
            details: @admin.errors.full_messages 
          }, status: :unprocessable_entity
        end
      end

      def update
        @admin.name = admin_params[:name] if admin_params[:name].present?
        @admin.email = admin_params[:email] if admin_params[:email].present?
        
        if admin_params[:role].present?
          @admin.role = admin_params[:role]
          # Set super_admin field based on role for backward compatibility
          @admin.super_admin = (@admin.role == 'super_admin')
        end
        
        # Update password if provided
        if admin_params[:password].present?
          @admin.password = admin_params[:password]
          @admin.password_confirmation = admin_params[:password_confirmation]
        end
        
        if @admin.save
          begin
            AuditLog.create!(
              admin: current_admin,
              action: 'update',
              resource_type: 'Admin',
              resource_id: @admin.id,
              details: "Admin '#{@admin.name}' berhasil diperbarui"
            )
          rescue => e
            Rails.logger.warn "Failed to create audit log: #{e.message}"
          end
          
          render json: admin_json(@admin)
        else
          render json: { 
            error: 'Gagal memperbarui admin', 
            details: @admin.errors.full_messages 
          }, status: :unprocessable_entity
        end
      end

      def destroy
        if @admin == current_admin
          render json: { error: 'Anda tidak dapat menghapus akun Anda sendiri' }, status: :forbidden
          return
        end

        admin_name = @admin.name
        admin_email = @admin.email
        admin_id = @admin.id

        begin
          # Check if admin can be destroyed first
          if @admin.super_admin_role? && ::Admin.super_admins.count <= 1
            render json: { error: 'Tidak dapat menghapus super admin terakhir' }, status: :unprocessable_entity
            return
          end
          
          if ::Admin.count <= 1
            render json: { error: 'Tidak dapat menghapus admin terakhir' }, status: :unprocessable_entity
            return
          end
          
          # Create audit log before deletion
          begin
            AuditLog.create!(
              admin: current_admin,
              action: 'delete',
              resource_type: 'Admin',
              resource_id: admin_id,
              details: "Admin '#{admin_name}' (#{admin_email}) berhasil dihapus"
            )
          rescue => audit_error
            Rails.logger.warn "Failed to create audit log: #{audit_error.message}"
          end
          
          @admin.destroy!
          
          render json: { message: 'Admin berhasil dihapus' }
        rescue ActiveRecord::RecordInvalid => e
          Rails.logger.error "Validation error deleting admin: #{e.message}"
          error_messages = @admin.errors.full_messages.join(', ')
          render json: { error: 'Gagal menghapus admin', details: error_messages }, status: :unprocessable_entity
        rescue ActiveRecord::DeleteRestrictionError => e
          Rails.logger.error "Delete restriction error: #{e.message}"
          render json: { error: 'Admin tidak dapat dihapus karena masih memiliki event aktif' }, status: :unprocessable_entity
        rescue => e
          Rails.logger.error "Error deleting admin: #{e.message}\n#{e.backtrace.join("\n")}"
          render json: { error: 'Gagal menghapus admin', details: e.message }, status: :internal_server_error
        end
      end

      private

      def set_admin
        @admin = ::Admin.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Admin tidak ditemukan' }, status: :not_found
      end

      def admin_params
        permitted_params = params.require(:admin).permit(:name, :email, :password, :password_confirmation, :role)
        # Remove super_admin param since we're using role enum now
        permitted_params.except(:super_admin)
      end

      def admin_json(admin)
        response_data = {
          id: admin&.id,
          name: admin&.name || "Unknown Admin",
          email: admin&.email || "unknown@example.com",
          role: admin&.role || "admin",
          roleDisplayName: admin&.role_display_name || "Admin",
          avatar: safe_profile_photo_url(admin),
          createdAt: admin&.created_at,
          updatedAt: admin&.updated_at,
          eventsCount: admin&.created_events&.count || 0
        }
        
        Rails.logger.info "admin_json response for admin #{admin&.id}: #{response_data.inspect}"
        response_data
      end

      def ensure_super_admin
        unless current_admin&.can_manage_admins?
          render json: { error: 'Akses ditolak. Hanya super admin yang dapat mengelola admin.' }, status: :forbidden
        end
      end

      def safe_profile_photo_url(admin)
        return nil unless admin&.respond_to?(:profile_photo_url)
        
        begin
          admin.profile_photo_url
        rescue => e
          Rails.logger.warn "Profile photo URL error for admin #{admin.id}: #{e.message}"
          nil
        end
      rescue => e
        Rails.logger.error "Fatal profile photo error: #{e.message}"
        nil
      end
    end
  end
end