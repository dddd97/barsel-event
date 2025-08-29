namespace :participants do
  desc "Check participant registration numbers"
  task check_registration: :environment do
    puts "Checking participant registration numbers..."
    Event.all.each do |event|
      puts "Event ID: #{event.id}, Sequence: #{event.sequence_number}, Name: #{event.name}"
      event.participants.each do |participant|
        puts "  Participant: #{participant.name}, Reg Number: #{participant.registration_number}"
      end
      puts ""
    end
  end
end 