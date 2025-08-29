module Api
  module Admin
    class PrizesController < BaseController
      before_action :set_event
      before_action :set_prize, only: [:show, :update, :destroy]
      
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
          # Log the activity
          log_activity('create', @prize, "Hadiah '#{@prize.name}' ditambahkan ke event '#{@event.name}'")
          
          render json: prize_to_json(@prize), status: :created
        else
          render json: { 
            errors: @prize.errors.full_messages,
            field_errors: @prize.errors.to_hash 
          }, status: :unprocessable_entity
        end
      end
      
      def update
        if @prize.update(prize_params)
          # Log the activity
          log_activity('update', @prize, "Hadiah '#{@prize.name}' diperbarui")
          
          render json: prize_to_json(@prize)
        else
          render json: { 
            errors: @prize.errors.full_messages,
            field_errors: @prize.errors.to_hash 
          }, status: :unprocessable_entity
        end
      end
      
      def destroy
        prize_name = @prize.name
        
        if @prize.destroy
          # Log the activity
          log_activity('delete', nil, "Hadiah '#{prize_name}' dihapus dari event '#{@event.name}'")
          
          render json: { message: "Hadiah berhasil dihapus" }
        else
          render json: { 
            errors: @prize.errors.full_messages,
            field_errors: @prize.errors.to_hash 
          }, status: :unprocessable_entity
        end
      end
      
      private
      
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
        # Handle both nested and direct parameters
        if params[:prize].present?
          params.require(:prize).permit(:name, :description, :quantity, :category, :image)
        else
          params.permit(:name, :description, :quantity, :category, :image)
        end
      end
      
      def prize_to_json(prize)
        # Use counter cache for optimal performance
        image_url = nil
        begin
          image_url = prize.image_url
        rescue => e
          Rails.logger.warn "Prize image URL error for prize #{prize.id}: #{e.message}"
        end
        
        {
          id: prize.id,
          name: prize.name,
          description: prize.description,
          category: prize.category,
          quantity: prize.quantity,
          eventId: prize.event_id,
          imageUrl: image_url,
          winningsCount: prize.winnings_count,
          remainingQuantity: prize.remaining_quantity,
          createdAt: prize.created_at,
          updatedAt: prize.updated_at
        }
      end
    end
  end
end 