module Api
  class AuditLogsController < ApplicationController
    include SecurityHeaders
    include Auditable
    
    # Skip CSRF protection for API endpoints - this fixes audit logs authentication issues
    skip_before_action :verify_authenticity_token
    before_action :authenticate_admin!
    before_action :authorize_audit_access!
    
    def index
      @audit_logs = AuditLog.includes(:admin, :resource)
                           .recent
                           .page(params[:page] || 1)
                           .per(params[:per_page] || 25)
      
      # Apply filters
      @audit_logs = @audit_logs.by_admin(params[:admin_id]) if params[:admin_id].present?
      @audit_logs = @audit_logs.by_action(params[:action_filter]) if params[:action_filter].present?
      @audit_logs = @audit_logs.by_resource_type(params[:resource_type]) if params[:resource_type].present?
      
      # Filter by date range if provided
      if params[:start_date].present? && params[:end_date].present?
        @audit_logs = @audit_logs.where(created_at: params[:start_date]..params[:end_date])
      end
      
      render json: {
        audit_logs: @audit_logs.map do |log|
          {
            id: log.id,
            admin: {
              id: log.admin.id,
              name: log.admin.name,
              email: log.admin.email,
              role: log.admin.role
            },
            action: log.action,
            action_display_name: log.action_display_name,
            resource_type: log.resource_type,
            resource_type_display_name: log.resource_type_display_name,
            resource_display_name: log.resource_display_name,
            details: log.details,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            created_at: log.created_at
          }
        end,
        pagination: {
          current_page: @audit_logs.current_page,
          total_pages: @audit_logs.total_pages,
          total_count: @audit_logs.total_count,
          per_page: @audit_logs.limit_value
        },
        filters: {
          actions: AuditLog::ACTIONS.keys,
          resource_types: AuditLog.distinct.pluck(:resource_type).compact,
          # Fix: Use ::Admin instead of Admin to avoid namespace conflict
          admins: ::Admin.select(:id, :name, :email).map { |a| { id: a.id, name: a.name, email: a.email } }
        }
      }
    end
    
    def stats
      # Calculate statistics
      total_logs = AuditLog.count
      logs_today = AuditLog.today.count
      logs_this_week = AuditLog.this_week.count
      
      # Most active admins (top 5)
      most_active_admin = AuditLog.joins(:admin)
                                 .group('admins.name')
                                 .count
                                 .sort_by { |_, count| -count }
                                 .first(5)
                                 .map { |name, count| { name: name, activityCount: count } }
      
      # Most common actions (top 10)
      most_common_actions = AuditLog.group(:action)
                                   .count
                                   .sort_by { |_, count| -count }
                                   .first(10)
                                   .map { |action, count| { action: action, count: count } }
      
      # Recent logins (last 10)
      recent_logins = AuditLog.includes(:admin)
                             .where(action: 'login')
                             .order(created_at: :desc)
                             .limit(10)
                             .map do |log|
        {
          adminName: log.admin.name,
          ipAddress: log.ip_address,
          createdAt: log.created_at
        }
      end
      
      render json: {
        totalLogs: total_logs,
        logsToday: logs_today,
        logsThisWeek: logs_this_week,
        mostActiveAdmin: most_active_admin,
        mostCommonActions: most_common_actions,
        recentLogins: recent_logins
      }
    end
    
    def show
      @audit_log = AuditLog.find(params[:id])
      
      render json: {
        id: @audit_log.id,
        admin: {
          id: @audit_log.admin.id,
          name: @audit_log.admin.name,
          email: @audit_log.admin.email,
          role: @audit_log.admin.role
        },
        action: @audit_log.action,
        action_display_name: @audit_log.action_display_name,
        resource: @audit_log.resource ? {
          type: @audit_log.resource_type,
          id: @audit_log.resource_id,
          display_name: @audit_log.resource_display_name
        } : nil,
        details: @audit_log.details,
        ip_address: @audit_log.ip_address,
        user_agent: @audit_log.user_agent,
        created_at: @audit_log.created_at
      }
    end
    

    
    private
    
    def authenticate_admin!
      unless current_admin
        render json: { error: 'Not authenticated' }, status: :unauthorized
      end
    end
    
    def authorize_audit_access!
      unless current_admin.can_view_audit_logs?
        render json: { error: 'Unauthorized. You do not have permission to view audit logs.' }, status: :forbidden
      end
    end
    
    def most_active_admin_stats
      admin_counts = AuditLog.joins(:admin)
                            .group('admins.name')
                            .count
                            .sort_by { |_, count| -count }
                            .first(5)
      
      admin_counts.map { |name, count| { name: name, activity_count: count } }
    end
    
    def most_common_actions_stats
      AuditLog.group(:action)
              .count
              .sort_by { |_, count| -count }
              .first(10)
              .map { |action, count| { action: action, count: count } }
    end
    
    def recent_login_stats
      AuditLog.where(action: 'login')
              .includes(:admin)
              .recent
              .limit(10)
              .map do |log|
                {
                  admin_name: log.admin.name,
                  ip_address: log.ip_address,
                  created_at: log.created_at
                }
              end
    end
  end
end 