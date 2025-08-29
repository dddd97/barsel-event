# Standard error handling for consistent API responses
module ErrorHandler
  extend ActiveSupport::Concern
  
  included do
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
    rescue_from ActiveRecord::RecordInvalid, with: :render_validation_error
    rescue_from ActionController::ParameterMissing, with: :render_parameter_missing
    rescue_from Timeout::Error, with: :render_timeout_error
    rescue_from Errno::ECONNRESET, with: :render_network_error
    rescue_from Errno::ECONNREFUSED, with: :render_network_error
    rescue_from SocketError, with: :render_network_error
  end
  
  private
  
  def render_error(message, status = :unprocessable_entity, details = nil)
    response = { error: message }
    response[:details] = details if details
    render json: response, status: status
  end
  
  def render_validation_errors(record)
    render json: {
      error: "Validation failed",
      errors: record.errors.full_messages,
      field_errors: record.errors.messages
    }, status: :unprocessable_entity
  end
  
  def render_not_found(exception)
    render json: { 
      error: "Resource not found",
      details: exception.message 
    }, status: :not_found
  end
  
  def render_validation_error(exception)
    render_validation_errors(exception.record)
  end
  
  def render_parameter_missing(exception)
    render json: {
      error: "Missing required parameter",
      details: exception.message
    }, status: :bad_request
  end
  
  def render_unauthorized(message = "Unauthorized access")
    render json: { error: message }, status: :unauthorized
  end
  
  def render_forbidden(message = "Access forbidden")
    render json: { error: message }, status: :forbidden
  end
  
  def render_timeout_error(exception)
    Rails.application.config.error_reporter&.report(exception, {
      controller: self.class.name,
      action: action_name,
      params: request.params.except('password', 'password_confirmation')
    })
    
    render json: { 
      error: "Request timeout", 
      message: "The server took too long to respond",
      retry_after: 30,
      details: Rails.env.development? ? exception.message : "Request timed out"
    }, status: :request_timeout
  end
  
  def render_network_error(exception)
    Rails.application.config.error_reporter&.report(exception, {
      controller: self.class.name,
      action: action_name,
      params: request.params.except('password', 'password_confirmation')
    })
    
    render json: { 
      error: "Network error", 
      message: "Connection problem occurred",
      retry_after: 60,
      hint: "Check network connection and try again",
      details: Rails.env.development? ? exception.message : "Network error occurred"
    }, status: :service_unavailable
  end
  
  # Add generic error handler for unexpected errors
  def handle_unexpected_error(exception)
    Rails.application.config.error_reporter&.report(exception, {
      controller: self.class.name,
      action: action_name,
      params: request.params.except('password', 'password_confirmation'),
      user_agent: request.user_agent,
      ip: request.remote_ip
    })
    
    if Rails.env.development?
      render json: { 
        error: "Internal server error",
        message: exception.message,
        backtrace: exception.backtrace&.first(5)
      }, status: :internal_server_error
    else
      render json: { 
        error: "Internal server error",
        message: "Something went wrong. Please try again later."
      }, status: :internal_server_error
    end
  end
end
