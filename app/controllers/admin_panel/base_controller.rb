class AdminPanel::BaseController < ApplicationController
  layout 'admin'
  before_action :require_admin

  private

  def require_admin
    redirect_to admin_panel_login_path, alert: 'Anda harus login untuk mengakses halaman ini.' unless admin_signed_in?
  end
end 