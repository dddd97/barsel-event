module Api
  module Admin
    class ParticipantsController < BaseController
      before_action :set_event
      before_action :set_participant, only: [:show, :update, :destroy]

      def index
        @participants = @event.participants
        
        # Apply search filter
        if params[:search].present?
          search_term = params[:search].strip.downcase
          @participants = @participants.where(
            "LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone_number) LIKE ? OR LOWER(nik) LIKE ? OR LOWER(registration_number) LIKE ?",
            "%#{search_term}%", "%#{search_term}%", "%#{search_term}%", "%#{search_term}%", "%#{search_term}%"
          )
        end
        
        # Apply pagination
        per_page = params[:per_page] || 20
        @participants = @participants.includes(:winnings, :event)
                                   .order(created_at: :desc)
                                   .page(params[:page] || 1)
                                   .per(per_page)
        
        render json: {
          participants: @participants.map { |participant|
            {
              id: participant.id,
              name: participant.name,
              email: participant.email,
              phoneNumber: participant.phone_number,
              nik: participant.nik,
              institution: participant.institution,
              registrationNumber: participant.registration_number,
              createdAt: participant.created_at,
              updatedAt: participant.updated_at,
              eventId: participant.event_id,
              eventName: participant.event.name,
              hasWon: participant.winnings.any?,
              winningsCount: participant.winnings.count,
              # For backward compatibility
              phone_number: participant.phone_number,
              registration_number: participant.registration_number,
              created_at: participant.created_at,
              updated_at: participant.updated_at,
              event_id: participant.event_id
            }
          },
          pagination: {
            current_page: @participants.current_page,
            total_pages: @participants.total_pages,
            total_count: @participants.total_count,
            per_page: @participants.limit_value
          },
          event: {
            id: @event.id,
            name: @event.name,
            participantsCount: @event.participants_count,
            maxParticipants: @event.max_participants,
            availableSlots: @event.available_slots
          }
        }
      end

      def show
        render json: {
          id: @participant.id,
          name: @participant.name,
          email: @participant.email,
          phoneNumber: @participant.phone_number,
          nik: @participant.nik,
          institution: @participant.institution,
          registrationNumber: @participant.registration_number,
          createdAt: @participant.created_at,
          updatedAt: @participant.updated_at,
          eventId: @participant.event_id,
          eventName: @participant.event.name,
          hasWon: @participant.winnings.any?,
          winnings: @participant.winnings.includes(:prize).map { |winning|
            {
              id: winning.id,
              prizeId: winning.prize_id,
              prizeName: winning.prize.name,
              drawnAt: winning.created_at
            }
          }
        }
      end

      def create
        @participant = @event.participants.new(participant_params)
        
        if @participant.save
          # Log the activity
          log_activity('create', @participant, "Peserta '#{@participant.name}' ditambahkan ke event '#{@event.name}'")
          
          render json: {
            id: @participant.id,
            name: @participant.name,
            email: @participant.email,
            phoneNumber: @participant.phone_number,
            nik: @participant.nik,
            institution: @participant.institution,
            registrationNumber: @participant.registration_number,
            createdAt: @participant.created_at,
            updatedAt: @participant.updated_at,
            eventId: @participant.event_id
          }, status: :created
        else
          render json: { 
            errors: @participant.errors.full_messages,
            field_errors: @participant.errors.to_hash 
          }, status: :unprocessable_entity
        end
      end

      def update
        if @participant.update(participant_params)
          # Log the activity
          log_activity('update', @participant, "Data peserta '#{@participant.name}' diperbarui")
          
          render json: {
            id: @participant.id,
            name: @participant.name,
            email: @participant.email,
            phoneNumber: @participant.phone_number,
            nik: @participant.nik,
            institution: @participant.institution,
            registrationNumber: @participant.registration_number,
            createdAt: @participant.created_at,
            updatedAt: @participant.updated_at,
            eventId: @participant.event_id
          }
        else
          render json: { 
            errors: @participant.errors.full_messages,
            field_errors: @participant.errors.to_hash 
          }, status: :unprocessable_entity
        end
      end

      def destroy
        participant_name = @participant.name
        @participant.destroy
        
        # Log the activity
        log_activity('delete', nil, "Peserta '#{participant_name}' dihapus dari event '#{@event.name}'")
        
        head :no_content
      end

      # Export participants to CSV
      def export
        require 'csv'
        
        participants = @event.participants.includes(winnings: :prize)
        
        csv_data = CSV.generate(headers: true) do |csv|
          csv << [
            'No. Registrasi',
            'Nama',
            'Email', 
            'No. Telepon',
            'NIK',
            'Institusi',
            'Tanggal Daftar',
            'Status Menang',
            'Jumlah Hadiah',
            'Hadiah yang Dimenangkan'
          ]
          
          participants.each do |participant|
            won_prizes = participant.winnings.map(&:prize).compact.map(&:name).join(', ')
            
            csv << [
              participant.registration_number,
              participant.name,
              participant.email,
              participant.phone_number,
              participant.nik,
              participant.institution,
              participant.created_at.strftime('%d/%m/%Y %H:%M'),
              participant.winnings.any? ? 'Menang' : 'Belum Menang',
              participant.winnings.count,
              won_prizes
            ]
          end
        end
        
        # Log the activity
        log_activity('export_data', @event, "Export data peserta event '#{@event.name}'")
        
        respond_to do |format|
          format.csv do
            send_data csv_data, 
                      filename: "peserta-#{@event.name.parameterize}-#{Date.current.strftime('%Y%m%d')}.csv",
                      type: 'text/csv'
          end
          format.json do
            render json: { 
              message: 'Export berhasil',
              filename: "peserta-#{@event.name.parameterize}-#{Date.current.strftime('%Y%m%d')}.csv"
            }
          end
        end
      end

      private

      def set_event
        @event = Event.find(params[:event_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Event tidak ditemukan' }, status: :not_found
      end

      def set_participant
        @participant = @event.participants.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Peserta tidak ditemukan' }, status: :not_found
      end

      def participant_params
        # Handle both camelCase and snake_case parameters
        permitted_params = {}
        
        if params[:participant].present?
          # Handle nested participant parameters
          participant_data = params.require(:participant).permit(
            :name, :email, :phone_number, :nik, :institution
          )
          permitted_params.merge!(participant_data.to_h)
        else
          # Handle direct parameters (camelCase from frontend)
          camel_to_snake = {
            'name' => 'name',
            'email' => 'email',
            'phoneNumber' => 'phone_number',
            'nik' => 'nik',
            'institution' => 'institution'
          }
          
          camel_to_snake.each do |camel, snake|
            permitted_params[snake] = params[camel] if params[camel].present?
          end
        end
        
        permitted_params
      end


    end
  end
end 