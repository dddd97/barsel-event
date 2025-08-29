class ParticipantMailer < ApplicationMailer
  def registration_confirmation(participant)
    @participant = participant
    @event = participant.event
    
    mail(
      to: participant.email,
      subject: "Konfirmasi Pendaftaran - #{@event.name}"
    )
  end
end 