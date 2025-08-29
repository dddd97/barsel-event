namespace :events do
  desc "Check event_sequences table"
  task check_event_sequence: :environment do
    puts "Checking event_sequences table..."
    
    # Get the record from event_sequences
    sequence = EventSequence.first
    
    if sequence.nil?
      puts "No record found in event_sequences table."
    else
      puts "Next value in event_sequences table: #{sequence.next_value}"
    end
  end
end 