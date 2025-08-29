# Redis configuration for production
if Rails.env.production? && ENV['REDIS_URL'].present?
  Rails.logger.info "✅ Redis enabled with URL: #{ENV['REDIS_URL']}"
  Rails.application.config.cache_store = :redis_cache_store, { url: ENV['REDIS_URL'] }
else
  Rails.logger.info "🚫 Redis disabled - using memory store for development"
  Rails.application.config.cache_store = :memory_store, { size: 128.megabytes }
end

# Add global cache fallback wrapper
module SafeCache
  def self.fetch(key, options = {}, &block)
    Rails.cache.fetch(key, options, &block)
  rescue Errno::EACCES => permission_error
    Rails.logger.warn "Cache permission denied for key '#{key}': #{permission_error.message}"
    block&.call
  rescue => e
    Rails.logger.warn "Cache operation failed for key '#{key}': #{e.message}"
    block&.call
  end
  
  def self.write(key, value, options = {})
    Rails.cache.write(key, value, options)
  rescue Errno::EACCES => permission_error
    Rails.logger.warn "Cache write permission denied for key '#{key}': #{permission_error.message}"
    false
  rescue => e
    Rails.logger.warn "Cache write failed for key '#{key}': #{e.message}"
    false
  end
  
  def self.read(key)
    Rails.cache.read(key)
  rescue Errno::EACCES => permission_error
    Rails.logger.warn "Cache read permission denied for key '#{key}': #{permission_error.message}"
    nil
  rescue => e
    Rails.logger.warn "Cache read failed for key '#{key}': #{e.message}"
    nil
  end
end