namespace :app do
  desc "Migrasi kategori dari main/regular ke utama/reguler"
  task update_categories: :environment do
    puts "Memulai migrasi kategori..."
    
    # Update Event categories
    main_events_count = Event.where(category: 'main').count
    regular_events_count = Event.where(category: 'regular').count
    
    Event.where(category: 'main').update_all(category: 'utama')
    Event.where(category: 'regular').update_all(category: 'reguler')
    
    # Update Prize categories
    main_prizes_count = Prize.where(category: 'main').count
    regular_prizes_count = Prize.where(category: 'regular').count
    
    Prize.where(category: 'main').update_all(category: 'utama')
    Prize.where(category: 'regular').update_all(category: 'reguler')
    
    puts "Migrasi kategori selesai!"
    puts "=================="
    puts "Event yang diperbarui:"
    puts "- #{main_events_count} event dari 'main' ke 'utama'"
    puts "- #{regular_events_count} event dari 'regular' ke 'reguler'"
    puts "=================="
    puts "Prize yang diperbarui:"
    puts "- #{main_prizes_count} hadiah dari 'main' ke 'utama'"
    puts "- #{regular_prizes_count} hadiah dari 'regular' ke 'reguler'"
  end
end 