class SetupAdminSystem < ActiveRecord::Migration[8.0]
  def change
    create_table :admins do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false

      t.timestamps
    end

    add_index :admins, :email, unique: true
    
    # Buat admin default
    reversible do |dir|
      dir.up do
        # Pastikan model Admin sudah di-load
        require Rails.root.join('app/models/admin')
        
        Admin.create!(
          name: 'Admin',
          email: 'admin@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        )
      end
    end
  end
end
