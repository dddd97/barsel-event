require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module BarselEventV2
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    config.active_job.queue_adapter = :inline

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # Add the pdfs directory to autoload paths
    config.autoload_paths += %W(#{config.root}/app/pdfs)
    
    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # Set time zone to Jakarta (WIB - Western Indonesian Time)
    config.time_zone = "Jakarta"
    
    # Set default locale to Indonesian
    config.i18n.default_locale = :id
    config.i18n.available_locales = [:id, :en]

    # Ensure UTF-8 encoding
    config.encoding = "utf-8"
    
    # Skip database operations if needed
    if ENV['SKIP_DATABASE'] == 'true'
      config.generators do |g|
        g.orm false
      end
    end
  end
end
