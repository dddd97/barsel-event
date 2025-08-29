class AddEventDateToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :event_date, :date
  end
end
