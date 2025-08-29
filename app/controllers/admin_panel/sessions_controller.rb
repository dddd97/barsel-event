module AdminPanel
  class SessionsController < ApplicationController
    layout 'admin'
    skip_before_action :verify_authenticity_token, only: [:create, :destroy]
    
    def new
      redirect_to admin_panel_dashboard_path if admin_signed_in?
    end

    def create
      # Fix parameter access - should be nested under admin_panel_session
      email = params[:admin_panel_session]&.dig(:email) || params[:email]
      password = params[:admin_panel_session]&.dig(:password) || params[:password]
      
      admin = Admin.find_by(email: email)
      if admin&.authenticate(password)
        session[:admin_id] = admin.id
        
        # Log successful login for debugging
        Rails.logger.info "Admin login successful: #{admin.email} (ID: #{admin.id})"
        Rails.logger.info "Session ID: #{session.id}, Admin ID stored: #{session[:admin_id]}"
        
        redirect_to admin_panel_dashboard_path, notice: 'Login berhasil!'
      else
        Rails.logger.warn "Admin login failed for email: #{email}"
        flash.now[:alert] = 'Email atau password salah'
        render :new
      end
    end

    def destroy
      # Clear entire session to prevent session persistence bugs
      reset_session
      redirect_to root_path, notice: 'Berhasil logout'
    end
  end
end 