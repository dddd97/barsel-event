# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  # Configure CSP for all environments
  config.content_security_policy do |policy|
    # Basic secure defaults
    policy.default_src :self, :https
    
    # Allow fonts from Google Fonts and local
    policy.font_src :self, :https, :data, 'https://fonts.gstatic.com'
    
    # Allow images from self, HTTPS, data URIs, and Active Storage
    policy.img_src :self, :https, :data, 'https://*.amazonaws.com'
    
    # Block object embedding
    policy.object_src :none
    
    # Scripts: self, HTTPS, Google APIs for reCAPTCHA and OAuth
    policy.script_src :self, :https, :unsafe_eval, :unsafe_inline,
                      'https://www.google.com', 
                      'https://www.gstatic.com',
                      'https://accounts.google.com'
    
    # Allow @vite/client to hot reload javascript changes in development
    if Rails.env.development?
      policy.script_src(*policy.script_src, "http://#{ViteRuby.config.host_with_port}")
    end

    # Very permissive styles for all environments to support Vite
    policy.style_src :self, :https, :unsafe_inline, 'data:', 'https://fonts.googleapis.com'
    
    # Allow forms to submit to self and Google APIs
    policy.form_action :self, 'https://accounts.google.com'
    
    # Allow frames from Google for reCAPTCHA and OAuth
    policy.frame_src 'https://www.google.com', 'https://accounts.google.com'
    
    # Connect to API endpoints and WebSocket
    policy.connect_src :self, :https, :wss,
                       'http://localhost:3000',
                       'http://localhost:5173',
                       'http://localhost:5174'

    # Add production URLs if available
    if ENV['FRONTEND_URL'].present?
      policy.connect_src(*policy.connect_src, ENV['FRONTEND_URL'])
    end
    
    # Add VPS IP addresses if available
    if ENV['VPS_IP'].present?
      vps_ip = ENV['VPS_IP']
      policy.connect_src(*policy.connect_src, 
                         "http://#{vps_ip}:3000",
                         "http://#{vps_ip}:80",
                         "https://#{vps_ip}:443",
                         "http://#{vps_ip}:8080",
                         "http://#{vps_ip}:8081")
    end
    
    # Block unnecessary features
    policy.base_uri :self
    policy.manifest_src :self
  end

  # Disable nonces in production to avoid conflicts with Vite
  if Rails.env.production?
    config.content_security_policy_nonce_generator = nil
    config.content_security_policy_nonce_directives = []
    config.content_security_policy_report_only = false
  else
    # Generate session nonces for development only
    config.content_security_policy_nonce_generator = ->(request) { SecureRandom.base64(16) }
    config.content_security_policy_nonce_directives = %w(script-src style-src)
    config.content_security_policy_report_only = true
  end
end
