module Api
  module Admin
    class PrizeDrawingsController < BaseController
      before_action :set_event
      before_action :set_prize, only: [:draw, :preview_draw, :confirm_winner, :reset]
      
      def statistics
        stats = {
          total_prizes: @event.prizes.count,
          total_drawings: @event.prizes.joins(:winnings).count,
          remaining_prizes: @event.prizes.sum(:quantity) - @event.prizes.joins(:winnings).count,
          total_participants: @event.participants.count,
          eligible_participants: eligible_participants_count
        }
        
        render json: stats
      end
      
      def eligible_participants
        # Get participants who haven't won any prizes for this event
        participants = @event.participants.where.not(
          id: Winning.joins(:prize).where(prizes: { event_id: @event.id }).select(:participant_id)
        )
        
        render json: participants.map { |participant|
          {
            id: participant.id,
            name: participant.name,
            registrationNumber: participant.registration_number,
            institution: participant.institution,
            email: participant.email,
            phoneNumber: participant.phone_number,
            createdAt: participant.created_at
          }
        }
      end
      
      def preview_draw
        # Similar to draw but doesn't save to database - just returns the selected winner
        
        # Check if the prize belongs to the event
        unless @prize.event_id == @event.id
          return render json: { error: 'Prize does not belong to this event' }, status: :bad_request
        end
        
        # Check if there are any participants
        if @event.participants.empty?
          return render json: { error: 'No participants in this event' }, status: :bad_request
        end
        
        # Check if the prize has already been awarded to the maximum quantity
        current_winnings_count = @prize.winnings.count
        Rails.logger.info "Prize #{@prize.id} (#{@prize.name}): #{current_winnings_count}/#{@prize.quantity} awarded"
        
        if current_winnings_count >= @prize.quantity
          return render json: { error: 'All prizes of this type have been awarded' }, status: :bad_request
        end
        
        # Get participants who haven't won any prizes for this event (consistent with eligible_participants method)
        already_won_any_prize_ids = Winning.joins(:prize).where(prizes: { event_id: @event.id }).select(:participant_id)
        eligible_participants = @event.participants.where.not(id: already_won_any_prize_ids)
        
        Rails.logger.info "Event #{@event.id} has #{@event.participants.count} total participants"
        Rails.logger.info "Participants who already won any prize in this event: #{already_won_any_prize_ids.map(&:participant_id).inspect}"
        Rails.logger.info "Eligible participants for any prize: #{eligible_participants.count}"
        
        if eligible_participants.empty?
          return render json: { 
            error: "Tidak ada peserta yang memenuhi syarat untuk undian. Semua peserta sudah memenangkan hadiah di event ini (sistem: satu peserta hanya bisa menang sekali per event).",
            details: {
              total_participants: @event.participants.count,
              participants_already_won_any_prize: already_won_any_prize_ids.count,
              prize_name: @prize.name
            }
          }, status: :bad_request
        end
        
        # Select a random participant using Ruby's secure random instead of SQL RANDOM()
        participants_array = eligible_participants.to_a
        random_index = SecureRandom.random_number(participants_array.length)
        winner = participants_array[random_index]
        
        Rails.logger.info "Selected winner preview: ID=#{winner.id}, Name=#{winner.name}, RegNumber=#{winner.registration_number}"
        
        # Return winner data WITHOUT creating winning record
        render json: {
          success: true,
          preview: true,
          winner: {
            id: winner.id,
            name: winner.name,
            registration_number: winner.registration_number,
            institution: winner.institution,
            email: winner.email,
            phone_number: winner.phone_number,
            nik: winner.nik
          },
          prize: {
            id: @prize.id,
            name: @prize.name,
            category: @prize.category,
            description: @prize.description
          }
        }
      rescue => e
        Rails.logger.error "Prize drawing preview error: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Internal server error during prize drawing preview' }, status: :internal_server_error
      end
      
      def confirm_winner
        # Confirm and save the winner to database
        participant_id = params[:participant_id]
        
        # Check if the prize belongs to the event
        unless @prize.event_id == @event.id
          return render json: { error: 'Prize does not belong to this event' }, status: :bad_request
        end
        
        # Find the participant
        winner = @event.participants.find(participant_id)
        
        # Double-check eligibility
        already_won_any_prize_ids = Winning.joins(:prize).where(prizes: { event_id: @event.id }).select(:participant_id)
        if already_won_any_prize_ids.include?(winner.id)
          return render json: { error: 'Participant has already won a prize in this event' }, status: :bad_request
        end
        
        # Create the winning record
        winning = Winning.create!(
          participant: winner,
          prize: @prize
        )
        
        # Log the activity
        log_activity('confirm_winner', @prize, "Hadiah '#{@prize.name}' dikonfirmasi untuk peserta '#{winner.name}'")
        
        render json: {
          success: true,
          confirmed: true,
          winner: {
            id: winner.id,
            name: winner.name,
            registration_number: winner.registration_number,
            institution: winner.institution,
            email: winner.email,
            phone_number: winner.phone_number,
            nik: winner.nik
          },
          prize: {
            id: @prize.id,
            name: @prize.name,
            category: @prize.category,
            description: @prize.description
          },
          winning: {
            id: winning.id,
            created_at: winning.created_at
          }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Participant not found' }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue => e
        Rails.logger.error "Winner confirmation error: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Internal server error during winner confirmation' }, status: :internal_server_error
      end

      def draw
        # Check if the prize belongs to the event
        unless @prize.event_id == @event.id
          return render json: { error: 'Prize does not belong to this event' }, status: :bad_request
        end
        
        # Check if there are any participants
        if @event.participants.empty?
          return render json: { error: 'No participants in this event' }, status: :bad_request
        end
        
        # Check if the prize has already been awarded to the maximum quantity
        current_winnings_count = @prize.winnings.count
        Rails.logger.info "Prize #{@prize.id} (#{@prize.name}): #{current_winnings_count}/#{@prize.quantity} awarded"
        
        if current_winnings_count >= @prize.quantity
          return render json: { error: 'All prizes of this type have been awarded' }, status: :bad_request
        end
        
        # Get participants who haven't won any prizes for this event (consistent with eligible_participants method)
        already_won_any_prize_ids = Winning.joins(:prize).where(prizes: { event_id: @event.id }).select(:participant_id)
        eligible_participants = @event.participants.where.not(id: already_won_any_prize_ids)
        
        Rails.logger.info "Event #{@event.id} has #{@event.participants.count} total participants"
        Rails.logger.info "Participants who already won any prize in this event: #{already_won_any_prize_ids.map(&:participant_id).inspect}"
        Rails.logger.info "Eligible participants for any prize: #{eligible_participants.count}"
        
        if eligible_participants.empty?
          return render json: { 
            error: "Tidak ada peserta yang memenuhi syarat untuk undian. Semua peserta sudah memenangkan hadiah di event ini (sistem: satu peserta hanya bisa menang sekali per event).",
            details: {
              total_participants: @event.participants.count,
              participants_already_won_any_prize: already_won_any_prize_ids.count,
              prize_name: @prize.name
            }
          }, status: :bad_request
        end
        
        # Select a random participant using Ruby's secure random instead of SQL RANDOM()
        participants_array = eligible_participants.to_a
        random_index = SecureRandom.random_number(participants_array.length)
        winner = participants_array[random_index]
        
        Rails.logger.info "Selected winner: ID=#{winner.id}, Name=#{winner.name}, RegNumber=#{winner.registration_number}"
        
        # Create the winning record
        winning = Winning.create!(
          participant: winner,
          prize: @prize
        )
        
        # Log the activity
        log_activity('draw_prize', @prize, "Hadiah '#{@prize.name}' diundi untuk peserta '#{winner.name}'")
        
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
            id: @prize.id,
            name: @prize.name,
            category: @prize.category,
            description: @prize.description
          },
          winning: {
            id: winning.id,
            created_at: winning.created_at
          }
        }
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      rescue => e
        Rails.logger.error "Prize drawing error: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Internal server error during prize drawing' }, status: :internal_server_error
      end
      
      def reset
        # Find all winnings for this prize and delete them
        winnings_count = @prize.winnings.count
        
        if winnings_count == 0
          return render json: { error: 'No winnings found for this prize' }, status: :bad_request
        end
        
        @prize.winnings.destroy_all
        
        # Log the activity
        log_activity('reset_prize', @prize, "Reset #{winnings_count} pemenang untuk hadiah '#{@prize.name}'")
        
        render json: {
          success: true,
          message: "Successfully reset #{winnings_count} winner(s) for prize '#{@prize.name}'",
          prize: {
            id: @prize.id,
            name: @prize.name,
            category: @prize.category,
            winningsCount: 0,
            remainingQuantity: @prize.quantity
          }
        }
      rescue => e
        Rails.logger.error "Prize reset error: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Internal server error during prize reset' }, status: :internal_server_error
      end
      
      private
      
      def set_event
        @event = Event.find(params[:event_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Event not found' }, status: :not_found
      end
      
      def set_prize
        # The :id parameter refers to the prize ID in this route structure
        @prize = @event.prizes.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Prize not found' }, status: :not_found
      end
      
      def eligible_participants_count
        @event.participants.where.not(
          id: Winning.joins(:prize).where(prizes: { event_id: @event.id }).select(:participant_id)
        ).count
      end
    end
  end
end
