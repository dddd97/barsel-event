module Api
  module Admin
    class EventsController < BaseController
      before_action :set_event, only: [:show, :update, :destroy, :winners]

      def index
        begin
          Rails.logger.info "Admin events index called"
          @events = Event.includes(:creator).order(created_at: :desc)
          Rails.logger.info "Found #{@events.count} events: #{@events.pluck(:id, :name)}"
          
          # For simple frontend usage, return array directly
          render json: @events.map { |event|
            # Temporarily disable banner URL to prevent crashes
            banner_url = nil # safe_banner_url(event)
          
          {
            id: event.id,
            name: event.name,
            eventDate: event.event_date,
            startTime: event.start_time ? "#{event.start_time.strftime('%H:%M')} WIB" : nil,
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
            creator: event.creator ? {
              id: event.creator.id,
              name: event.creator.name,
              email: event.creator.email
            } : nil,
            # Original snake_case fields for backward compatibility
            event_date: event.event_date,
            start_time: event.start_time ? "#{event.start_time.strftime('%H:%M')} WIB" : nil,
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
        }
        Rails.logger.info "Admin events index completed successfully with #{@events.count} events"
        rescue => e
          Rails.logger.error "=== ADMIN EVENTS INDEX ERROR ==="
          Rails.logger.error "Error loading admin events index: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          Rails.logger.error "Current admin: #{current_admin&.inspect}"
          Rails.logger.error "================================"
          render json: [], status: :ok # Return empty array to prevent frontend crashes
        end
      end

      def show
        begin
          banner_url = safe_banner_url(@event)
        
        render json: {
          id: @event.id,
          name: @event.name,
          eventDate: @event.event_date,
          startTime: @event.start_time ? "#{@event.start_time.strftime('%H:%M')} WIB" : nil,
          location: @event.location,
          description: @event.description,
          maxParticipants: @event.max_participants,
          registrationStatus: @event.registration_status,
          category: @event.category,
          participantsCount: @event.participants_count,
          availableSlots: @event.available_slots,
          registrationStart: @event.registration_start,
          registrationEnd: @event.registration_end,
          bannerUrl: banner_url,
          createdAt: @event.created_at,
          updatedAt: @event.updated_at,
          contactPerson1Name: @event.contact_person1_name,
          contactPerson1Phone: @event.contact_person1_phone,
          contactPerson2Name: @event.contact_person2_name,
          contactPerson2Phone: @event.contact_person2_phone,
          creator: {
            id: @event.creator.id,
            name: @event.creator.name,
            email: @event.creator.email
          },
          # Original snake_case fields for backward compatibility
          event_date: @event.event_date,
          max_participants: @event.max_participants,
          registration_status: @event.registration_status,
          participants_count: @event.participants_count,
          available_slots: @event.available_slots,
          registration_start: @event.registration_start,
          registration_end: @event.registration_end,
          banner_url: banner_url,
          created_at: @event.created_at,
          updated_at: @event.updated_at
        }
        rescue => e
          Rails.logger.error "Error showing admin event #{params[:id]}: #{e.message}"
          render json: {
            error: 'Event temporarily unavailable',
            message: 'Please try again later'
          }, status: :ok
        end
      end

      def create
        begin
          Rails.logger.info "=== EVENT CREATE START ==="
          Rails.logger.info "Raw params: #{params.inspect}"
          Rails.logger.info "Event params received: #{event_params.inspect}"
          Rails.logger.info "Current admin: #{current_admin.inspect}"
          
          @event = Event.new(event_params)
          @event.creator = current_admin # Fix: Assign creator
          
          Rails.logger.info "Event before save: #{@event.inspect}"
          Rails.logger.info "Event errors before save: #{@event.errors.full_messages}"
          
          # Test database connection before save
          ActiveRecord::Base.connection.execute("SELECT 1")
          Rails.logger.info "Database connection OK"
          
          if @event.save
            # Log the activity safely
            begin
              log_activity('create', @event, "Event '#{@event.name}' dibuat")
            rescue => log_error
              Rails.logger.warn "Failed to log event creation activity: #{log_error.message}"
            end
            
            # Get banner URL safely
            banner_url = safe_banner_url(@event)
            
            Rails.logger.info "=== EVENT CREATE SUCCESS ==="
            Rails.logger.info "Event saved successfully: ID=#{@event.id}, Name=#{@event.name}"
            
            render json: {
              id: @event.id,
              name: @event.name,
              eventDate: @event.event_date,
              startTime: @event.start_time ? "#{@event.start_time.strftime('%H:%M')} WIB" : nil,
              location: @event.location,
              description: @event.description,
              maxParticipants: @event.max_participants,
              registrationStatus: @event.registration_status,
              category: @event.category,
              participantsCount: @event.participants_count,
              availableSlots: @event.available_slots,
              registrationStart: @event.registration_start,
              registrationEnd: @event.registration_end,
              bannerUrl: banner_url,
              createdAt: @event.created_at,
              updatedAt: @event.updated_at,
              contactPerson1Name: @event.contact_person1_name,
              contactPerson1Phone: @event.contact_person1_phone,
              contactPerson2Name: @event.contact_person2_name,
              contactPerson2Phone: @event.contact_person2_phone,
              creator: {
                id: @event.creator.id,
                name: @event.creator.name,
                email: @event.creator.email
              }
            }, status: :created
          else
            Rails.logger.error "=== EVENT CREATE VALIDATION FAILED ==="
            Rails.logger.error "Event errors: #{@event.errors.full_messages}"
            Rails.logger.error "Event attributes: #{@event.attributes}"
            
            render json: { 
              errors: @event.errors.full_messages,
              field_errors: @event.errors.to_hash 
            }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "=== EVENT CREATE EXCEPTION ==="
          Rails.logger.error "Error creating event: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          
          render json: {
            error: 'Event creation failed',
            message: 'Please try again later',
            details: e.message
          }, status: :ok # Return 200 to prevent frontend crashes
        end
      end

      def update
        begin
          if @event.update(event_params)
            # Log the activity safely
            begin
              log_activity('update', @event, "Event '#{@event.name}' diperbarui")
            rescue => log_error
              Rails.logger.warn "Failed to log event update activity: #{log_error.message}"
            end
            
            # Get banner URL safely
            banner_url = safe_banner_url(@event)
          
          render json: {
            id: @event.id,
            name: @event.name,
            eventDate: @event.event_date,
            startTime: @event.start_time ? "#{@event.start_time.strftime('%H:%M')} WIB" : nil,
            location: @event.location,
            description: @event.description,
            maxParticipants: @event.max_participants,
            registrationStatus: @event.registration_status,
            category: @event.category,
            participantsCount: @event.participants_count,
            availableSlots: @event.available_slots,
            registrationStart: @event.registration_start,
            registrationEnd: @event.registration_end,
            bannerUrl: banner_url,
            createdAt: @event.created_at,
            updatedAt: @event.updated_at,
            contactPerson1Name: @event.contact_person1_name,
            contactPerson1Phone: @event.contact_person1_phone,
            contactPerson2Name: @event.contact_person2_name,
            contactPerson2Phone: @event.contact_person2_phone,
            creator: {
              id: @event.creator.id,
              name: @event.creator.name,
              email: @event.creator.email
            }
          }
          else
            render json: { 
              errors: @event.errors.full_messages,
              field_errors: @event.errors.to_hash 
            }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error "Error updating event #{params[:id]}: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          
          render json: {
            error: 'Event update failed',
            message: 'Please try again later',
            details: e.message
          }, status: :ok # Return 200 to prevent frontend crashes
        end
      end

      def destroy
        event_name = @event.name
        @event.destroy
        
        # Log the activity
        log_activity('delete', nil, "Event '#{event_name}' dihapus")
        
        head :no_content
      end
      
      def simple_create
        Rails.logger.info "=== SIMPLE CREATE TEST ==="
        
        # Create with minimal required fields
        event = Event.new(
          name: "Test Event #{Time.current.to_i}",
          event_date: 1.week.from_now.to_date,
          category: "utama",
          creator: current_admin
        )
        
        if event.save
          Rails.logger.info "Simple event created successfully: #{event.id}"
          render json: { success: true, event_id: event.id, event_name: event.name }
        else
          Rails.logger.error "Simple event creation failed: #{event.errors.full_messages}"
          render json: { success: false, errors: event.errors.full_messages }
        end
      end

      def debug_list
        Rails.logger.info "Debug list endpoint called"
        
        # Simple query without any complex logic
        events = Event.all.order(id: :desc).limit(10)
        
        render json: {
          total_count: Event.count,
          recent_events: events.map { |e|
            {
              id: e.id,
              name: e.name,
              created_at: e.created_at,
              event_date: e.event_date,
              creator_id: e.creator_id
            }
          }
        }
      end

      def winners
        @winnings = Winning.joins(participant: :event, prize: {})
                           .where(participants: { event_id: @event.id })
                           .includes(:participant, :prize)
                           .order(created_at: :desc)
        
        render json: @winnings.map { |winning|
          {
            id: winning.id,
            participantName: winning.participant.name,
            prizeName: winning.prize.name,
            prizeCategory: winning.prize.category,
            participantId: winning.participant.id,
            prizeId: winning.prize.id,
            registrationNumber: winning.participant.registration_number,
            institution: winning.participant.institution,
            email: winning.participant.email,
            phoneNumber: winning.participant.phone_number,
            createdAt: winning.created_at,
            # Legacy snake_case fields for backward compatibility
            participant_name: winning.participant.name,
            prize_name: winning.prize.name,
            created_at: winning.created_at
          }
        }
      end

      private

      def set_event
        @event = Event.find(params[:id])
      end

      def event_params
        # Enhanced parameter handling for both camelCase and snake_case
        permitted_params = {}
        
        if params[:event].present?
          # Handle nested event parameters (snake_case)
          event_data = params.require(:event).permit(
            :name, :event_date, :start_time, :location, :description,
            :max_participants, :category,
            :registration_start, :registration_end, :banner,
            :contact_person1_name, :contact_person1_phone,
            :contact_person2_name, :contact_person2_phone
          )
          permitted_params.merge!(event_data.to_h)
        else
          # Handle direct parameters (snake_case from frontend)
          snake_case_params = [
            'name', 'event_date', 'start_time', 'location', 'description',
            'max_participants', 'category',
            'registration_start', 'registration_end', 'banner',
            'contact_person1_name', 'contact_person1_phone',
            'contact_person2_name', 'contact_person2_phone'
          ]
          
          snake_case_params.each do |param|
            permitted_params[param] = params[param] if params[param].present?
          end
          
          # Also handle camelCase for backward compatibility
          camel_to_snake = {
            'name' => 'name',
            'eventDate' => 'event_date',
            'startTime' => 'start_time',
            'location' => 'location',
            'description' => 'description',
            'maxParticipants' => 'max_participants',
            'category' => 'category',
            'registrationStart' => 'registration_start',
            'registrationEnd' => 'registration_end',
            'banner' => 'banner',
            'contactPerson1Name' => 'contact_person1_name',
            'contactPerson1Phone' => 'contact_person1_phone',
            'contactPerson2Name' => 'contact_person2_name',
            'contactPerson2Phone' => 'contact_person2_phone'
          }
          
          camel_to_snake.each do |camel, snake|
            permitted_params[snake] = params[camel] if params[camel].present?
          end
        end
        
        permitted_params
      end

      def safe_banner_url(event)
        return nil unless event&.respond_to?(:banner_url)
        return nil unless event.banner.attached?
        
        begin
          event.banner_url
        rescue => e
          Rails.logger.warn "Banner URL error for event #{event.id}: #{e.message}"
          nil
        end
      rescue => e
        Rails.logger.error "Fatal banner URL error: #{e.message}"
        nil
      end

    end
  end
end
