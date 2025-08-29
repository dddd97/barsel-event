class DrawingService
  attr_reader :event

  def initialize(event:)
    @event = event
  end

  # Mengundi satu jenis hadiah untuk sejumlah pemenang (sesuai quantity)
  def draw(prize:)
    return { success: false, message: "Hadiah ini sudah diundi sepenuhnya." } if prize.drawn?
    
    eligible_participants = find_eligible_participants
    return { success: false, message: "Tidak ada peserta yang tersisa untuk diundi." } if eligible_participants.empty?

    winners_to_draw_count = [prize.quantity - prize.winnings.count, eligible_participants.count].min
    return { success: false, message: "Tidak ada peserta yang cukup untuk diundi." } if winners_to_draw_count.zero?
    
    winners = eligible_participants.sample(winners_to_draw_count)

    begin
      ActiveRecord::Base.transaction do
        winners.each do |winner|
          prize.winners << winner
        end
      end
      { success: true, message: "#{winners.count} pemenang berhasil diundi untuk hadiah '#{prize.name}'." }
    rescue ActiveRecord::RecordInvalid => e
      { success: false, message: "Terjadi kesalahan saat menyimpan data: #{e.message}" }
    end
  end

  # Mengundi semua hadiah yang belum terundi sepenuhnya
  def draw_all_prizes
    undrawn_prizes = event.prizes.left_joins(:winnings).group(:id).having('COUNT(winnings.id) < prizes.quantity')
    return { success: false, message: "Semua hadiah sudah diundi sepenuhnya." } if undrawn_prizes.empty?
    
    eligible_participants = find_eligible_participants.shuffle
    return { success: false, message: "Tidak ada peserta yang tersisa untuk diundi." } if eligible_participants.empty?

    total_winnings_created = 0
    begin
      ActiveRecord::Base.transaction do
        undrawn_prizes.each do |prize|
          break if eligible_participants.empty?

          needed = prize.quantity - prize.winnings.count
          winners_to_assign_count = [needed, eligible_participants.count].min
          next if winners_to_assign_count.zero?

          winners = eligible_participants.shift(winners_to_assign_count)
          
          winners.each do |winner|
            prize.winners << winner
            total_winnings_created += 1
          end
        end
      end

      if total_winnings_created.zero?
        { success: false, message: "Tidak ada peserta yang cukup untuk mengundi hadiah yang tersisa." }
      else
        { success: true, message: "#{total_winnings_created} pemenang baru berhasil diundi." }
      end
    rescue ActiveRecord::RecordInvalid => e
      { success: false, message: "Terjadi kesalahan saat menyimpan data: #{e.message}" }
    end
  end

  private

  def find_eligible_participants
    # Peserta event ini yang belum memenangkan hadiah apapun di event ini
    event.participants.where.not(id: event.winners.select(:id))
  end
end 