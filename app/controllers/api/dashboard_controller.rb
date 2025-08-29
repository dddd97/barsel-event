module Api
  class DashboardController < ApplicationController
    include SecurityHeaders
    include Auditable
    include ErrorHandler
    include ActionController::Live
    
    # Load custom exception
    require_relative '../concerns/client_disconnected'
    
    # Skip CSRF protection for API endpoints - this fixes dashboard authentication issues
    skip_before_action :verify_authenticity_token
    before_action :authenticate_admin!
    before_action :check_rate_limit, only: [:stats]
    
    # Simple rate limiting to prevent infinite polling loops
    @@stats_requests = {}
    @@last_cleanup = Time.current
    
    def stats
      begin
        Rails.logger.info "Dashboard stats requested by admin: #{current_admin&.email}"
        
        # Optimized dashboard statistics with error handling
        stats_data = optimized_dashboard_stats_with_fallback
        
        stats = {
          events: {
            total: stats_data['total_events'] || 0,
            active: stats_data['active_events'] || 0,
            participants_today: stats_data['participants_today'] || 0
          },
          participants: {
            total: stats_data['total_participants'] || 0,
            today: stats_data['participants_today'] || 0,
            this_week: stats_data['participants_this_week'] || 0
          },
          prizes: {
            total: stats_data['total_prizes'] || 0,
            drawn: stats_data['total_winnings'] || 0,
            remaining: [stats_data['remaining_prizes'] || 0, 0].max
          },
          recent_activities: safe_recent_activities_data,
          recent_registrations: recent_registrations_data
        }
        
        Rails.logger.info "Dashboard stats successfully generated"
        render json: stats
        
      rescue => e
        Rails.logger.error "Dashboard stats error: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        
        # Return minimal safe data instead of 500 error
        render json: {
          events: { total: 0, active: 0, participants_today: 0 },
          participants: { total: 0, today: 0, this_week: 0 },
          prizes: { total: 0, drawn: 0, remaining: 0 },
          recent_activities: [],
          error: "Dashboard temporarily unavailable",
          timestamp: Time.current.iso8601
        }, status: :ok # Return 200 instead of 500 to prevent frontend crashes
      end
    end
    
    def events
      # Server-Sent Events stream for real-time updates
      response.headers['Content-Type'] = 'text/event-stream'
      response.headers['Cache-Control'] = 'no-cache'
      response.headers['Connection'] = 'keep-alive'
      response.headers['X-Accel-Buffering'] = 'no' # Disable nginx buffering
      
      # Important: Set CORS headers for EventSource
      if request.headers['Origin']
        response.headers['Access-Control-Allow-Origin'] = request.headers['Origin']
        response.headers['Access-Control-Allow-Credentials'] = 'true'
      end
      
      begin
        # Send connection info with longer retry interval to prevent infinite loops
        response.stream.write("retry: 30000\n") # 30 seconds retry to prevent loops
        response.stream.write("data: connected\n\n")
        response.stream.flush
      rescue => e
        Rails.logger.error "Failed to send initial SSE data: #{e.message}"
        return
      end
      
      # Send initial data with error handling
      begin
        send_event('initial', dashboard_data)
      rescue => e
        Rails.logger.warn "Error sending initial SSE data: #{e.message}"
        send_event('error', { message: 'Failed to load initial data', retry_in: 30 }) rescue nil
        return
      end
      
      # Keep connection alive with circuit breaker pattern
      begin
        last_update = Time.current
        max_runtime = 5.minutes # Even shorter to prevent long-running issues
        start_time = Time.current
        error_count = 0
        max_errors = 3
        
        loop do
          break if (Time.current - start_time) > max_runtime
          break if error_count >= max_errors # Circuit breaker
          
          sleep 30 # Longer sleep to reduce load (30 seconds)
          
          # Check if there are new updates with circuit breaker
          begin
            if has_updates_since?(last_update)
              send_event('update', dashboard_data)
              last_update = Time.current
              error_count = 0 # Reset error count on success
            end
          rescue => e
            error_count += 1
            Rails.logger.warn "Error checking for updates (#{error_count}/#{max_errors}): #{e.message}"
            
            if error_count >= max_errors
              send_event('error', { message: 'Too many errors, closing connection', retry_in: 60 }) rescue nil
              break
            end
          end
          
          # Send heartbeat every 5 minutes only
          if ((Time.current - start_time).to_i % 300) == 0 # Every 5 minutes
            begin
              send_event('heartbeat', { timestamp: Time.current.to_i, errors: error_count })
            rescue => e
              Rails.logger.debug "Heartbeat failed, client disconnected: #{e.message}"
              break
            end
          end
        end
      rescue IOError, Errno::EPIPE, ClientDisconnected
        # Client disconnected - expected behavior
        Rails.logger.debug "Dashboard SSE client disconnected gracefully"
      rescue => e
        Rails.logger.warn "Dashboard SSE fatal error: #{e.message}"
        send_event('error', { message: 'Connection terminated', retry_in: 60 }) rescue nil
      ensure
        begin
          response.stream.close
        rescue => e
          Rails.logger.debug "Error closing SSE stream: #{e.message}"
        end
        Rails.logger.debug "Dashboard SSE connection closed (errors: #{error_count})"
      end
    end
    
    private
    
    def optimized_dashboard_stats_with_fallback
      cache_key = "dashboard_stats_#{Date.current}"
      
      SafeCache.fetch(cache_key, expires_in: 5.minutes) do
        begin
          # Try optimized query first
          today_start = Date.current.beginning_of_day
          today_end = Date.current.end_of_day
          week_ago = 1.week.ago
          
          # Simplified query without WITH clause for better compatibility
          stats = ActiveRecord::Base.connection.exec_query(
            "SELECT 
              (SELECT COUNT(*) FROM events) as total_events,
              (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as active_events,
              (SELECT COUNT(*) FROM participants) as total_participants,
              (SELECT COUNT(*) FROM participants WHERE created_at >= $1 AND created_at <= $2) as participants_today,
              (SELECT COUNT(*) FROM participants WHERE created_at >= $3) as participants_this_week,
              (SELECT COUNT(*) FROM prizes) as total_prizes,
              (SELECT COALESCE(SUM(quantity), 0) FROM prizes) as total_prize_quantity,
              (SELECT COUNT(*) FROM winnings) as total_winnings",
            'Dashboard Statistics Simple',
            [today_start, today_end, week_ago]
          ).first
          
          if stats
            stats['remaining_prizes'] = [stats['total_prize_quantity'].to_i - stats['total_winnings'].to_i, 0].max
            stats
          else
            raise "Query returned no results"
          end
          
        rescue => e
          Rails.logger.warn "Optimized dashboard query failed: #{e.message}, falling back to individual queries"
          
          # Fallback to safe individual queries
          safe_individual_stats
        end
      end
    rescue => e
      Rails.logger.error "Dashboard stats cache error: #{e.message}"
      safe_individual_stats
    end
    
    def check_rate_limit
      # Clean up old requests every hour
      if Time.current - @@last_cleanup > 1.hour
        @@stats_requests.each do |client_id, requests|
          @@stats_requests[client_id] = requests.select { |time| time > 1.minute.ago }
          @@stats_requests.delete(client_id) if @@stats_requests[client_id].empty?
        end
        @@last_cleanup = Time.current
      end
      
      # Use session ID + IP as client identifier
      client_id = "#{session.id}-#{request.remote_ip}"
      
      # Check rate limiting (max 20 requests per minute per client)
      @@stats_requests[client_id] ||= []
      recent_requests = @@stats_requests[client_id].select { |time| time > 1.minute.ago }
      
      if recent_requests.size >= 20
        Rails.logger.warn "Rate limit exceeded for dashboard stats: #{client_id}"
        render json: { 
          error: 'Rate limit exceeded', 
          message: 'Too many requests, please wait',
          retry_after: 60 
        }, status: :too_many_requests
        return false
      end
      
      # Track this request
      @@stats_requests[client_id] << Time.current
      true
    end
    
    def authenticate_admin!
      unless current_admin
        Rails.logger.warn "Dashboard authentication failed - no current_admin (Session: #{session.id})"
        render json: { error: 'Not authenticated' }, status: :unauthorized
        return false
      end
      
      Rails.logger.debug "Dashboard authentication successful for: #{current_admin.email}"
      true
    end
    
    def send_event(event_type, data)
      response.stream.write("event: #{event_type}\n")
      response.stream.write("data: #{data.to_json}\n\n")
      response.stream.flush rescue nil
    end
    
    def dashboard_data
      # Use optimized stats for SSE data too
      stats_data = optimized_dashboard_stats
      
      {
        timestamp: Time.current.to_i,
        events_count: stats_data['total_events'],
        participants_count: stats_data['total_participants'],
        active_events: stats_data['active_events'],
        recent_registrations: recent_registrations_data,
        recent_logins: recent_logins_data,
        system_alerts: system_alerts_data
      }
    end
    
    def has_updates_since?(timestamp)
      # Single optimized query using UNION to check for any updates
      ActiveRecord::Base.connection.exec_query(
        "SELECT 1 FROM (
          SELECT 1 FROM participants WHERE created_at > $1 LIMIT 1
          UNION ALL
          SELECT 1 FROM events WHERE updated_at > $1 LIMIT 1
          UNION ALL
          SELECT 1 FROM audit_logs WHERE created_at > $1 LIMIT 1
        ) updates LIMIT 1",
        'Dashboard Updates Check',
        [timestamp]
      ).present?
    end
    
    def safe_individual_stats
      today_start = Date.current.beginning_of_day
      today_end = Date.current.end_of_day
      week_ago = 1.week.ago
      
      {
        'total_events' => Event.count,
        'active_events' => Event.where('event_date >= ?', Date.current).count,
        'total_participants' => Participant.count,
        'participants_today' => Participant.where(created_at: today_start..today_end).count,
        'participants_this_week' => Participant.where(created_at: week_ago..Time.current).count,
        'total_prizes' => Prize.count,
        'total_winnings' => Winning.count,
        'remaining_prizes' => [Prize.sum(:quantity) - Winning.count, 0].max
      }
    rescue => e
      Rails.logger.error "Individual stats query failed: #{e.message}"
      # Return zeros if all else fails
      {
        'total_events' => 0,
        'active_events' => 0,
        'total_participants' => 0,
        'participants_today' => 0,
        'participants_this_week' => 0,
        'total_prizes' => 0,
        'total_winnings' => 0,
        'remaining_prizes' => 0
      }
    end

    def safe_recent_activities_data
      begin
        AuditLog.includes(:admin)
                .where.not(admin: nil) # Exclude orphaned records
                .recent
                .limit(10)
                .map do |log|
                  {
                    id: log.id,
                    admin_name: log.admin&.name || 'Unknown Admin',
                    action_display_name: log.action_display_name || log.action,
                    resource_display_name: log.resource_display_name || 'Unknown Resource',
                    created_at: log.created_at,
                    ip_address: log.ip_address || 'unknown'
                  }
                end
      rescue => e
        Rails.logger.error "Recent activities query failed: #{e.message}"
        []
      end
    end

    def recent_activities_data
      safe_recent_activities_data
    end
    
    def recent_registrations_data
      Participant.includes(:event)
                 .order(created_at: :desc)
                 .limit(5)
                 .map do |participant|
                   {
                     id: participant.id,
                     name: participant.name,
                     event_name: participant.event.name,
                     registration_number: participant.registration_number,
                     created_at: participant.created_at
                   }
                 end
    end
    
    def recent_logins_data
      AuditLog.where(action: 'login')
              .includes(:admin)
              .recent
              .limit(5)
              .map do |log|
                {
                  admin_name: log.admin.name,
                  ip_address: log.ip_address,
                  created_at: log.created_at
                }
              end
    end
    
    def system_alerts_data
      alerts = []
      
      # Check for events with high registration rates
      Event.where('event_date >= ?', Date.current).each do |event|
        if event.max_participants && event.participants_count >= (event.max_participants * 0.9)
          alerts << {
            type: 'warning',
            message: "Event '#{event.name}' hampir mencapai kapasitas maksimum (#{event.participants_count}/#{event.max_participants})",
            event_id: event.id
          }
        end
      end
      
      # Check for recent failed login attempts
      failed_attempts = AuditLog.where(action: 'login', created_at: 1.hour.ago..Time.current)
                               .joins("LEFT JOIN admins ON audit_logs.admin_id = admins.id")
                               .where(admins: { id: nil })
                               .count
      
      if failed_attempts > 10
        alerts << {
          type: 'danger',
          message: "#{failed_attempts} percobaan login gagal dalam 1 jam terakhir",
          action: 'view_audit_logs'
        }
      end
      
      alerts
    end
  end
end 