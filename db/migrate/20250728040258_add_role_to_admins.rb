class AddRoleToAdmins < ActiveRecord::Migration[8.0]
  def change
    add_column :admins, :role, :integer, default: 0, null: false
    add_index :admins, :role
    
    # Update existing admins to have admin role by default
    reversible do |dir|
      dir.up do
        # Set first admin as super_admin, others as admin
        execute <<-SQL
          UPDATE admins SET role = 1 WHERE id = (SELECT MIN(id) FROM admins);
          UPDATE admins SET role = 0 WHERE role IS NULL;
        SQL
      end
    end
  end
end
