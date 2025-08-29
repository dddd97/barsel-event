module Api
  class PrizesController < ApplicationController
    # Skip CSRF protection for API endpoints - this fixes prizes authentication issues
    skip_before_action :verify_authenticity_token
    before_action :check_prizes_rate_limit, only: [:index]
    before_action :authenticate_admin!, only: [:create, :update, :destroy]
    before_action :set_event
    before_action :set_prize, only: [:show, :update, :destroy]
    
    # Simple rate limiting to prevent infinite polling loops
    @@prizes_requests = {}
    @@last_prizes_cleanup = Time.current
    
    def index
      # No need to preload winnings anymore since we use counter cache
      @prizes = @event.prizes.order(created_at: :asc)
      
      render json: @prizes.map { |prize| 
        prize_to_json(prize)
      }
    end
    
    def show
      render json: prize_to_json(@prize)
    end
    
    def create
      @prize = @event.prizes.new(prize_params)
      
      if @prize.save
        render json: prize_to_json(@prize), status: :created
      else
        render json: { errors: @prize.errors }, status: :unprocessable_entity
      end
    end
    
    def update
      if @prize.update(prize_params)
        render json: prize_to_json(@prize)
      else
        render json: { errors: @prize.errors }, status: :unprocessable_entity
      end
    end
    
    def destroy
      if @prize.destroy
        render json: { message: "Hadiah berhasil dihapus" }
      else
        render json: { errors: @prize.errors }, status: :unprocessable_entity
      end
    end
    
        private
    
    def check_prizes_rate_limit
      # Clean up old requests every hour
      if Time.current - @@last_prizes_cleanup > 1.hour
        @@prizes_requests.each do |client_id, requests|
          @@prizes_requests[client_id] = requests.select { |time| time > 1.minute.ago }
          @@prizes_requests.delete(client_id) if @@prizes_requests[client_id].empty?
        end
        @@last_prizes_cleanup = Time.current
      end
      
      # Use session ID + IP + event_id as client identifier  
      client_id = "#{session.id}-#{request.remote_ip}-#{params[:event_id]}"
      
      # Check rate limiting (max 15 requests per minute for prizes)
      @@prizes_requests[client_id] ||= []
      recent_requests = @@prizes_requests[client_id].select { |time| time > 1.minute.ago }
      
      if recent_requests.size >= 15
        Rails.logger.warn "Rate limit exceeded for prizes: #{client_id}"
        render json: { 
          error: 'Rate limit exceeded', 
          message: 'Too many prize requests, please wait',
          retry_after: 60,
          hint: 'Reduce polling frequency in PrizeManagement component'
        }, status: :too_many_requests
        return false
      end
      
      # Track this request
      @@prizes_requests[client_id] << Time.current
      true
    end
    
    def authenticate_admin!
      unless current_admin
        render json: { error: 'Unauthorized. Please login.' }, status: :unauthorized
        return false
      end
      true
    end

    def set_event
      @event = Event.find(params[:event_id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Event not found' }, status: :not_found
    end

    def set_prize
      @prize = @event.prizes.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Prize not found' }, status: :not_found
    end

    def prize_params
      params.require(:prize).permit(:name, :description, :quantity, :category)
    end
    
    def prize_to_json(prize)
      # Use counter cache for optimal performance
      {
        id: prize.id,
        name: prize.name,
        description: prize.description,
        category: prize.category,
        quantity: prize.quantity,
        eventId: prize.event_id,
        imageUrl: prize.image_url,
        winningsCount: prize.winnings_count,
        remainingQuantity: prize.remaining_quantity,
        createdAt: prize.created_at,
        updatedAt: prize.updated_at
      }
    end
  end
end 