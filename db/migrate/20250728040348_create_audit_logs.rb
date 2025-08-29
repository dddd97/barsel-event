class CreateAuditLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :audit_logs do |t|
      t.references :admin, null: false, foreign_key: true
      t.string :action, null: false
      t.string :resource_type
      t.integer :resource_id
      t.text :details
      t.string :ip_address, null: false
      t.string :user_agent, null: false

      t.timestamps
    end

    # Add indexes for better query performance
    add_index :audit_logs, [:admin_id, :created_at]
    add_index :audit_logs, [:action, :created_at]
    add_index :audit_logs, [:resource_type, :resource_id]
    add_index :audit_logs, :created_at
  end
end
