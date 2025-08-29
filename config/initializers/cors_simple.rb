# Simple CORS for debugging - disable complex logic temporarily
Rails.application.configure do
  if ENV['SIMPLE_CORS'] == 'true'
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: false  # Fixed: cannot use credentials: true with origins: '*'
      end
    end
  end
end