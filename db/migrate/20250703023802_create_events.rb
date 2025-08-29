class CreateEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :events do |t|
      t.string :name
      t.text :description
      t.date :date
      t.string :location
      t.boolean :is_active

      t.timestamps
    end
  end
end
