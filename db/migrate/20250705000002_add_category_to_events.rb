class AddCategoryToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :category, :string, default: 'regular'
    add_index :events, :category
  end
end 