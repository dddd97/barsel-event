module Api
  class EventsController < ApplicationController
    include ErrorHandler
    
    # Skip CSRF protection only for public read-only endpoints
    skip_before_action :verify_authenticity_token, only: [:index, :show]
    before_action :check_events_rate_limit, only: [:index]
    before_action :authenticate_admin, only: [:admin_index, :draw]
    
    # Simple rate limiting to prevent infinite polling loops
    @@events_requests = {}
    @@last_events_cleanup = Time.current
    
    def index
      Rails.logger.info "API /events: Session ID: #{session.id}, Admin ID: #{session[:admin_id]}"
      
      begin
        # Safer query with comprehensive error handling
        @events = load_events_safely
        
        if @events.nil?
          return render json: [], status: :ok
        end
        
        # Pre-generate banner URLs in batch with comprehensive error handling
        response_data = @events.map do |event|
          # Use small size for listing, medium for hero images will be handled separately
          banner_url = get_safe_banner_url(event, size: :small)
          format_event_response(event, banner_url)
        end
        
        render json: response_data
      rescue => e
        Rails.logger.error "Fatal error in /api/events: #{e.message}\n#{e.backtrace.join("\n")}"
        
        # Return empty array instead of error to prevent frontend crashes
        render json: [], status: :ok
      end
    end

    def show
      begin
        @event = Event.includes(:creator).find(params[:id])
        
        # Use medium size for individual event details
        banner_url = get_safe_banner_url(@event, size: :medium)
        response_data = format_event_response(@event, banner_url)
        
        # Add creator information for show endpoint
        response_data[:creator] = @event.creator ? {
          id: @event.creator.id,
          name: @event.creator.name,
          email: @event.creator.email,
          profilePhoto: safe_profile_photo_url(@event.creator)
        } : nil
        
        render json: response_data
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Event not found' }, status: :not_found
      rescue => e
        Rails.logger.error "Error in /api/events/#{params[:id]}: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { 
          error: 'Event temporarily unavailable',
          message: 'Please try again later'
        }, status: :ok
      end
    end

    def winners
      @event = Event.find(params[:id])
      @winnings = Winning.joins(participant: :event, prize: {})
                         .where(participants: { event_id: @event.id })
                         .select('winnings.id, participants.name as participant_name, prizes.name as prize_name, winnings.created_at')
      
      render json: @winnings
    end
    
    def admin_index
      begin
        @events = Event.includes(:creator).with_attached_banner.select(
          :id, :name, :event_date, :start_time, :location, :description,
          :max_participants, :category, :participants_count,
          :registration_start, :registration_end, :created_at,
          :updated_at, :contact_person1_name, :contact_person1_phone,
          :contact_person2_name, :contact_person2_phone, :creator_id
        )
        
        response_data = @events.map do |event|
          banner_url = get_safe_banner_url(event)
          format_event_response(event, banner_url)
        end
        
        render json: response_data
      rescue => e
        Rails.logger.error "Error in admin events index: #{e.message}"
        render json: [], status: :ok
      end
    end
    
    def draw
      @event = Event.find(params[:id])
      prize = Prize.find(params[:prize_id])
      
      # Check if the prize belongs to the event
      unless prize.event_id == @event.id
        return render json: { error: 'Prize does not belong to this event' }, status: :bad_request
      end
      
      # Check if there are any participants
      if @event.participants.empty?
        return render json: { error: 'No participants in this event' }, status: :bad_request
      end
      
      # Check if the prize has already been awarded to the maximum quantity
      if prize.winnings.count >= prize.quantity
        return render json: { error: 'All prizes of this type have been awarded' }, status: :bad_request
      end
      
      # Get participants who haven't won this prize
      eligible_participants = @event.participants.where.not(
        id: Winning.where(prize_id: prize.id).select(:participant_id)
      )
      
      if eligible_participants.empty?
        return render json: { error: 'No eligible participants for this prize' }, status: :bad_request
      end
      
      # Select a random participant
      winner = eligible_participants.order('RANDOM()').first
      
      # Create the winning record
      winning = Winning.create!(
        participant: winner,
        prize: prize
      )
      
      render json: {
        success: true,
        winner: {
          id: winner.id,
          name: winner.name,
          registration_number: winner.registration_number,
          institution: winner.institution,
          email: winner.email,
          phone_number: winner.phone_number
        },
        prize: {
          id: prize.id,
          name: prize.name,
          category: prize.category
        },
        winning: {
          id: winning.id,
          created_at: winning.created_at
        }
      }
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Event or prize not found' }, status: :not_found
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
    
    private
    
    def load_events_safely
      begin
        Event.includes(banner_attachment: :blob)
             .ordered_by_category
             .select(
               :id, :name, :event_date, :start_time, :location, :description,
               :max_participants, :category, :participants_count,
               :registration_start, :registration_end, :created_at,
               :updated_at, :contact_person1_name, :contact_person1_phone,
               :contact_person2_name, :contact_person2_phone
             )
      rescue => e
        Rails.logger.error "Error loading events: #{e.message}"
        begin
          # Fallback: simpler query without includes
          Event.ordered_by_category
               .select(
                 :id, :name, :event_date, :start_time, :location, :description,
                 :max_participants, :category, :participants_count,
                 :registration_start, :registration_end, :created_at,
                 :updated_at, :contact_person1_name, :contact_person1_phone,
                 :contact_person2_name, :contact_person2_phone
               )
        rescue => fallback_error
          Rails.logger.error "Fallback events query also failed: #{fallback_error.message}"
          nil
        end
      end
    end

    def get_safe_banner_url(event, size: :medium)
      return nil unless event.respond_to?(:banner) && event.banner.attached?
      
      begin
        # Try optimized version first (fixed variant processing)
        optimized_url = event.optimized_banner_url(size: size)
        return optimized_url if optimized_url
        
        # Fallback to original banner_url
        event.banner_url
      rescue => banner_error
        Rails.logger.warn "Banner URL error for event #{event.id}: #{banner_error.message}"
        Rails.logger.warn banner_error.backtrace.join("\n")
        nil
      end
    rescue => e
      Rails.logger.error "Fatal banner error for event #{event&.id}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      nil
    end

    def safe_profile_photo_url(admin)
      return nil unless admin&.respond_to?(:profile_photo_url)
      
      begin
        admin.profile_photo_url
      rescue => e
        Rails.logger.warn "Profile photo error for admin #{admin.id}: #{e.message}"
        nil
      end
    rescue => e
      Rails.logger.error "Fatal profile photo error: #{e.message}"
      nil
    end
    
    def check_events_rate_limit
      # Clean up old requests every hour
      if Time.current - @@last_events_cleanup > 1.hour
        @@events_requests.each do |client_id, requests|
          @@events_requests[client_id] = requests.select { |time| time > 1.minute.ago }
          @@events_requests.delete(client_id) if @@events_requests[client_id].empty?
        end
        @@last_events_cleanup = Time.current
      end
      
      # Use session ID + IP as client identifier  
      client_id = "#{session.id}-#{request.remote_ip}"
      
      # Check rate limiting (max 20 requests per minute for events)
      @@events_requests[client_id] ||= []
      recent_requests = @@events_requests[client_id].select { |time| time > 1.minute.ago }
      
      if recent_requests.size >= 20
        Rails.logger.warn "Rate limit exceeded for events: #{client_id}"
        render json: { 
          error: 'Rate limit exceeded', 
          message: 'Too many events requests, please wait',
          retry_after: 60,
          hint: 'Reduce polling frequency in EventManagement component'
        }, status: :too_many_requests
        return false
      end
      
      # Track this request
      @@events_requests[client_id] << Time.current
      true
    end
    
    def authenticate_admin
      Rails.logger.info "API Events authenticate_admin: Session ID: #{session.id}, Admin ID: #{session[:admin_id]}"
      Rails.logger.info "API Events authenticate_admin: Session data: #{session.to_hash}"
      Rails.logger.info "API Events authenticate_admin: Current admin: #{current_admin&.inspect}"
      unless current_admin
        Rails.logger.warn "API Events authentication failed: No current_admin found"
        render_unauthorized('Unauthorized')
      end
    end
    
    def format_event_response(event, banner_url)
      {
        id: event.id,
        name: event.name,
        eventDate: event.event_date,
        startTime: event.start_time,
        location: event.location,
        description: event.description,
        maxParticipants: event.max_participants,
        registrationStatus: event.registration_status,
        category: event.category,
        participantsCount: event.participants_count,
        availableSlots: event.available_slots,
        registrationStart: event.registration_start,
        registrationEnd: event.registration_end,
        bannerUrl: banner_url,
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        contactPerson1Name: event.contact_person1_name,
        contactPerson1Phone: event.contact_person1_phone,
        contactPerson2Name: event.contact_person2_name,
        contactPerson2Phone: event.contact_person2_phone,
        
        # Original snake_case fields for backward compatibility
        event_date: event.event_date,
        start_time: event.start_time,
        max_participants: event.max_participants,
        registration_status: event.registration_status,
        participants_count: event.participants_count,
        available_slots: event.available_slots,
        registration_start: event.registration_start,
        registration_end: event.registration_end,
        banner_url: banner_url,
        created_at: event.created_at,
        updated_at: event.updated_at
      }
    end
  end
end 