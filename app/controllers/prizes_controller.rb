class PrizesController < ApplicationController
  before_action :set_event
  before_action :set_prize, only: [ :draw, :reset_draw, :forfeit_and_redraw ]

  def index
    @prizes = @event.prizes.includes(winnings: :participant).ordered_by_category
    @prize = @event.prizes.new
  end

  def create
    @prize = @event.prizes.new(prize_params)
    if @prize.save
      redirect_to event_prizes_path(@event), notice: "Hadiah berhasil ditambahkan."
    else
      @prizes = @event.prizes.includes(winnings: :participant).order(created_at: :asc)
      render :index, status: :unprocessable_entity
    end
  end

  def draw
    if @prize.winnings.any?
      return redirect_to event_prizes_path(@event), alert: "Hadiah ini sudah diundi."
    end

    eligible_participants = @event.participants.where.not(id: ineligible_participant_ids)

    if eligible_participants.empty?
      return redirect_to event_prizes_path(@event), alert: "Tidak ada peserta yang tersisa untuk diundi."
    end
    
    winners_to_draw_count = [@prize.quantity, eligible_participants.count].min
    winners = eligible_participants.sample(winners_to_draw_count)

    notice = ""
    ActiveRecord::Base.transaction do
      first_winner = winners.shift
      Winning.create!(prize: @prize, participant: first_winner)

      winners.each do |winner|
        new_prize = @prize.dup
        new_prize.save!
        Winning.create!(prize: new_prize, participant: winner)
      end
      
      if winners_to_draw_count > 1
        notice = "#{winners_to_draw_count} pemenang berhasil diundi untuk hadiah '#{@prize.name}'."
      else
        notice = "Pemenang untuk '#{@prize.name}' berhasil diundi: #{first_winner.name} (No. #{first_winner.registration_number})."
      end
    end

    redirect_to event_prizes_path(@event), notice: notice
  rescue ActiveRecord::RecordInvalid => e
    redirect_to event_prizes_path(@event), alert: "Terjadi kesalahan saat mengundi: #{e.message}"
  end

  def draw_all
    undrawn_prizes = @event.prizes.left_joins(:winnings).where(winnings: { id: nil })
    
    if undrawn_prizes.empty?
      return redirect_to event_prizes_path(@event), alert: "Semua hadiah sudah diundi."
    end

    available_participants = @event.participants.where.not(id: ineligible_participant_ids)

    if available_participants.empty?
      return redirect_to event_prizes_path(@event), alert: "Tidak ada peserta yang tersisa untuk diundi."
    end

    DrawAllPrizesJob.perform_later(@event.id)

    redirect_to event_prizes_path(@event), notice: "Proses undian semua hadiah sedang berjalan di latar belakang."
  end

  def forfeit_and_redraw
    winning = @prize.winnings.first
    unless winning
      return redirect_to event_prizes_path(@event), alert: "Hadiah ini belum diundi."
    end

    previous_winner = winning.participant
    new_winner = nil
    
    ActiveRecord::Base.transaction do
      # Forfeit the previous winner
      @event.forfeitures.create!(participant: previous_winner)

      # Delete the winning
      winning.destroy

      # Find new eligible participants
      eligible_participants = @event.participants.where.not(id: ineligible_participant_ids)

      if eligible_participants.any?
        # Draw and assign new winner
        new_winner = eligible_participants.sample
        Winning.create!(prize: @prize, participant: new_winner)
      end
    end

    if new_winner
      redirect_to event_prizes_path(@event), notice: "Pemenang sebelumnya (#{previous_winner.name}) didiskualifikasi. Pemenang baru: #{new_winner.name} (No. #{new_winner.registration_number})."
    else
      redirect_to event_prizes_path(@event), alert: "Pemenang sebelumnya telah didiskualifikasi, namun tidak ada peserta lain yang tersisa untuk diundi."
    end

  rescue ActiveRecord::RecordInvalid => e
    redirect_to event_prizes_path(@event), alert: "Terjadi kesalahan saat membatalkan undian: #{e.message}"
  end

  def reset_draw
    winnings = @prize.winnings
    if winnings.any?
      winner_names = winnings.map { |w| w.participant.name }.join(", ")
      winnings.destroy_all
      redirect_to event_prizes_path(@event), notice: "Undian untuk hadiah '#{@prize.name}' (Pemenang: #{winner_names}) berhasil direset."
    else
      redirect_to event_prizes_path(@event), alert: "Hadiah ini belum diundi."
    end
  end

  def reset_all_draws
    reset_count = 0
    @event.prizes.includes(:winnings).each do |prize|
      if prize.winnings.any?
        prize.winnings.destroy_all
        reset_count += 1
      end
    end
    redirect_to event_prizes_path(@event), notice: "#{reset_count} undian hadiah berhasil direset."
  end

  private

  def set_event
    @event = Event.find(params[:event_id])
  end

  def set_prize
    @prize = @event.prizes.find(params[:id])
  end

  def prize_params
    params.require(:prize).permit(:name, :description, :image, :quantity, :category)
  end

  def ineligible_participant_ids
    # Ambil ID peserta yang sudah menang
    winner_ids = Winning.joins(:prize).where(prizes: { event_id: @event.id }).pluck(:participant_id)
    # Ambil ID peserta yang didiskualifikasi
    forfeited_ids = @event.forfeitures.pluck(:participant_id)
    (winner_ids + forfeited_ids).uniq
  end
end
