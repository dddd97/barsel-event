module AdminAuthentication
  extend ActiveSupport::Concern

  included do
    before_action :require_admin
    layout 'admin'
  end

  private

  def require_admin
    unless admin_signed_in?
      flash[:alert] = 'Anda harus login sebagai admin untuk mengakses halaman ini'
      redirect_to admin_login_path
    end
  end

  def admin_signed_in?
    session[:admin_id].present?
  end

  def current_admin
    @current_admin ||= Admin.find_by(id: session[:admin_id]) if session[:admin_id]
  end
end 