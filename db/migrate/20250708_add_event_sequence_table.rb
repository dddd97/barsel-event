class AddEventSequenceTable < ActiveRecord::Migration[8.0]
  def change
    create_table :event_sequences do |t|
      t.integer :next_value, null: false, default: 1
      t.timestamps
    end
    
    # Insert initial record
    reversible do |dir|
      dir.up do
        # Find the maximum sequence number from events
        max_sequence = execute("SELECT MAX(sequence_number) FROM events").first["max"]
        max_sequence = max_sequence || 0
        
        # Insert initial record with next_value = max_sequence + 1
        execute("INSERT INTO event_sequences (next_value, created_at, updated_at) VALUES (#{max_sequence + 1}, NOW(), NOW())")
      end
    end
  end
end 