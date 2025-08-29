class AddRegistrationPeriodToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :registration_start, :datetime
    add_column :events, :registration_end, :datetime
    add_index :events, :registration_start
    add_index :events, :registration_end
  end
end 