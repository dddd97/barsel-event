class AddStartTimeToEvents < ActiveRecord::Migration[8.0]
  def change
    add_column :events, :start_time, :time
  end
end