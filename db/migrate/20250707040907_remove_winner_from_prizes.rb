class RemoveWinnerFromPrizes < ActiveRecord::Migration[7.1]
  def change
    remove_column :prizes, :winner_id, :bigint
  end
end
