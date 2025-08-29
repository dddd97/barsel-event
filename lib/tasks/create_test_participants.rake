namespace :test do
  desc "Create dummy participants for testing"
  task create_participants: :environment do
    event = Event.first
    if event.nil?
      puts "No events found. Please create an event first."
      exit
    end

    puts "Creating dummy participants for event: #{event.name}"

    # Create 20 dummy participants
    20.times do |i|
      participant_number = i + 1
      registration_number = "E1-#{participant_number.to_s.rjust(4, '0')}"
      
      participant = Participant.create!(
        event: event,
        name: "Peserta Test #{participant_number}",
        registration_number: registration_number,
        institution: "Institusi Test #{participant_number}",
        email: "peserta#{participant_number}@test.com",
        phone_number: "0812345#{participant_number.to_s.rjust(5, '0')}",
        nik: "123456789012345#{participant_number.to_s.rjust(3, '0')}"
      )
      
      puts "Created participant: #{participant.name} (#{participant.registration_number})"
    end

    puts "\n✅ Successfully created 20 dummy participants!"
    puts "Total participants in event: #{event.participants.count}"
  end

  desc "Create test prizes for testing"
  task create_prizes: :environment do
    event = Event.first
    if event.nil?
      puts "No events found. Please create an event first."
      exit
    end

    puts "Creating test prizes for event: #{event.name}"

    prizes_data = [
      { name: "Hadiah Test 1", description: "Hadiah untuk testing", category: "reguler", quantity: 5 },
      { name: "Hadiah Test 2", description: "Hadiah untuk testing", category: "reguler", quantity: 3 },
      { name: "Hadiah Test 3", description: "Hadiah untuk testing", category: "utama", quantity: 2 },
      { name: "Hadiah Test 4", description: "Hadiah untuk testing", category: "reguler", quantity: 4 },
      { name: "Hadiah Test 5", description: "Hadiah untuk testing", category: "utama", quantity: 1 }
    ]

    prizes_data.each_with_index do |prize_data, index|
      prize = Prize.create!(
        event: event,
        name: prize_data[:name],
        description: prize_data[:description],
        category: prize_data[:category],
        quantity: prize_data[:quantity]
      )
      
      puts "Created prize: #{prize.name} (#{prize.quantity} available)"
    end

    puts "\n✅ Successfully created #{prizes_data.length} test prizes!"
    puts "Total prizes in event: #{event.prizes.count}"
  end

  desc "Reset all winnings for testing"
  task reset_winnings: :environment do
    puts "Resetting all winnings..."
    
    Winning.delete_all
    puts "✅ All winnings have been deleted!"
  end

  desc "Setup complete test environment"
  task setup_test_env: :environment do
    puts "Setting up complete test environment..."
    
    # Reset winnings
    Rake::Task['test:reset_winnings'].invoke
    
    # Create participants if none exist
    if Participant.count == 0
      Rake::Task['test:create_participants'].invoke
    else
      puts "Participants already exist, skipping..."
    end
    
    # Create prizes if none exist
    if Prize.count == 0
      Rake::Task['test:create_prizes'].invoke
    else
      puts "Prizes already exist, skipping..."
    end
    
    puts "\n🎉 Test environment is ready!"
    puts "Participants: #{Participant.count}"
    puts "Prizes: #{Prize.count}"
    puts "Winnings: #{Winning.count}"
  end
end 