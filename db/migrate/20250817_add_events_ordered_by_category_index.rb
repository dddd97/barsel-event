class AddEventsOrderedByCategoryIndex < ActiveRecord::Migration[8.0]
  def change
    # Composite index untuk optimasi ordered_by_category scope
    # ORDER BY (CASE WHEN category = 'utama' THEN 0 ELSE 1 END), event_date ASC, created_at ASC
    add_index :events, [:category, :event_date, :created_at], 
              name: 'index_events_on_category_event_date_created_at'
    
    # Index untuk registration period queries yang sering digunakan
    add_index :events, [:registration_start, :registration_end], 
              name: 'index_events_on_registration_period'
  end
end