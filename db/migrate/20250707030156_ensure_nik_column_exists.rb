class EnsureNikColumnExists < ActiveRecord::Migration[8.0]
  def change
    unless column_exists?(:participants, :nik)
      add_column :participants, :nik, :string
    end
    
    # Add index for faster lookups
    add_index :participants, [:event_id, :nik], unique: true, name: 'index_participants_on_event_id_and_nik'
  end
end
