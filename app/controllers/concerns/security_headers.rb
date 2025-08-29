module SecurityHeaders
  extend ActiveSupport::Concern

  included do
    after_action :set_security_headers, if: :json_request?
  end

  private

  def set_security_headers
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Enable XSS protection
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Disable referrer for external links
    response.headers['Referrer-Policy'] = 'same-origin'
    
    # Content Security Policy untuk API responses - disabled for Vite compatibility
    # if request.format.json?
    #   response.headers['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none';"
    # end
  end

  def json_request?
    request.format.json? || request.headers["Accept"]&.include?("application/json")
  end
end