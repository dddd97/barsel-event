class AddWinningsCounterCache < ActiveRecord::Migration[8.0]
  def change
    add_column :prizes, :winnings_count, :integer, default: 0, null: false
    
    # Backfill existing data
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE prizes SET winnings_count = (
            SELECT COUNT(*) FROM winnings WHERE winnings.prize_id = prizes.id
          )
        SQL
      end
    end
    
    # Add index on winnings_count for filtering
    add_index :prizes, :winnings_count
  end
  
  def down
    remove_index :prizes, :winnings_count
    remove_column :prizes, :winnings_count
  end
end