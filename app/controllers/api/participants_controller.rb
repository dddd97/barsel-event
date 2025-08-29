module Api
  class ParticipantsController < ApplicationController
    # Skip CSRF protection for API endpoints - this fixes participants authentication issues
    skip_before_action :verify_authenticity_token
    before_action :set_event
    before_action :check_registration_open, only: [:create]
    # Temporarily disabled due to Recaptcha::Verify constant issue
    # before_action :verify_recaptcha_token, only: [:create]
    before_action :set_participant, only: [:show, :update, :destroy, :download_card, :card_data]
    
    def index
      @participants = @event.participants
      if params[:search].present?
        search_term = params[:search].strip.downcase
        @participants = @participants.where(
          "LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone_number) LIKE ? OR LOWER(nik) LIKE ?",
          "%#{search_term}%", "%#{search_term}%", "%#{search_term}%", "%#{search_term}%"
        )
      end
      @participants = @participants.order(created_at: :desc).page(params[:page] || 1).per(params[:per_page] || 20)
      render json: {
        participants: @participants.map { |p|
          {
            id: p.id,
            name: p.name,
            email: p.email,
            phoneNumber: p.phone_number,
            nik: p.nik,
            institution: p.institution,
            registrationNumber: p.registration_number,
            createdAt: p.created_at,
            eventId: p.event_id
          }
        },
        pagination: {
          current_page: @participants.current_page,
          total_pages: @participants.total_pages,
          total_count: @participants.total_count,
          per_page: @participants.limit_value
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
        eventId: @participant.event_id
      }
    end

    def create
      @participant = @event.participants.new(participant_params)

      if @participant.save
        # Temporarily disabled to prevent 503 timeout issues
        # ParticipantMailer.registration_confirmation(@participant).deliver_later if @participant.email.present?
        render json: {
          id: @participant.id,
          name: @participant.name,
          email: @participant.email,
          phoneNumber: @participant.phone_number,
          nik: @participant.nik,
          institution: @participant.institution,
          registrationNumber: @participant.registration_number,
          createdAt: @participant.created_at,
          eventId: @participant.event_id
        }, status: :created
      else
        render json: { errors: @participant.errors }, status: :unprocessable_entity
      end
    end
    
    def update
      if @participant.update(participant_params)
        render json: {
          id: @participant.id,
          name: @participant.name,
          email: @participant.email,
          phoneNumber: @participant.phone_number,
          nik: @participant.nik,
          institution: @participant.institution,
          registrationNumber: @participant.registration_number,
          createdAt: @participant.created_at,
          eventId: @participant.event_id
        }
      else
        render json: { errors: @participant.errors }, status: :unprocessable_entity
      end
    end
    
    def destroy
      if @participant.destroy
        render json: { message: "Peserta berhasil dihapus" }
      else
        render json: { errors: @participant.errors }, status: :unprocessable_entity
      end
    end
    
    def export
      @participants = @event.participants.order(:name)
      
      respond_to do |format|
        format.xlsx {
          response.headers['Content-Disposition'] = "attachment; filename=\"peserta-#{@event.id}-#{Date.today}.xlsx\""
          
          workbook = Axlsx::Package.new
          workbook.workbook.add_worksheet(name: "Peserta") do |sheet|
            # Header
            sheet.add_row ["No.", "Nomor Registrasi", "Nama", "Email", "Telepon", "NIK", "Instansi", "Terdaftar Pada"]
            
            # Data
            @participants.each_with_index do |participant, index|
              sheet.add_row [
                index + 1,
                participant.registration_number,
                participant.name,
                participant.email,
                participant.phone_number,
                participant.nik,
                participant.institution,
                participant.created_at.strftime("%d/%m/%Y %H:%M:%S")
              ]
            end
          end
          
          send_data workbook.to_stream.read, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }
        
        format.json {
          render json: { 
            participants: @participants.map { |p|
              {
                id: p.id,
                name: p.name,
                email: p.email,
                phoneNumber: p.phone_number,
                nik: p.nik,
                institution: p.institution,
                registrationNumber: p.registration_number,
                createdAt: p.created_at,
                eventId: p.event_id
              }
            }
          }
        }
      end
    end

    def search
      @participant = @event.participants.find_by(nik: params[:nik], phone_number: params[:phone_number])

      if @participant
        render json: {
          id: @participant.id,
          name: @participant.name,
          email: @participant.email,
          phoneNumber: @participant.phone_number,
          nik: @participant.nik,
          institution: @participant.institution,
          registrationNumber: @participant.registration_number,
          createdAt: @participant.created_at,
          eventId: @participant.event_id
        }
      else
        render json: { error: "Participant not found" }, status: :not_found
      end
    end

    def download_card
      Rails.logger.info "PDF Generation started for participant #{@participant.id}, event #{@event.id}"
      
      # Use semaphore to limit concurrent PDF generations
      PDFGeneration.with_semaphore do
        begin
        qr_data = {
          event_id: @event.id,
          participant_id: @participant.id,
          registration_number: @participant.registration_number,
          name: @participant.name
        }.to_json
        Rails.logger.info "QR data generated: #{qr_data}"
        
        qrcode = RQRCode::QRCode.new(qr_data)
        # Optimized QR code generation - smaller size for faster rendering
        @qr_code_svg = qrcode.as_svg(
          offset: 0,
          color: '000',
          fill: 'fff',
          shape_rendering: 'crispEdges',
          module_size: 4,  # Reduced from 6 to 4 for smaller size
          standalone: true,
          use_path: true,
          viewbox: true
        )
        Rails.logger.info "QR code SVG generated successfully"

        if @event.banner.attached?
          begin
            image_data = @event.banner.download
            base64_image = Base64.strict_encode64(image_data)
            @banner_data_uri = "data:#{@event.banner.content_type};base64,#{base64_image}"
            Rails.logger.info "Banner data URI generated successfully"
          rescue => e
            Rails.logger.error "Failed to download banner for PDF: #{e.message}"
            @banner_data_uri = nil
          end
        end

        html = render_to_string(
          template: 'participants/card_simple',
          layout: false,
          formats: [:html],
          locals: {
            event: @event,
            participant: @participant,
            qr_code_svg: @qr_code_svg,
            banner_data_uri: @banner_data_uri
          }
        )
        Rails.logger.info "HTML rendered successfully, length: #{html.length}"

        # Optimized Grover configuration for better performance
        grover = Grover.new(
          html,
          print_background: true,
          width: '10cm',
          height: '18cm',
          prefer_css_page_size: true,
          margin: { top: '0cm', bottom: '0cm', left: '0cm', right: '0cm' },
          scale: 1.0,
          # Chrome optimization flags for performance and stability
          launch_args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--memory-pressure-off',
            '--max-old-space-size=512',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--run-all-compositor-stages-before-draw',
            '--disable-frame-rate-limit'
          ],
          timeout: 45000,  # Increase timeout for stability
          wait_until: 'networkidle0',
          # Additional stability options
          viewport: { width: 800, height: 1200 },
          ignore_default_args: ['--disable-extensions'],
          # Force specific Chrome executable path if needed  
          # executable_path: '/usr/bin/google-chrome-stable'
        )
        pdf_data = grover.to_pdf
        Rails.logger.info "PDF generated successfully, size: #{pdf_data.bytesize} bytes"
        
        # Determine disposition based on download parameter
        disposition = params[:download] == 'true' ? 'attachment' : 'inline'
        
        send_data pdf_data,
                  filename: "kartu_peserta_#{@participant.registration_number}.pdf",
                  type: "application/pdf",
                  disposition: disposition
                  
        rescue => e
          Rails.logger.error "PDF Generation failed: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
          render json: { error: 'Failed to generate PDF', details: e.message }, status: :internal_server_error
        end
      end
    end

    def card_data
      qr_data = {
        event_id: @event.id,
        participant_id: @participant.id,
        registration_number: @participant.registration_number,
        name: @participant.name
      }.to_json
      qrcode = RQRCode::QRCode.new(qr_data)
      @qr_code_svg = qrcode.as_svg(
        offset: 0,
        color: '000',
        fill: 'fff',
        shape_rendering: 'crispEdges',
        module_size: 6,
        standalone: true,
        use_path: true,
        viewbox: true
      )

      if @event.banner.attached?
        begin
          image_data = @event.banner.download
          base64_image = Base64.strict_encode64(image_data)
          @banner_data_uri = "data:#{@event.banner.content_type};base64,#{base64_image}"
        rescue => e
          Rails.logger.error "Failed to download banner for card data: #{e.message}"
          @banner_data_uri = nil
        end
      end

      render json: {
        event: {
          id: @event.id,
          name: @event.name,
          location: @event.location,
          event_date: @event.event_date
        },
        participant: {
          id: @participant.id,
          name: @participant.name,
          nik: @participant.nik,
          phone_number: @participant.phone_number,
          institution: @participant.institution,
          email: @participant.email,
          registration_number: @participant.registration_number
        },
        qr_code_svg: @qr_code_svg,
        banner_data_uri: @banner_data_uri
      }
    end

    def check_registration
      if params[:nik].present?
        participant = @event.participants.find_by(nik: params[:nik])
      elsif params[:registration_number].present? 
        participant = @event.participants.find_by(registration_number: params[:registration_number])
      else
        render json: { error: "NIK atau Nomor Registrasi harus diisi" }, status: :bad_request
        return
      end

      if participant
        render json: {
          found: true,
          participant: {
            id: participant.id,
            name: participant.name,
            email: participant.email,
            nik: participant.nik,
            registrationNumber: participant.registration_number,
            institution: participant.institution
          }
        }
      else
        render json: {
          found: false
        }
      end
    end

    private

    def set_participant
      @participant = @event.participants.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Participant not found' }, status: :not_found
    end

    def set_event
      @event = Event.find(params[:event_id] || params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'Event not found' }, status: :not_found
    end

    def participant_params
      params.require(:participant).permit(:name, :email, :phone_number, :institution, :nik)
    end

    def verify_recaptcha_token
      recaptcha_token = params['g-recaptcha-response']
      
      if recaptcha_token.blank?
        render json: { error: "reCAPTCHA verification required." }, status: :unprocessable_entity
        return false
      end

      # Use verify_recaptcha with proper parameters
      unless verify_recaptcha(response: recaptcha_token, secret_key: ENV['RECAPTCHA_SECRET_KEY'])
        render json: { error: "reCAPTCHA verification failed. Please try again." }, status: :unprocessable_entity
        return false
      end
      
      true
    end

    def check_registration_open
      unless @event.registration_open?
        render json: { error: "Pendaftaran untuk event ini tidak dibuka." }, status: :forbidden
      end
    end
  end
end 