module Api
  module Admin
    class ProfilesController < BaseController
      def show
        begin
          Rails.logger.info "AdminProfile show request - current_admin: #{current_admin.inspect}"
          
          profile_photo_url = safe_profile_photo_url(current_admin)
          
          response_data = {
            id: current_admin&.id,
            name: current_admin&.name || "Default Admin",
            email: current_admin&.email || "admin@example.com",
            role: current_admin&.role || "admin",
            roleDisplayName: current_admin&.role_display_name || "Admin",
            profilePhoto: profile_photo_url,
            createdAt: current_admin&.created_at,
            updatedAt: current_admin&.updated_at
          }
          
          Rails.logger.info "AdminProfile response data: #{response_data.inspect}"
          render json: response_data
        rescue => e
          Rails.logger.error "Error in admin profile show: #{e.message}"
          render json: {
            id: nil,
            name: 'Unknown Admin',
            email: 'unknown@example.com',
            role: 'admin',
            roleDisplayName: 'Admin',
            profilePhoto: nil,
            createdAt: nil,
            updatedAt: nil,
            error: 'Profile temporarily unavailable',
            message: 'Please try again later'
          }, status: :ok
        end
      end

      def debug
        Rails.logger.info "Debug endpoint called"
        
        # Return a completely safe static response to test frontend
        render json: {
          id: 1,
          name: "Debug Admin",
          email: "debug@example.com", 
          role: "admin",
          roleDisplayName: "Admin",
          profilePhoto: nil,
          createdAt: Time.current,
          updatedAt: Time.current,
          debug: true
        }
      end

      def update
        begin
          if current_admin.update(profile_params)
            # Log the activity safely
            begin
              log_activity('update', current_admin, "Profil admin diperbarui")
            rescue => log_error
              Rails.logger.warn "Failed to log profile update activity: #{log_error.message}"
            end
            
            # Get profile photo URL safely
            profile_photo_url = safe_profile_photo_url(current_admin)
            
            render json: {
              id: current_admin.id,
              name: current_admin.name,
              email: current_admin.email,
              role: current_admin.role,
              roleDisplayName: current_admin.role_display_name,
              profilePhoto: profile_photo_url,
              createdAt: current_admin.created_at,
              updatedAt: current_admin.updated_at
            }
          else
            render json: { 
              errors: current_admin.errors.full_messages,
              field_errors: current_admin.errors.to_hash 
            }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error updating admin profile: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          
          render json: {
            error: 'Profile update failed',
            message: 'Please try again later',
            details: e.message
          }, status: :ok # Return 200 to prevent frontend crashes
        end
      end

      private

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

      def profile_params
        permitted = params.permit(:name, :email, :profile_photo)
        
        # Handle password change if provided
        if params[:password].present?
          # Verify current password first
          unless current_admin.authenticate(params[:current_password])
            current_admin.errors.add(:current_password, 'is incorrect')
            return {}
          end
          
          permitted[:password] = params[:password]
          permitted[:password_confirmation] = params[:password_confirmation]
        end
        
        permitted
      end
    end
  end
end 