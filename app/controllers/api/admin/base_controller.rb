module Api
  module Admin
    class BaseController < ApplicationController
      include Auditable
      
      # CSRF protection enabled for admin endpoints (security requirement)
      # Frontend must include CSRF token in X-CSRF-Token header
      before_action :authenticate_admin!

      private

      def authenticate_admin!
        Rails.logger.info "BaseController auth check - current_admin: #{current_admin&.email || 'None'}"
        unless current_admin
          Rails.logger.warn "BaseController authentication failed - no current_admin"
          render json: { error: 'Unauthorized. Please login.' }, status: :unauthorized
          return false
        end
        Rails.logger.info "BaseController authentication successful for: #{current_admin.email}"
        true
      end

      def authorize_admin_access!(required_permission = nil)
        return false unless authenticate_admin!
        
        if required_permission && !current_admin.send(required_permission)
          render json: { error: 'Forbidden. You do not have permission to perform this action.' }, status: :forbidden
          return false
        end
        
        true
      end

      # Helper method for consistent error responses
      def render_error(message, status = :unprocessable_entity, details = nil)
        response = { error: message }
        response[:details] = details if details
        render json: response, status: status
      end

      # Helper method for consistent success responses
      def render_success(data = nil, message = nil)
        response = {}
        response[:data] = data if data
        response[:message] = message if message
        render json: response
      end
    end
  end
end 