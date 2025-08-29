# Session Store Configuration for SSL Proxy
# SSL termination handled by external proxy, but cookies need to be secure

# Environment-based security configuration
secure_cookies = Rails.env.production? && ENV['RAILS_FORCE_SSL'].present?
httponly_cookies = Rails.env.production?

Rails.application.config.session_store :cookie_store, 
  key: '_doorprize_app_session',
  same_site: :lax,                                     # LAX so cookie sent on same-site navigation (GET)
  secure: secure_cookies,                              # true in production with SSL, false in development
  httponly: httponly_cookies,                          # true in production for security, false in dev for debugging
  expire_after: 2.weeks,
  path: '/',
  domain: nil                                          # no domain restriction for proxy flexibility