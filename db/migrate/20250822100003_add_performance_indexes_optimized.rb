class AddPerformanceIndexesOptimized < ActiveRecord::Migration[8.0]
  def change
    # Index untuk pencarian participant berdasarkan NIK dan phone number dalam event
    add_index :participants, [:event_id, :nik, :phone_number], 
              name: 'idx_participants_event_nik_phone'
    
    # Index untuk prize drawing queries - kombinasi prize dan participant
    add_index :winnings, [:prize_id, :participant_id], 
              name: 'idx_winnings_prize_participant'
    
    # Index untuk audit log filtering berdasarkan action, admin, dan tanggal
    add_index :audit_logs, [:action, :admin_id, :created_at], 
              name: 'idx_audit_logs_action_admin_date'
    
    # Index untuk Active Storage attachments (banner images)
    add_index :active_storage_attachments, [:record_type, :record_id, :name], 
              name: 'idx_active_storage_record_name'
    
    # Index untuk events berdasarkan tanggal (tanpa partial index karena CURRENT_DATE tidak IMMUTABLE)
    add_index :events, [:event_date, :registration_start, :registration_end], 
              name: 'idx_events_date_range'
    
    # Index untuk events dengan slot tersedia
    add_index :events, [:max_participants, :participants_count], 
              where: "max_participants IS NOT NULL",
              name: 'idx_events_available_slots'
    
    # Index untuk participant registration lookup yang cepat
    add_index :participants, [:event_id, :registration_number], 
              name: 'idx_participants_event_registration'
    
    # Index untuk prize category filtering
    add_index :prizes, [:event_id, :category, :created_at], 
              name: 'idx_prizes_event_category_date'
    
    # Index untuk winnings dengan created_at untuk drawing statistics
    add_index :winnings, [:prize_id, :created_at], 
              name: 'idx_winnings_prize_date'
  end
  
  def down
    # Remove indexes in reverse order
    remove_index :winnings, name: 'idx_winnings_prize_date'
    remove_index :prizes, name: 'idx_prizes_event_category_date'
    remove_index :participants, name: 'idx_participants_event_registration'
    remove_index :events, name: 'idx_events_available_slots'
    remove_index :events, name: 'idx_events_date_range'
    remove_index :active_storage_attachments, name: 'idx_active_storage_record_name'
    remove_index :audit_logs, name: 'idx_audit_logs_action_admin_date'
    remove_index :winnings, name: 'idx_winnings_prize_participant'
    remove_index :participants, name: 'idx_participants_event_nik_phone'
  end
end