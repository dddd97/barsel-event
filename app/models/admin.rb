class Admin < ApplicationRecord
  has_secure_password

  has_many :created_events, class_name: 'Event', foreign_key: 'creator_id', dependent: :nullify
  has_many :audit_logs, dependent: :destroy
  
  has_one_attached :profile_photo do |attachable|
    attachable.variant :thumb, resize_to_limit: [100, 100]
    attachable.variant :medium, resize_to_limit: [300, 300]
  end

  # Role enum for Rails 8.0.2 - Using suffix to avoid conflicts
  enum :role, { admin: 0, super_admin: 1, moderator: 2 }, suffix: true

  validates :name, presence: true
  validates :email, presence: true, 
                   uniqueness: { case_sensitive: false },
                   format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, 
                      length: { minimum: 6 },
                      if: -> { new_record? || changes[:password_digest] }
  validates :role, presence: true
  validates :profile_photo, content_type: { 
    in: ['image/png', 'image/jpeg'], 
    message: 'harus berformat PNG atau JPEG'
  }, size: { 
    less_than: 2.megabytes, 
    message: 'tidak boleh lebih dari 2MB'
  }, if: -> { profile_photo.attached? }

  def profile_photo_url
    return nil unless profile_photo.attached? && persisted?
    
    begin
      # Generate URL with full domain to prevent frontend path concatenation issues
      signed_id = profile_photo.signed_id
      filename = profile_photo.filename.to_s
      
      # Use environment-based URL configuration
      base_url = get_base_url
      url = "#{base_url}/api/images/#{signed_id}/#{filename}"
      
      Rails.logger.info "Generated profile photo URL for admin #{id}: #{url}"
      url
    rescue => e
      Rails.logger.error("Error getting profile photo URL for admin #{id}: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      nil
    end
  end
  
  # Mencegah admin terakhir dihapus
  before_destroy :ensure_not_last_admin
  # Mencegah super admin terakhir dihapus
  before_destroy :ensure_not_last_super_admin
  
  # Scope untuk super admin
  scope :super_admins, -> { where(role: 'super_admin') }
  scope :admins, -> { where(role: 'admin') }
  scope :moderators, -> { where(role: 'moderator') }
  
  # Permission methods
  def can_manage_events?
    super_admin_role? || admin_role?
  end

  def can_manage_participants?
    super_admin_role? || admin_role? || moderator_role?
  end

  def can_manage_prizes?
    super_admin_role? || admin_role?
  end

  def can_manage_admins?
    super_admin_role?
  end

  def can_view_audit_logs?
    super_admin_role? || admin_role?
  end

  def can_delete_events?
    super_admin_role? || admin_role?
  end

  def can_draw_prizes?
    super_admin_role? || admin_role? || moderator_role?
  end

  def role_display_name
    case role
    when 'super_admin'
      'Super Admin'
    when 'admin'
      'Admin'
    when 'moderator'
      'Moderator'
    else
      role.humanize
    end
  end
  
  private
  
  def get_base_url
    # Environment-based URL configuration
    base_url = if ENV['API_BASE_URL'].present?
      ENV['API_BASE_URL']
    elsif Rails.env.production?
      production_domain = ENV['PRODUCTION_DOMAIN'] || 'event.baritoselatankab.go.id'
      protocol = ENV['RAILS_FORCE_SSL'].present? ? 'https' : 'http'
      "#{protocol}://#{production_domain}"
    else
      dev_port = ENV['BACKEND_PORT'] || '3000'
      "http://localhost:#{dev_port}"
    end
    
    Rails.logger.info "Admin get_base_url result: #{base_url} (Rails.env=#{Rails.env}, API_BASE_URL=#{ENV['API_BASE_URL']}, PRODUCTION_DOMAIN=#{ENV['PRODUCTION_DOMAIN']})"
    base_url
  end
  
  def ensure_not_last_admin
    if Admin.count <= 1
      errors.add(:base, 'Tidak dapat menghapus admin terakhir')
      throw :abort
    end
  end
  
  def ensure_not_last_super_admin
    if super_admin_role? && Admin.super_admins.count <= 1
      errors.add(:base, 'Tidak dapat menghapus super admin terakhir')
      throw :abort
    end
  end
end 