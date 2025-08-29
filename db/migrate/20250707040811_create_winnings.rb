class CreateWinnings < ActiveRecord::Migration[8.0]
  def change
    create_table :winnings do |t|
      t.references :prize, null: false, foreign_key: true
      t.references :participant, null: false, foreign_key: true

      t.timestamps
    end
  end
end
