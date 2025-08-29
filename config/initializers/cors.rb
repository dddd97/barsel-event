# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  # Khusus untuk development dan testing
  allow do
    # Tambahkan semua port yang digunakan Vite
    origins 'http://localhost:3000', 
            'http://localhost:5173', 
            'http://localhost:5174', 
            'http://localhost:3036',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,
      expose: ['Set-Cookie', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials']
  end
  
  # Production origins untuk VPS
  if Rails.env.production?
    allow do
      production_origins = [
        'http://103.123.24.253:8081',
        'http://103.123.24.253:8080',
        'https://event.baritoselatankab.go.id',
        'http://event.baritoselatankab.go.id'
      ]
      
      # Add environment URLs if present
      production_origins << ENV['FRONTEND_URL'] if ENV['FRONTEND_URL'].present?
      production_origins << ENV['BACKEND_URL'] if ENV['BACKEND_URL'].present?
      production_origins << ENV['DOMAIN'] if ENV['DOMAIN'].present?
      
      origins(*production_origins)

      resource '*',
        headers: :any,
        methods: [:get, :post, :put, :patch, :delete, :options, :head],
        credentials: true,
        expose: ['Set-Cookie', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials']
    end
  end
end 