# Super Admin Seed Script
# This creates default admin user for the application

puts "🌱 Seeding Super Admin..."

# Admin configuration
admin_email = ENV['ADMIN_EMAIL'] || 'admin@baritoselatankab.go.id'
admin_password = ENV['ADMIN_PASSWORD'] || 'Admin123!@#'
admin_name = ENV['ADMIN_NAME'] || 'Super Admin'

begin
  # Check if admin already exists
  existing_admin = Admin.find_by(email: admin_email)
  
  if existing_admin
    puts "⚠️  Admin with email #{admin_email} already exists"
    puts "Updating password and details..."
    existing_admin.update!(
      password: admin_password,
      password_confirmation: admin_password,
      name: admin_name
    )
    puts "✅ Admin updated successfully!"
  else
    # Create new admin
    Admin.create!(
      email: admin_email,
      password: admin_password,
      password_confirmation: admin_password,
      name: admin_name
    )
    puts "✅ Super Admin created successfully!"
  end
  
  puts ""
  puts "📋 Admin Details:"
  puts "   Email: #{admin_email}"
  puts "   Password: #{admin_password}"
  puts "   Name: #{admin_name}"
  puts ""
  puts "🌐 Login at: https://event.baritoselatankab.go.id/admin"
  
rescue => e
  puts "❌ Error creating admin:"
  puts e.message
  puts e.backtrace if ENV['DEBUG']
  raise e
end