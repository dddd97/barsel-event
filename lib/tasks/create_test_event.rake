namespace :test do
  desc "Create a test event and participant"
  task create_event_and_participant: :environment do
    puts "Creating test event..."
    
    # Find an admin to use as creator
    admin = Admin.first
    
    if admin.nil?
      puts "Error: No admin found. Please create an admin first."
      return
    end
    
    # Create a test event
    event = Event.create!(
      name: "Test Event #{Time.now.to_i}",
      event_date: Date.today + 30.days,
      description: "This is a test event",
      category: "regular",
      creator: admin,
      registration_start: Date.today,
      registration_end: Date.today + 20.days
    )
    
    puts "Created Event ID: #{event.id}, Sequence: #{event.sequence_number}, Name: #{event.name}"
    
    # Create a test participant
    participant = event.participants.create!(
      name: "Test Participant",
      email: "test@example.com",
      phone_number: "081234567890",
      nik: "1234567890123456"
    )
    
    puts "Created Participant: #{participant.name}, Reg Number: #{participant.registration_number}"
  end
end 