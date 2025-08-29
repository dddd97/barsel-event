class CreateForfeitures < ActiveRecord::Migration[7.1]
  def change
    create_table :forfeitures do |t|
      t.references :event, null: false, foreign_key: true
      t.references :participant, null: false, foreign_key: true

      t.timestamps
    end

    add_index :forfeitures, [:event_id, :participant_id], unique: true
  end
end
