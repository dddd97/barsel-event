module AdminPanel
  class AdminsController < AdminController
    before_action :set_admin, only: [:show, :edit, :update, :destroy]

    def index
      @admins = Admin.all
    end

    def show
    end

    def new
      @admin = Admin.new
    end

    def create
      @admin = Admin.new(admin_params)
      
      if @admin.save
        redirect_to admin_panel_admins_path, notice: 'Admin berhasil ditambahkan.'
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      if @admin.update(admin_params)
        redirect_to admin_panel_admin_path(@admin), notice: 'Profil berhasil diperbarui.'
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      if @admin == current_admin
        redirect_to admin_panel_admins_path, alert: 'Anda tidak dapat menghapus akun Anda sendiri.'
      else
        begin
          @admin.destroy
          redirect_to admin_panel_admins_path, notice: 'Admin berhasil dihapus.'
        rescue ActiveRecord::DeleteRestrictionError => e
          redirect_to admin_panel_admins_path, alert: 'Admin tidak dapat dihapus karena masih memiliki event aktif.'
        end
      end
    end

    private

    def set_admin
      @admin = Admin.find(params[:id])
    end

    def admin_params
      params.require(:admin).permit(:name, :email, :password, :password_confirmation, :super_admin)
    end
  end
end 