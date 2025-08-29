module Api
  class AdminsController < ApplicationController
    include ErrorHandler
    
    # Skip CSRF protection for API endpoints - this fixes authentication issues
    skip_before_action :verify_authenticity_token
    before_action :check_me_rate_limit, only: [:me]
    before_action :authenticate_admin!, only: [:me]
    
    # Simple rate limiting to prevent infinite /api/me polling
    @@me_requests = {}
    @@last_me_cleanup = Time.current
    
    def me
      Rails.logger.info "API /me: Session ID: #{session.id}, Admin ID: #{session[:admin_id]}"
      begin
        if current_admin
          Rails.logger.info "/api/me success - current_admin: #{current_admin.inspect}"
          
          # Get avatar URL safely
          avatar_url = safe_profile_photo_url(current_admin)
          
          response_data = {
            id: current_admin&.id,
            email: current_admin&.email || "unknown@example.com",
            name: current_admin&.name || "Unknown User",
            role: current_admin&.role || "admin",
            roleDisplayName: current_admin&.role_display_name || "Admin",
            avatar: avatar_url,
            createdAt: current_admin&.created_at,
            updatedAt: current_admin&.updated_at
          }
          
          Rails.logger.info "/api/me response data: #{response_data.inspect}"
          render json: response_data, status: :ok
        else
          render json: { 
            id: nil,
            name: nil,
            email: nil,
            role: nil,
            roleDisplayName: nil,
            avatar: nil,
            createdAt: nil,
            updatedAt: nil,
            error: 'Not authenticated' 
          }, status: :unauthorized
        end
      rescue => e
        Rails.logger.error "Error in /api/me: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { 
          id: nil,
          name: nil,
          email: nil,
          role: nil,
          roleDisplayName: nil,
          avatar: nil,
          createdAt: nil,
          updatedAt: nil,
          error: 'Server error', 
          details: e.message 
        }, status: :internal_server_error
      end
    end
    
    def debug
      begin
        render json: {
          session_id: session.id,
          admin_id: session[:admin_id],
          cookies: cookies.to_h.keys,
          session_exists: !session.empty?,
          environment: Rails.env,
          time: Time.current
        }, status: :ok
      rescue => e
        Rails.logger.error "Error in /api/debug: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Server error', details: e.message }, status: :internal_server_error
      end
    end
    
    private
    
    def check_me_rate_limit
      # Clean up old requests every hour
      if Time.current - @@last_me_cleanup > 1.hour
        @@me_requests.each do |client_id, requests|
          @@me_requests[client_id] = requests.select { |time| time > 1.minute.ago }
          @@me_requests.delete(client_id) if @@me_requests[client_id].empty?
        end
        @@last_me_cleanup = Time.current
      end
      
      # Use session ID + IP as client identifier  
      client_id = "#{session.id}-#{request.remote_ip}"
      
      # Check rate limiting (max 10 requests per minute for /api/me)
      @@me_requests[client_id] ||= []
      recent_requests = @@me_requests[client_id].select { |time| time > 1.minute.ago }
      
      if recent_requests.size >= 10
        Rails.logger.warn "Rate limit exceeded for /api/me: #{client_id}"
        render json: { 
          error: 'Rate limit exceeded', 
          message: 'Too many authentication checks, please wait',
          retry_after: 60,
          hint: 'Stop automatic polling on login page'
        }, status: :too_many_requests
        return false
      end
      
      # Track this request
      @@me_requests[client_id] << Time.current
      true
    end
    
    def authenticate_admin!
      # Only log detailed debug info in development or if explicitly enabled
      if Rails.env.development? || params[:debug] == 'true'
        Rails.logger.info "====== /API/ME AUTHENTICATION DEBUG ======"
        Rails.logger.info "Session ID: #{session.id}"
        Rails.logger.info "Session admin_id: #{session[:admin_id]}"
        Rails.logger.info "Current admin: #{current_admin&.email || 'None'}"
        Rails.logger.info "Request headers Origin: #{request.headers['Origin']}"
        Rails.logger.info "Request format: #{request.format}"
        Rails.logger.info "Session data: #{session.to_hash}"
        Rails.logger.info "Cookies: #{request.cookies.keys.join(', ')}"
        Rails.logger.info "=========================================="
      end
      
      unless current_admin
        # Don't log this as warning in production - it's expected for login page
        Rails.logger.debug "/api/me authentication failed - no current_admin" 
        
        # Provide more helpful response for frontend
        render json: { 
          error: 'Not authenticated',
          message: 'Please log in to continue',
          redirect_to: '/admin/login',
          session_valid: !session.empty?,
          timestamp: Time.current.to_i
        }, status: :unauthorized
        return false
      end
      
      Rails.logger.debug "/api/me authentication successful for: #{current_admin.email}"
      true
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