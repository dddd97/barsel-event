namespace :participants do
  desc "Update participant registration numbers to use event sequence numbers"
  task update_registration_numbers: :environment do
    puts "Updating participant registration numbers..."
    
    Event.all.each do |event|
      puts "Processing Event ID: #{event.id}, Sequence: #{event.sequence_number}, Name: #{event.name}"
      
      event.participants.order(:created_at).each_with_index do |participant, index|
        old_number = participant.registration_number
        new_number = "E#{event.sequence_number}-#{(index + 1).to_s.rjust(4, '0')}"
        
        # Update the registration number
        participant.update_column(:registration_number, new_number)
        
        puts "  Updated: #{old_number} -> #{new_number} for #{participant.name}"
      end
      
      puts "Completed processing event: #{event.name}"
      puts ""
    end
    
    puts "All participant registration numbers have been updated."
  end
end 