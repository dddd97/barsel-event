class AddCategoryToPrizes < ActiveRecord::Migration[8.0]
  def change
    add_column :prizes, :category, :string, default: 'regular'
    add_index :prizes, :category
  end
end 