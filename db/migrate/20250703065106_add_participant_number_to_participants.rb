class AddParticipantNumberToParticipants < ActiveRecord::Migration[8.0]
  def change
    add_column :participants, :participant_number, :string
  end
end
