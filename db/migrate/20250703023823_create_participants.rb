class CreateParticipants < ActiveRecord::Migration[8.0]
  def change
    create_table :participants do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name
      t.string :nik
      t.string :phone_number
      t.datetime :registered_at
      t.integer :draw_number
      t.boolean :winner

      t.timestamps
    end
  end
end
