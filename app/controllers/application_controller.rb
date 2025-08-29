class ApplicationController < ActionController::Base
  include Pagy::Backend
  include ErrorHandler
  # include Recaptcha::Verify # Temporarily disabled - causing startup issues
  # Nonaktifkan pengecekan browser modern
  # allow_browser versions: :modern

  # Enable CSRF protection but provide tokens for legitimate requests
  protect_from_forgery with: :exception
  before_action :set_csrf_cookie, if: :json_request?
  before_action :set_cors_headers, if: :json_request?
  before_action :set_security_headers
  before_action :configure_session_for_api, if: :json_request?
  before_action :log_session_info, if: :json_request?
  
  helper_method :admin_signed_in?, :current_admin
  
  # Removed problematic React SPA serving - let vite_ruby handle assets via Rails views
  
  # Override url_for untuk memastikan URL Active Storage benar
  def default_url_options
    if Rails.env.development?
      { host: 'localhost', port: 3000, protocol: 'http' }
    else
      {}
    end
  end
  
  private
  
  def admin_signed_in?
    current_admin.present?
  end

  def current_admin
    @current_admin ||= Admin.find_by(id: session[:admin_id]) if session[:admin_id]
  end

  def set_cors_headers
    origin = request.headers['Origin']
    
    # Build allowed origins dynamically based on environment
    allowed_origins = build_allowed_origins
    
    # Only set CORS headers for allowed origins
    if allowed_origins.include?(origin)
      headers['Access-Control-Allow-Origin'] = origin
      headers['Access-Control-Allow-Methods'] = 'POST, PUT, DELETE, GET, OPTIONS'
      headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
      headers['Access-Control-Allow-Credentials'] = 'true'
      headers['Access-Control-Expose-Headers'] = 'Set-Cookie'
    end
  end
  
  def configure_session_for_api
    # Environment-based session security configuration
    secure_session = Rails.env.production? && ENV['RAILS_FORCE_SSL'].present?
    httponly_session = Rails.env.production?
    
    # Ensure session options are set correctly for API requests
    request.session_options[:same_site] = :lax    # Lax for HTTP compatibility
    request.session_options[:secure] = secure_session     # Secure in production with SSL
    request.session_options[:httponly] = httponly_session # HTTPOnly in production for security
    request.session_options[:expire_after] = 2.weeks
    # Remove explicit :domain to prevent duplicate cookies with differing domain attributes
    # and rely on Rails default (host-only) so the same cookie is reused across requests.
    # If you later need cross-subdomain support, set this via environment variable instead.
  end
  
  def log_session_info
    return unless Rails.env.development?
    
    Rails.logger.info "============= SESSION INFO ============="
    Rails.logger.info "Session ID: #{session.id}"
    Rails.logger.info "Admin ID in session: #{session[:admin_id]}"
    Rails.logger.info "Current Admin: #{current_admin&.email || 'None'}"
    Rails.logger.info "Origin: #{request.headers['Origin']}"
    Rails.logger.info "User-Agent: #{request.headers['User-Agent']&.first(50)}..."
    Rails.logger.info "Session data: #{session.to_hash}"
    Rails.logger.info "========================================"
  end

  def set_csrf_cookie
    # Environment-based CSRF cookie security
    secure_csrf = Rails.env.production? && ENV['RAILS_FORCE_SSL'].present?
    
    cookies['XSRF-TOKEN'] = {
      value: form_authenticity_token,
      domain: :all,
      secure: secure_csrf,  # true dalam production dengan SSL
      httponly: false,      # Allow JS access for CSRF token
      same_site: :lax
    }
  end

  def set_security_headers
    # Additional security headers
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    
    # Only add HSTS in production with HTTPS
    if Rails.env.production?
      response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    end
  end

  protected
  
  def json_request?
    request.format.json? || request.headers["Accept"]&.include?("application/json")
  end
  
  def build_allowed_origins
    origins = []
    
    # Development origins
    if Rails.env.development?
      origins += [
        'http://localhost:3000',
        'http://localhost:5173', 
        'http://localhost:5174',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ]
    end
    
    # Production domain
    if ENV['PRODUCTION_DOMAIN'].present?
      domain = ENV['PRODUCTION_DOMAIN']
      origins += [
        "http://#{domain}",
        "https://#{domain}"
      ]
    else
      # Fallback to hardcoded production domain
      origins += [
        'http://event.baritoselatankab.go.id',
        'https://event.baritoselatankab.go.id'
      ]
    end
    
    # Frontend URL from environment
    if ENV['FRONTEND_URL'].present?
      origins << ENV['FRONTEND_URL']
    end
    
    # VPS IP configuration
    if ENV['VPS_IP'].present?
      vps_ip = ENV['VPS_IP']
      frontend_port = ENV['FRONTEND_PORT'] || '8080'
      backend_port = ENV['BACKEND_PORT'] || '3000'
      dev_port = ENV['DEV_PORT'] || '5173'
      
      origins += [
        "http://#{vps_ip}:#{frontend_port}",
        "https://#{vps_ip}:#{frontend_port}",
        "http://#{vps_ip}:#{backend_port}",
        "http://#{vps_ip}:#{dev_port}",
        "http://#{vps_ip}:80",
        "https://#{vps_ip}:443"
      ]
    end
    
    # Legacy IPs for backward compatibility (remove after migration)
    if ENV['ALLOW_LEGACY_IPS'] == 'true'
      origins += [
        'http://103.123.24.253:8080',
        'https://103.123.24.253:8080',
        'http://103.123.24.253:8081',
        'https://103.123.24.253:8081'
      ]
    end
    
    origins.uniq
  end
end
