require 'prawn'
require 'prawn/table'

class WinnerListPdf
  def initialize(prizes, event)
    @prizes = prizes
    @event = event
    @pdf = Prawn::Document.new
  end

  def render
    render_header
    render_event_details
    render_winners_list
    @pdf.render
  end

  private

  def render_header
    @pdf.text "Daftar Pemenang #{@event.name}", size: 24, style: :bold, align: :center
    @pdf.move_down 20
  end

  def render_event_details
    @pdf.text "Tanggal Event: #{@event.event_date&.strftime('%d %B %Y')}", size: 12
    @pdf.text "Dibuat oleh: #{@event.creator.name}", size: 12
    @pdf.move_down 20
  end

  def render_winners_list
    @prizes.each_with_index do |prize, index|
      @pdf.text "#{index + 1}. #{prize.name} (#{prize.winners.count}/#{prize.quantity} Pemenang)", size: 14, style: :bold
      if prize.winners.any?
        prize.winners.each do |winner|
          @pdf.text "   - #{winner.name} (No. Peserta: #{winner.participant_number})", size: 12, style: :italic
        end
      else
        @pdf.text "   Belum ada pemenang.", size: 12, style: :italic
      end
      @pdf.move_down 10
    end
  end
end 