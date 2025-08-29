module AdminPanel
  class EventsController < AdminPanel::BaseController
    before_action :set_event, only: [:show, :edit, :update, :destroy]
    
    def index
      @pagy, @events = pagy(Event.includes(:creator).ordered_by_category)
    end

    def show
    end

    def new
      @event = Event.new
    end

    def create
      @event = Event.new(event_params)
      @event.creator = current_admin
      
      if @event.save
        redirect_to admin_panel_event_path(@event), notice: 'Event berhasil dibuat.'
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      # Jika ada banner baru, hapus banner lama
      @event.banner.purge if event_params[:banner].present?
      
      # Pastikan creator selalu ada
      @event.creator = current_admin if @event.creator.nil?
      
      if @event.update(event_params)
        redirect_to admin_panel_event_path(@event), notice: 'Event berhasil diperbarui.'
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @event.destroy
      redirect_to admin_panel_events_path, notice: 'Event berhasil dihapus.'
    end

    private

    def set_event
      @event = Event.find(params[:id])
    end

    def event_params
      params.require(:event).permit(
        :name, 
        :description, 
        :event_date, 
        :location, 
        :category,
        :registration_start,
        :registration_end,
        :max_participants,
        :banner,
        :contact_person1_name,
        :contact_person1_phone,
        :contact_person2_name,
        :contact_person2_phone
      )
    end
  end
end 