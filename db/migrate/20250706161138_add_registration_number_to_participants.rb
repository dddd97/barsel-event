class AddRegistrationNumberToParticipants < ActiveRecord::Migration[8.0]
  def change
    add_column :participants, :registration_number, :string
    add_index :participants, [:event_id, :registration_number], unique: true
  end
end
