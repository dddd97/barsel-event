class AddSequenceNumberToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :sequence_number, :integer
    
    # Initialize existing events with sequence numbers
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE events
          SET sequence_number = id
        SQL
      end
    end
    
    # Add a unique constraint to ensure sequence numbers are unique
    add_index :events, :sequence_number, unique: true
  end
end 