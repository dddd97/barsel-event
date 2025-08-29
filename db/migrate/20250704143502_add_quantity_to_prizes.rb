class AddQuantityToPrizes < ActiveRecord::Migration[8.0]
  def change
    add_column :prizes, :quantity, :integer, default: 1, null: false
  end
end
