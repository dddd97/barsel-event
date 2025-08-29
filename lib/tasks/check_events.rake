namespace :events do
  desc "Check event sequence numbers"
  task check_sequence: :environment do
    puts "Checking event sequence numbers..."
    Event.all.each do |event|
      puts "ID: #{event.id}, Sequence: #{event.sequence_number}, Name: #{event.name}"
    end
  end
end 