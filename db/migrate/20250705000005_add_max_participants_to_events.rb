class AddMaxParticipantsToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :max_participants, :integer
  end
end 