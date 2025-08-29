module Api
  class PrizeDrawingsController < ApplicationController
    include SecurityHeaders
    include Auditable
    
    # Skip CSRF protection for API endpoints - this fixes prize drawing authentication issues
    skip_before_action :verify_authenticity_token
    before_action :authenticate_admin!
    before_action :authorize_drawing_access, only: [:draw, :reset]
    before_action :find_event
    before_action :find_prize, only: [:draw, :reset]
    
    def authenticate_admin!
      unless current_admin
        render json: { error: 'Unauthorized. Please login.' }, status: :unauthorized
        return false
      end
      true
    end
    
    def authorize_drawing_access
      unless current_admin&.can_draw_prizes?
        render json: { error: 'Unauthorized. You do not have permission to draw prizes.' }, status: :forbidden
        return false
      end
      true
    end
    
    def eligible_participants
      
      # Get participants who haven't won this specific prize yet
      @participants = @event.participants
                            .joins("LEFT JOIN winnings ON participants.id = winnings.participant_id AND winnings.prize_id = #{params[:prize_id]}")
                            .where(winnings: { id: nil })
                            .where.not(id: @event.forfeited_participants.select(:id))
                            .order(:registration_number)
      
      render json: {
        participants: @participants.map do |participant|
          {
            id: participant.id,
            name: participant.name,
            registration_number: participant.registration_number,
            institution: participant.institution
          }
        end,
        total_eligible: @participants.count
      }
    end
    
    def draw
      begin
        ActiveRecord::Base.transaction do
          # Check if prize is already fully drawn
          if @prize.drawn?
            render json: { error: 'Hadiah ini sudah diundi semua' }, status: :unprocessable_entity
            return
          end
          
          # Get eligible participants (not forfeited, not won this prize)
          eligible_participants = @event.participants
                                        .joins("LEFT JOIN winnings ON participants.id = winnings.participant_id AND winnings.prize_id = #{@prize.id}")
                                        .where(winnings: { id: nil })
                                        .where.not(id: @event.forfeited_participants.select(:id))
          
          if eligible_participants.empty?
            render json: { error: 'Tidak ada peserta yang tersisa untuk diundi' }, status: :unprocessable_entity
            return
          end
          
          # Generate slot machine animation data
          slot_data = generate_slot_animation_data(eligible_participants)
          
          # Select random winner
          winner = eligible_participants.sample
          
          # Create winning record
          @winning = Winning.create!(
            prize: @prize,
            participant: winner
          )
          
          # Log the drawing activity
          log_draw_prize(@prize, winner)
          
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
              category: @prize.category
            },
            slot_animation: slot_data,
            remaining_quantity: @prize.quantity - @prize.winnings.count,
            message: "Selamat! #{winner.name} (#{winner.registration_number}) memenangkan #{@prize.name}!"
          }
        end
      rescue => e
        Rails.logger.error "Prize drawing error: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Gagal mengundi hadiah', details: e.message }, status: :internal_server_error
      end
    end
    
    def reset
      begin
        ActiveRecord::Base.transaction do
          # Find and delete the latest winning for this prize
          latest_winning = @prize.winnings.order(created_at: :desc).first
          
          if latest_winning.nil?
            render json: { error: 'Hadiah ini belum diundi' }, status: :unprocessable_entity
            return
          end
          
          winner_name = latest_winning.participant.name
          latest_winning.destroy!
          
          # Log the reset activity
          log_reset_draw(@prize)
          
          render json: {
            success: true,
            message: "Undian hadiah #{@prize.name} berhasil direset. Pemenang sebelumnya: #{winner_name}",
            remaining_quantity: @prize.quantity - @prize.winnings.count
          }
        end
      rescue => e
        Rails.logger.error "Prize reset error: #{e.message}\n#{e.backtrace.join("\n")}"
        render json: { error: 'Gagal mereset undian', details: e.message }, status: :internal_server_error
      end
    end
    
    def statistics
      stats = {
        total_prizes: @event.prizes.count,
        drawn_prizes: @event.prizes.joins(:winnings).distinct.count,
        remaining_prizes: @event.prizes.sum(:quantity) - @event.winnings.count,
        total_participants: @event.participants.count,
        winners_count: @event.winners.count,
        categories: {
          utama: {
            total: @event.prizes.where(category: 'utama').sum(:quantity),
            drawn: @event.winnings.joins(:prize).where(prizes: { category: 'utama' }).count
          },
          reguler: {
            total: @event.prizes.where(category: 'reguler').sum(:quantity),
            drawn: @event.winnings.joins(:prize).where(prizes: { category: 'reguler' }).count
          }
        }
      }
      
      render json: stats
    end
    
    private
    
    def find_event
      @event = Event.find(params[:event_id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Event not found' }, status: :not_found
    end
    
    def find_prize
      @prize = @event.prizes.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Prize not found' }, status: :not_found
    end
    
    def generate_slot_animation_data(participants)
      # Create animation sequences for 4-slot machine (participant numbers only)
      # Format: 4 digits (0001-9999) extracted from registration numbers like "E1-0123"
      
      all_numbers = participants.pluck(:registration_number).map do |reg_num|
        # Extract the numeric part after the dash
        numeric_part = reg_num.split('-').last || reg_num
        # Ensure it's 4 digits
        numeric_part.rjust(4, '0')
      end.shuffle
      
      # Generate 4 reels for digits only
      {
        reel1: generate_digit_reel(all_numbers, 0), # First digit
        reel2: generate_digit_reel(all_numbers, 1), # Second digit  
        reel3: generate_digit_reel(all_numbers, 2), # Third digit
        reel4: generate_digit_reel(all_numbers, 3), # Fourth digit
        animation_duration: 4000, # 4 seconds total animation
        reel_delays: [0, 1000, 2000, 3000], # Stagger reel stops every second
        final_spin_duration: 1000 # Final dramatic spin
      }
    end
    
    def generate_digit_reel(numbers, position)
      # Create a sequence of digits for the slot reel animation
      sequence = []
      
      # Generate 40 items for smooth animation
      40.times do
        # Get a random number and extract digit at position
        random_number = numbers.sample
        if random_number && random_number.length > position
          sequence << random_number[position]
        else
          # Fallback to random digit
          sequence << rand(0..9).to_s
        end
      end
      
      sequence
    end
  end
end 