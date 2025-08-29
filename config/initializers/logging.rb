# Enhanced logging configuration for production
if Rails.env.production?
  # Configure structured logging
  Rails.application.configure do
    # Use JSON formatter for production logs
    config.log_formatter = proc do |severity, timestamp, progname, msg|
      {
        timestamp: timestamp.iso8601,
        severity: severity,
        progname: progname,
        message: msg,
        pid: Process.pid,
        thread: Thread.current.object_id,
        request_id: Thread.current[:request_id],
        user_id: Thread.current[:user_id]
      }.to_json + "\n"
    end
    
    # Log SQL queries in production for debugging (with rate limiting)
    if ENV['LOG_SQL'] == 'true'
      config.active_record.logger = ActiveSupport::Logger.new(STDOUT)
      config.active_record.logger.level = Logger::INFO
    end
  end
  
  # Custom logger for application events (use STDOUT in Docker)
  app_logger = ActiveSupport::Logger.new(STDOUT)
  app_logger.formatter = Rails.application.config.log_formatter
  Rails.application.config.app_logger = app_logger
  
  # Performance logger (use STDOUT in Docker)
  perf_logger = ActiveSupport::Logger.new(STDOUT)
  perf_logger.formatter = proc do |severity, timestamp, progname, msg|
    {
      timestamp: timestamp.iso8601,
      type: 'performance',
      data: msg
    }.to_json + "\n"
  end
  Rails.application.config.performance_logger = perf_logger
  
else
  # Development logging is more verbose
  Rails.application.configure do
    config.log_level = :debug
    config.colorize_logging = true
  end
end

# Add middleware to track request performance
class RequestPerformanceLogger
  def initialize(app)
    @app = app
  end
  
  def call(env)
    start_time = Time.current
    request = ActionDispatch::Request.new(env)
    
    # Set thread-local variables for logging context
    Thread.current[:request_id] = request.uuid
    Thread.current[:user_id] = extract_user_id(request)
    
    status, headers, response = @app.call(env)
    
    duration = (Time.current - start_time) * 1000 # milliseconds
    
    # Log performance metrics
    if Rails.env.production? && duration > 1000 # Log slow requests > 1s
      Rails.application.config.performance_logger&.info({
        path: request.path,
        method: request.method,
        status: status,
        duration_ms: duration.round(2),
        user_agent: request.user_agent,
        ip: request.remote_ip,
        params: filter_sensitive_params(request.params)
      })
    end
    
    [status, headers, response]
  ensure
    # Clean up thread-local variables
    Thread.current[:request_id] = nil
    Thread.current[:user_id] = nil
  end
  
  private
  
  def extract_user_id(request)
    # Try to extract user ID from session or JWT token
    request.session[:admin_id] if request.session
  end
  
  def filter_sensitive_params(params)
    # Remove sensitive parameters from logging
    filtered = params.except('password', 'password_confirmation', 'authenticity_token')
    filtered.to_s.length > 1000 ? "[LARGE_PARAMS]" : filtered
  end
end

# Add the middleware to the stack
Rails.application.config.middleware.use RequestPerformanceLogger

# Configure error reporting
class ErrorReporter
  def self.report(error, context = {})
    error_data = {
      error: error.class.name,
      message: error.message,
      backtrace: error.backtrace&.first(10),
      context: context,
      timestamp: Time.current.iso8601,
      environment: Rails.env,
      request_id: Thread.current[:request_id],
      user_id: Thread.current[:user_id]
    }
    
    # Log to application logger
    Rails.application.config.app_logger&.error(error_data)
    
    # In production, you might want to send to external service
    if Rails.env.production?
      # Example: send to Sentry, Rollbar, etc.
      # Sentry.capture_exception(error, extra: context)
    end
  end
end

# Make ErrorReporter available globally
Rails.application.config.error_reporter = ErrorReporter