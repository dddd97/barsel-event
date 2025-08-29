# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

puts "Creating initial event sequence..."
EventSequence.create!(next_sequence_number: 1)

# Create admin first
puts "Creating admin..."
admin = Admin.find_or_create_by(email: "admin@barsel.go.id") do |a|
  a.name = "Super Admin"
  a.password = "admin123456"
  a.password_confirmation = "admin123456"
end
puts "✅ Admin: #{admin.email} | Password: admin123456"

# Create a sample event
puts "Creating sample event..."
event = Event.create!(
  name: "Jalan Sehat HUT RI ke-80",
  event_date: Date.new(2025, 8, 17),
  description: "Jalan sehat dalam rangka memperingati HUT RI ke-80",
  category: "utama",
  creator: admin,
  registration_start: DateTime.new(2025, 8, 1, 8, 0, 0),
  registration_end: DateTime.new(2025, 8, 16, 23, 59, 59),
  max_participants: 1000,
  location: "Lapangan Kota"
)

# Create sample participants
puts "Creating 20 sample participants..."
20.times do |i|
  event.participants.create!(
    name: "Peserta #{i + 1}",
    participant_number: format('%04d', i + 1),
    phone_number: "08123456#{format('%04d', i + 1)}",
    nik: "3578#{format('%012d', i + 1)}"
  )
end

# Create sample prizes
prizes = [
  { name: "Sepeda Gunung", description: "Sepeda gunung merk polygon", category: "utama" },
  { name: "TV LED 32 inch", description: "TV LED Samsung 32 inch", category: "utama" },
  { name: "Rice Cooker", description: "Rice cooker merk Philips", category: "reguler" },
  { name: "Blender", description: "Blender merk Philips", category: "reguler" },
  { name: "Setrika", description: "Setrika merk Philips", category: "reguler" }
]

puts "Creating sample prizes..."
prizes.each do |prize|
  event.prizes.create!(prize)
end

puts "Seed data created successfully!"
