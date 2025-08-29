namespace :test do
  desc "Delete the last event and create a new one"
  task delete_and_create: :environment do
    puts "Deleting the last event..."
    
    # Find the last event
    last_event = Event.order(created_at: :desc).first
    
    if last_event.nil?
      puts "Error: No events found."
      return
    end
    
    event_id = last_event.id
    event_sequence = last_event.sequence_number
    event_name = last_event.name
    
    puts "Deleting Event ID: #{event_id}, Sequence: #{event_sequence}, Name: #{event_name}"
    
    # Delete the event
    last_event.destroy
    
    puts "Event deleted."
    
    # Create a new event
    puts "Creating new event..."
    
    # Find an admin to use as creator
    admin = Admin.first
    
    if admin.nil?
      puts "Error: No admin found. Please create an admin first."
      return
    end
    
    # Create a new event
    new_event = Event.create!(
      name: "New Event After Delete #{Time.now.to_i}",
      event_date: Date.today + 30.days,
      description: "This is a new event after delete",
      category: "regular",
      creator: admin,
      registration_start: Date.today,
      registration_end: Date.today + 20.days
    )
    
    puts "Created Event ID: #{new_event.id}, Sequence: #{new_event.sequence_number}, Name: #{new_event.name}"
    
    # Create a test participant
    participant = new_event.participants.create!(
      name: "New Participant",
      email: "new@example.com",
      phone_number: "089876543210",
      nik: "6543210987654321"
    )
    
    puts "Created Participant: #{participant.name}, Reg Number: #{participant.registration_number}"
  end
end 