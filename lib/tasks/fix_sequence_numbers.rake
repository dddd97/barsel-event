namespace :events do
  desc "Fix event sequence numbers"
  task fix_sequence_numbers: :environment do
    puts "Fixing event sequence numbers..."
    
    # Get the current max sequence number
    max_sequence = Event.maximum(:sequence_number) || 0
    puts "Current max sequence number: #{max_sequence}"
    
    # Create a new event with a higher sequence number
    admin = Admin.first
    
    if admin.nil?
      puts "Error: No admin found. Please create an admin first."
      return
    end
    
    # Create a new event with a higher sequence number
    new_event = Event.new(
      name: "New Event with Higher Sequence #{Time.now.to_i}",
      event_date: Date.today + 30.days,
      description: "This is a new event with higher sequence",
      category: "regular",
      creator: admin,
      registration_start: Date.today,
      registration_end: Date.today + 20.days
    )
    
    # Manually set a higher sequence number
    new_event.sequence_number = max_sequence + 1
    new_event.save!
    
    puts "Created Event ID: #{new_event.id}, Sequence: #{new_event.sequence_number}, Name: #{new_event.name}"
    
    # Create a test participant
    participant = new_event.participants.create!(
      name: "Higher Sequence Participant",
      email: "higher@example.com",
      phone_number: "087654321098",
      nik: "9876543210987654"
    )
    
    puts "Created Participant: #{participant.name}, Reg Number: #{participant.registration_number}"
  end
end 