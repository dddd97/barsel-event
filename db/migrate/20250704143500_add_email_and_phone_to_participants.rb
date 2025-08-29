class AddEmailAndPhoneToParticipants < ActiveRecord::Migration[7.0]
  def change
    add_column :participants, :email, :string
    add_column :participants, :phone, :string
  end
end 