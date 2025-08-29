module AdminPanel
  class AdminController < ApplicationController
    before_action :authenticate_admin!
    layout 'admin'

    private

    def authenticate_admin!
      unless current_admin
        redirect_to new_admin_panel_session_path, alert: 'Silakan login terlebih dahulu.'
      end
    end

    def current_admin
      @current_admin ||= Admin.find_by(id: session[:admin_id]) if session[:admin_id]
    end
    helper_method :current_admin
  end
end 