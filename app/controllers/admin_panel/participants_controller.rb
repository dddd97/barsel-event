module AdminPanel
  class ParticipantsController < ApplicationController
    layout 'admin'
    before_action :authenticate_admin!
    before_action :set_event
    before_action :set_participant, only: [:show, :edit, :update, :destroy]
    require 'csv' # CSV gem is now explicitly included in Gemfile

    def index
      @pagy, @participants = pagy(@event.participants.order(created_at: :desc))
      
      respond_to do |format|
        format.html
        format.csv { send_data export_csv, filename: "peserta-#{@event.name.parameterize}-#{Date.today}.csv" }
        format.xlsx { 
          response.headers['Content-Disposition'] = "attachment; filename=peserta-#{@event.name.parameterize}-#{Date.today}.xlsx"
          render xlsx: "index", filename: "peserta-#{@event.name.parameterize}-#{Date.today}"
        }
      end
    end

    def show
    end

    def new
      @participant = @event.participants.new
    end

    def create
      @participant = @event.participants.new(participant_params)
      
      if @participant.save
        redirect_to admin_panel_event_participants_path(@event), notice: 'Peserta berhasil ditambahkan.'
      else
        render :new
      end
    end

    def edit
    end

    def update
      if @participant.update(participant_params)
        redirect_to admin_panel_event_participants_path(@event), notice: 'Data peserta berhasil diperbarui.'
      else
        render :edit
      end
    end

    def destroy
      @participant.destroy
      redirect_to admin_panel_event_participants_path(@event), notice: 'Peserta berhasil dihapus.'
    end

    private

    def authenticate_admin!
      unless admin_signed_in?
        redirect_to admin_panel_login_path, alert: 'Silakan login terlebih dahulu.'
      end
    end

    def set_event
      @event = Event.find(params[:event_id])
    end

    def set_participant
      @participant = @event.participants.find(params[:id])
    end

    def participant_params
      params.require(:participant).permit(:name, :email, :phone_number, :nik, :institution)
    end
    
    def export_csv
      attributes = %w{registration_number name nik email phone_number institution status}
      
      CSV.generate(headers: true) do |csv|
        csv << attributes.map(&:titleize)
        
        # Ambil semua data tanpa pagination
        participants = @event.participants.includes(:winnings).order(created_at: :desc)
        
        participants.each do |participant|
          status = participant.winnings.any? ? "Menang" : "Belum Menang"
          csv << [
            participant.registration_number,
            participant.name,
            participant.nik,
            participant.email,
            participant.phone_number,
            participant.institution,
            status
          ]
        end
      end
    end
  end
end 