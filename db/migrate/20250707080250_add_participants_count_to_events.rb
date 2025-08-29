class AddParticipantsCountToEvents < ActiveRecord::Migration[8.0]
  def up
    add_column :events, :participants_count, :integer, default: 0, null: false
    
    # Update existing records
    Event.find_each do |event|
      Event.reset_counters(event.id, :participants)
    end
  end

  def down
    remove_column :events, :participants_count
  end
end
