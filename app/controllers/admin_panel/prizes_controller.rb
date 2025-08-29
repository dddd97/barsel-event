module AdminPanel
  class PrizesController < AdminPanel::BaseController
    before_action :set_event
    before_action :set_prize, only: [:edit, :update, :destroy, :draw, :reset_draw]

    def index
      @prizes = @event.prizes.ordered_by_category
      @prize = @event.prizes.new
    end

    def create
      @prize = @event.prizes.new(prize_params)
      if @prize.save
        redirect_to admin_panel_event_prizes_path(@event), notice: "Hadiah berhasil ditambahkan."
      else
        @prizes = @event.prizes.where.not(id: nil)
        render :index
      end
    end

    def edit
    end

    def update
      if @prize.update(prize_params)
        redirect_to admin_panel_event_prizes_path(@event), notice: "Hadiah berhasil diperbarui."
      else
        render :edit
      end
    end

    def destroy
      @prize.destroy
      redirect_to admin_panel_event_prizes_path(@event), notice: "Hadiah berhasil dihapus."
    end

    def draw
      service = DrawingService.new(event: @event)
      result = service.draw(prize: @prize)

      if result[:success]
        redirect_to admin_panel_event_prizes_path(@event), notice: result[:message]
      else
        redirect_to admin_panel_event_prizes_path(@event), alert: result[:message]
      end
    end

    def draw_all
      service = DrawingService.new(event: @event)
      result = service.draw_all_prizes

      if result[:success]
        redirect_to admin_panel_event_prizes_path(@event), notice: result[:message]
      else
        redirect_to admin_panel_event_prizes_path(@event), alert: result[:message]
      end
    end

    def reset_draw
      if @prize.winnings.destroy_all
        redirect_to admin_panel_event_prizes_path(@event), 
                    notice: "Semua pemenang untuk hadiah '#{@prize.name}' berhasil direset."
      else
        redirect_to admin_panel_event_prizes_path(@event), 
                    alert: "Gagal mereset pemenang untuk hadiah '#{@prize.name}'."
      end
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
  end
end 