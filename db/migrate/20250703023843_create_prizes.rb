class CreatePrizes < ActiveRecord::Migration[8.0]
  def change
    create_table :prizes do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name
      t.text :description
      t.integer :winner_id

      t.timestamps
    end
  end
end
