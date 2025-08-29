module Api
  class SessionsController < ApplicationController
    include SecurityHeaders
    include Auditable
    include ErrorHandler
    
    # Skip CSRF protection for API endpoints to allow session creation
    skip_before_action :verify_authenticity_token
    
    # Explicit session configuration for this controller
    before_action :configure_session_options, only: [:create]
    
    # Simple rate limiting for login attempts (in-memory, production should use Redis)
    @@failed_attempts = {}
    @@last_cleanup = Time.current
    
    def create
      # Clean up old failed attempts every hour
      cleanup_failed_attempts if Time.current - @@last_cleanup > 1.hour
      
      client_ip = request.remote_ip
      
      # Check rate limiting (max 5 attempts per IP per hour)
      if too_many_attempts?(client_ip)
        render_error('Terlalu banyak percobaan login. Coba lagi dalam 1 jam.', :too_many_requests)
        return
      end
      
      admin = ::Admin.find_by(email: params[:email])
      if admin&.authenticate(params[:password])
        # Reset failed attempts on successful login
        @@failed_attempts.delete(client_ip)
        
        session[:admin_id] = admin.id
        
        # Log successful login
        AuditLog.log_activity(
          admin: admin,
          action: 'login',
          details: "Login berhasil dari IP: #{client_ip}",
          request: request
        )
        
        # Get avatar URL safely
        avatar_url = safe_profile_photo_url(admin)
        
        user_data = {
          id: admin&.id,
          email: admin&.email || "unknown@example.com",
          name: admin&.name || "Unknown User",
          role: admin&.role || "admin",
          roleDisplayName: admin&.role_display_name || "Admin",
          avatar: avatar_url,
          permissions: {
            canManageEvents: admin&.can_manage_events? || false,
            canManageParticipants: admin&.can_manage_participants? || false,
            canManagePrizes: admin&.can_manage_prizes? || false,
            canManageAdmins: admin&.can_manage_admins? || false,
            canViewAuditLogs: admin&.can_view_audit_logs? || false,
            canDeleteEvents: admin&.can_delete_events? || false,
            canDrawPrizes: admin&.can_draw_prizes? || false
          }
        }
        
        Rails.logger.info "Login success response: #{user_data.inspect}"
        render json: { user: user_data }, status: :ok
      else
        # Track failed attempt
        @@failed_attempts[client_ip] ||= []
        @@failed_attempts[client_ip] << Time.current
        
        Rails.logger.warn "Failed login attempt for email: #{params[:email]} from IP: #{client_ip}"
        render json: {
          user: {
            id: nil,
            name: nil,
            email: nil,
            role: nil,
            roleDisplayName: nil,
            avatar: nil,
            permissions: nil
          },
          error: 'Email atau password salah'
        }, status: :unauthorized
      end
    end

    def destroy
      admin = current_admin
      
      # Log logout before clearing session
      if admin
        AuditLog.log_activity(
          admin: admin,
          action: 'logout',
          details: "Logout dari sistem",
          request: request
        )
      end
      
      # Clear entire session to prevent session persistence bugs
      reset_session
      
      render json: { message: 'Berhasil logout' }, status: :ok
    end

    def debug
      return unless Rails.env.development?
      
      render json: { 
        session_id: session.id,
        session_data: {
          admin_id: session[:admin_id]
        },
        cookies: cookies.to_h.keys,
        env_request_method: request.env['REQUEST_METHOD'],
        request_headers: {
          origin: request.headers['Origin'],
          accept: request.headers['Accept']
        }
      }
    end
    
    private
    
    def configure_session_options
      # Session options must match ApplicationController to prevent duplicate cookies
      request.session_options[:same_site] = :lax
      request.session_options[:secure] = false
      request.session_options[:httponly] = false  # Match ApplicationController setting
      request.session_options[:expire_after] = 2.weeks
    end
    
    def too_many_attempts?(ip)
      return false unless @@failed_attempts[ip]
      
      # Count attempts in the last hour
      recent_attempts = @@failed_attempts[ip].select { |time| time > 1.hour.ago }
      recent_attempts.size >= 5
    end
    
    def cleanup_failed_attempts
      @@failed_attempts.each do |ip, attempts|
        @@failed_attempts[ip] = attempts.select { |time| time > 1.hour.ago }
        @@failed_attempts.delete(ip) if @@failed_attempts[ip].empty?
      end
      @@last_cleanup = Time.current
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