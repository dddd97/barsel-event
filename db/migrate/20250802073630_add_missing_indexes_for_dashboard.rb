class AddMissingIndexesForDashboard < ActiveRecord::Migration[8.0]
  def change
    # Add index for events.updated_at to optimize dashboard update checks
    add_index :events, :updated_at, name: 'index_events_on_updated_at'
    
    # Add index for participants.created_at to optimize dashboard update checks
    add_index :participants, :created_at, name: 'index_participants_on_created_at'
  end
end
