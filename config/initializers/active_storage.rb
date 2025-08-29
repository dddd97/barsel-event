# Konfigurasi Active Storage untuk custom API endpoint
Rails.application.config.after_initialize do
  # Only configure for development - production uses custom API endpoints
  if Rails.env.development?
    # Pastikan semua URL yang dihasilkan menggunakan host yang benar
    Rails.application.routes.default_url_options[:host] = 'localhost'
    Rails.application.routes.default_url_options[:port] = 3000
    Rails.application.config.action_controller.default_url_options = { 
      host: 'localhost', 
      port: 3000, 
      protocol: 'http' 
    }
  else
    # Production - use relative URLs for custom API endpoint
    Rails.application.routes.default_url_options = {}
    Rails.application.config.action_controller.default_url_options = {}
  end
end 