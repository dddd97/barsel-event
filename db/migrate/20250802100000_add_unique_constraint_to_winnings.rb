class AddUniqueConstraintToWinnings < ActiveRecord::Migration[8.0]
  def change
    # Remove the existing non-unique index first
    remove_index :winnings, name: "index_winnings_on_participant_and_prize" if index_exists?(:winnings, [:participant_id, :prize_id], name: "index_winnings_on_participant_and_prize")
    
    # Clean up duplicate winnings - keep only the earliest one for each participant-prize combination
    execute <<-SQL
      DELETE FROM winnings 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM winnings 
        GROUP BY participant_id, prize_id
      );
    SQL
    
    # Add unique constraint to prevent duplicate winnings for same participant-prize combination
    add_index :winnings, [:participant_id, :prize_id], unique: true, name: "index_winnings_on_participant_and_prize_unique"
  end
end