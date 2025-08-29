namespace :participants do
  desc "Update existing registration numbers to sequential format"
  task update_registration_numbers: :environment do
    puts "Updating registration numbers to sequential format..."
    
    # Process each event separately
    Event.find_each do |event|
      puts "Processing Event ##{event.id}: #{event.name}"
      
      # Get all participants for this event, ordered by creation date
      participants = event.participants.order(created_at: :asc)
      
      # Update each participant with a sequential number
      participants.each_with_index do |participant, index|
        next_number = index + 1
        new_registration_number = "E#{event.id}-#{next_number.to_s.rjust(4, '0')}"
        
        # Skip if the registration number is already in the correct format
        next if participant.registration_number == new_registration_number
        
        # Update the registration number
        old_number = participant.registration_number
        participant.update_column(:registration_number, new_registration_number)
        puts "  Updated #{old_number} to #{new_registration_number}"
      end
      
      puts "  Updated #{participants.count} participants for Event ##{event.id}"
    end
    
    puts "Done updating registration numbers."
  end
end 