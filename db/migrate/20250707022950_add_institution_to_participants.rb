class AddInstitutionToParticipants < ActiveRecord::Migration[8.0]
  def change
    add_column :participants, :institution, :string
  end
end
