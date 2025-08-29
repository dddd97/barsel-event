class Event < ApplicationRecord
  belongs_to :creator, class_name: 'Admin'
  has_many :participants, dependent: :destroy
  has_many :prizes, dependent: :destroy
  has_many :winnings, through: :prizes
  has_many :winners, -> { distinct }, through: :winnings, source: :participant
  has_many :forfeitures, dependent: :destroy
  has_many :forfeited_participants, through: :forfeitures, source: :participant

  has_one_attached :banner do |attachable|
    attachable.variant :thumb, resize_to_limit: [150, 150]
    attachable.variant :small, resize_to_limit: [400, 300]
    attachable.variant :medium, resize_to_limit: [800, 600]
    attachable.variant :large, resize_to_limit: [1200, 900]
  end
  
  before_validation :assign_sequence_number, on: :create

  validates :name, presence: true
  validates :event_date, presence: true
  validates :category, presence: true, inclusion: { in: %w[utama reguler] }
  validates :sequence_number, presence: true, uniqueness: true
  validates :creator, presence: { message: "wajib diisi" }
  validates :max_participants, numericality: { 
    only_integer: true,
    greater_than_or_equal_to: 0,
    less_than_or_equal_to: 9999,
    allow_nil: true,
    message: "harus berupa angka antara 0-9999 (sesuai kapasitas slot machine)"
  }
  validates :banner, content_type: { 
    in: ['image/png', 'image/jpeg'], 
    message: 'harus berformat PNG atau JPEG'
  }, size: { 
    less_than: 2.megabytes, 
    message: 'tidak boleh lebih dari 2MB'
  }, if: -> { banner.attached? || banner.changed? }
  validate :registration_period_is_valid
  validate :registration_end_before_event_date

  scope :main_events, -> { where(category: 'utama') }
  scope :regular_events, -> { where(category: 'reguler') }
  
  # Modified to prioritize 'utama' category
  scope :ordered_by_category, -> { 
    order(Arel.sql("CASE WHEN category = 'utama' THEN 0 ELSE 1 END"), event_date: :asc, created_at: :asc) 
  }

  def banner_url(size: nil)
    return nil unless banner.attached? && persisted?
    
    begin
      # Try to use caching with safer cache key
      cache_key = safe_cache_key(size)
      return generate_banner_url(size) unless cache_key
      
      SafeCache.fetch(cache_key, expires_in: 1.hour) do
        generate_banner_url(size)
      end
    rescue => cache_error
      Rails.logger.warn("Banner cache error for event #{id}: #{cache_error.message}")
      # Always fallback to direct URL generation
      generate_banner_url(size)
    end
  rescue => e
    Rails.logger.error("Fatal banner URL error for event #{id}: #{e.message}")
    nil
  end

  # Add optimized banner URL methods with fallback
  def optimized_banner_url(size: :medium)
    return banner_url unless banner.attached?
    
    begin
      case size.to_sym
      when :thumb
        variant_url(:thumb)
      when :small  
        variant_url(:small)
      when :medium
        variant_url(:medium)
      when :large
        variant_url(:large)
      else
        banner_url # fallback to original
      end
    rescue => e
      Rails.logger.warn("Variant generation failed for event #{id}, size #{size}: #{e.message}")
      banner_url # fallback to original
    end
  end

  private

  def safe_cache_key(size = nil)
    suffix = size ? "_#{size}" : ""
    return "event_banner_#{id}_#{updated_at.to_i}#{suffix}" unless banner.blob
    
    begin
      checksum = banner.blob.checksum
      "event_banner_#{id}_#{checksum}#{suffix}"
    rescue => e
      Rails.logger.debug("Checksum error for event #{id}, using timestamp: #{e.message}")
      "event_banner_#{id}_#{updated_at.to_i}#{suffix}"
    end
  rescue => e
    Rails.logger.warn("Cache key generation failed for event #{id}: #{e.message}")
    nil
  end

  def generate_banner_url(size = nil)
    begin
      signed_id = banner.signed_id
      filename = banner.filename.to_s
      
      # Use environment-based URL configuration
      base_url = get_base_url
      url = "#{base_url}/api/images/#{signed_id}/#{filename}"
      size ? "#{url}?size=#{size}" : url
    rescue => e
      Rails.logger.error("Error generating banner URL for event #{id}: #{e.message}")
      nil
    end
  end

  def variant_url(size)
    begin
      variant = banner.variant(size)
      # Rails 8 compatibility: use variant.blob.signed_id directly
      signed_id = variant.blob.signed_id
      filename = banner.filename.to_s
      
      base_url = get_base_url
      "#{base_url}/api/images/#{signed_id}/#{filename}?variant=#{size}"
    rescue => e
      Rails.logger.warn("Variant URL generation failed for event #{id}, size #{size}: #{e.message}")
      banner_url # fallback to original
    end
  end

  def self.find_by_name(name)
    find_by(name: name)
  end

  public

  def registration_open?
    return false if registration_start.nil? || registration_end.nil?
    return false if max_participants.present? && participants.count >= max_participants
    
    now = Time.current
    now >= registration_start && now <= registration_end
  end

  def registration_status
    return 'Belum dibuka' if registration_start.nil? || registration_end.nil?
    
    if max_participants.present? && participants.count >= max_participants
      'Pendaftaran ditutup (Kuota Penuh)'
    else
      now = Time.current
      if now < registration_start
        'Pendaftaran akan dibuka'
      elsif now > registration_end
        'Pendaftaran sudah ditutup'
      else
        'Pendaftaran dibuka'
      end
    end
  end

  def available_slots
    return nil if max_participants.nil?
    [max_participants - participants.count, 0].max
  end

  def slots_filled?
    max_participants.present? && participants.count >= max_participants
  end

  # Helper method untuk konversi kategori lama
  def self.migrate_categories
    Event.where(category: 'utama').update_all(category: 'utama')
    Event.where(category: 'reguler').update_all(category: 'reguler')
  end


  def get_base_url
    # Environment-based URL configuration
    if ENV['API_BASE_URL'].present?
      ENV['API_BASE_URL']
    elsif Rails.env.production?
      production_domain = ENV['PRODUCTION_DOMAIN'] || 'event.baritoselatankab.go.id'
      protocol = ENV['RAILS_FORCE_SSL'].present? ? 'https' : 'http'
      "#{protocol}://#{production_domain}"
    else
      dev_port = ENV['BACKEND_PORT'] || '3000'
      "http://localhost:#{dev_port}"
    end
  end

  def assign_sequence_number
    # Use EventSequence to get the next sequence number
    self.sequence_number = EventSequence.next_sequence_number
  end

  def registration_period_is_valid
    return unless registration_start.present? && registration_end.present?

    if registration_end <= registration_start
      errors.add(:registration_end, 'harus setelah waktu pembukaan pendaftaran')
    end
  end

  def registration_end_before_event_date
    return unless registration_end.present? && event_date.present?

    if registration_end > event_date
      errors.add(:registration_end, 'harus sebelum tanggal acara')
    end
  end
end
