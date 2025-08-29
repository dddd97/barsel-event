module AdminPanel
  class LiveDrawingsController < AdminPanel::BaseController
    before_action :set_event
    
    def show
      @prizes = @event.prizes.includes(winnings: :participant).ordered_by_category
      @total_participants = @event.participants.count
      @remaining_participants = @event.participants.where.not(id: ineligible_participant_ids).count
      @drawn_prizes = @event.prizes.joins(:winnings).distinct.count
      @remaining_prizes = @event.prizes.left_joins(:winnings).where(winnings: { id: nil }).count
    end

    def draw_prize
      @prize = @event.prizes.find(params[:prize_id])
      
      if @prize.drawn?
        render json: { error: "Hadiah ini sudah diundi" }, status: :unprocessable_entity
        return
      end

      eligible_participants = @event.participants.where.not(id: ineligible_participant_ids)

      if eligible_participants.empty?
        render json: { error: "Tidak ada peserta yang tersisa untuk diundi" }, status: :unprocessable_entity
        return
      end

      winner = eligible_participants.sample
      
      winning = Winning.new(prize: @prize, participant: winner)
      
      if winning.save
        render json: {
          success: true,
          winner: {
            name: winner.name,
            number: winner.registration_number,
            prize_name: @prize.name
          },
          remaining_participants: eligible_participants.count - 1,
          remaining_prizes: @event.prizes.left_joins(:winnings).where(winnings: { id: nil }).count
        }
      else
        render json: { error: "Gagal mengundi hadiah" }, status: :unprocessable_entity
      end
    end

    def reset_prize
      @prize = @event.prizes.find(params[:prize_id])
      
      winnings = @prize.winnings
      if winnings.any?
        winner_names = winnings.map { |w| w.participant.name }.join(", ")
        
        if winnings.destroy_all
          render json: {
            success: true,
            message: "Undian untuk hadiah '#{@prize.name}' (Pemenang: #{winner_names}) berhasil direset.",
            prize_id: @prize.id
          }
        else
          render json: { error: "Gagal mereset undian" }, status: :unprocessable_entity
        end
      else
        render json: { error: "Hadiah ini belum diundi" }, status: :unprocessable_entity
      end
    end

    private

    def set_event
      @event = Event.find(params[:event_id])
    end

    def ineligible_participant_ids
      # Ambil ID peserta yang sudah menang
      winner_ids = Winning.joins(:prize).where(prizes: { event_id: @event.id }).pluck(:participant_id)
      # Ambil ID peserta yang didiskualifikasi
      forfeited_ids = @event.forfeitures.pluck(:participant_id)
      
      (winner_ids + forfeited_ids).uniq
    end
  end
end 