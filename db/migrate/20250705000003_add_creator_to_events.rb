class AddCreatorToEvents < ActiveRecord::Migration[8.0]
  def change
    add_reference :events, :creator, foreign_key: { to_table: :admins }
  end
end 