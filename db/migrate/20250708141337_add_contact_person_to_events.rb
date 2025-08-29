class AddContactPersonToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :contact_person1_name, :string
    add_column :events, :contact_person1_phone, :string
    add_column :events, :contact_person2_name, :string
    add_column :events, :contact_person2_phone, :string
  end
end
