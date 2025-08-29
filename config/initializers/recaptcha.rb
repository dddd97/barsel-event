Recaptcha.configure do |config|
  config.site_key = ENV['RECAPTCHA_SITE_KEY']
  config.secret_key = ENV['RECAPTCHA_SECRET_KEY']
  
  # Uncomment the following line if you are using Recaptcha's v3 API
  # config.skip_verify_env.push('test', 'development')
end 