class AuditLog < ApplicationRecord
  belongs_to :admin
  belongs_to :resource, polymorphic: true, optional: true

  validates :action, presence: true
  validates :ip_address, presence: true
  validates :user_agent, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_admin, ->(admin) { where(admin: admin) }
  scope :by_action, ->(action) { where(action: action) }
  scope :by_resource_type, ->(type) { where(resource_type: type) }
  scope :today, -> { where(created_at: Date.current.beginning_of_day..Date.current.end_of_day) }
  scope :this_week, -> { where(created_at: 1.week.ago..Time.current) }

  # Action constants
  ACTIONS = {
    login: 'login',
    logout: 'logout',
    create: 'create',
    update: 'update',
    delete: 'delete',
    view: 'view',
    draw_prize: 'draw_prize',
    reset_draw: 'reset_draw',
    export_data: 'export_data',
    import_data: 'import_data'
  }.freeze

  def action_display_name
    case action
    when 'login'
      'Login ke sistem'
    when 'logout'
      'Logout dari sistem'
    when 'create'
      "Membuat #{resource_type_display_name}"
    when 'update'
      "Mengupdate #{resource_type_display_name}"
    when 'delete'
      "Menghapus #{resource_type_display_name}"
    when 'view'
      "Melihat #{resource_type_display_name}"
    when 'draw_prize'
      'Mengundi hadiah'
    when 'reset_draw'
      'Mereset undian hadiah'
    when 'export_data'
      'Export data'
    when 'import_data'
      'Import data'
    else
      action.humanize
    end
  end

  def resource_type_display_name
    case resource_type
    when 'Event'
      'Event'
    when 'Participant'
      'Peserta'
    when 'Prize'
      'Hadiah'
    when 'Admin'
      'Admin'
    else
      resource_type || 'Resource'
    end
  end

  def resource_display_name
    return resource_type_display_name unless resource

    case resource
    when Event
      resource.name
    when Participant
      resource.name
    when Prize
      resource.name
    when Admin
      resource.name
    else
      "#{resource_type} ##{resource_id}"
    end
  end

  # Class method to log activities
  def self.log_activity(admin:, action:, resource: nil, details: nil, request: nil)
    create!(
      admin: admin,
      action: action,
      resource: resource,
      details: details,
      ip_address: request&.remote_ip || 'unknown',
      user_agent: request&.user_agent || 'unknown'
    )
  rescue => e
    Rails.logger.error "Failed to log audit activity: #{e.message}"
  end
end
