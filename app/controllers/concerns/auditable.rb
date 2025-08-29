module Auditable
  extend ActiveSupport::Concern

  private

  def log_activity(action, resource = nil, details = nil)
    return unless current_admin

    AuditLog.log_activity(
      admin: current_admin,
      action: action,
      resource: resource,
      details: details,
      request: request
    )
  end

  def log_login
    log_activity('login', nil, "Login berhasil")
  end

  def log_logout
    log_activity('logout', nil, "Logout dari sistem")
  end

  def log_create(resource, details = nil)
    log_activity('create', resource, details || "#{resource.class.name} dibuat")
  end

  def log_update(resource, details = nil)
    log_activity('update', resource, details || "#{resource.class.name} diupdate")
  end

  def log_delete(resource, details = nil)
    log_activity('delete', resource, details || "#{resource.class.name} dihapus")
  end

  def log_view(resource, details = nil)
    log_activity('view', resource, details || "#{resource.class.name} dilihat")
  end

  def log_draw_prize(prize, winner = nil)
    details = winner ? "Hadiah #{prize.name} diundi - Pemenang: #{winner.name}" : "Hadiah #{prize.name} diundi"
    log_activity('draw_prize', prize, details)
  end

  def log_reset_draw(prize)
    log_activity('reset_draw', prize, "Undian hadiah #{prize.name} direset")
  end

  def log_export_data(resource_type, details = nil)
    log_activity('export_data', nil, details || "Export data #{resource_type}")
  end
end 