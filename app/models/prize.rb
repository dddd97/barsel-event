class Prize < ApplicationRecord
  belongs_to :event
  has_one_attached :image

  has_many :winnings, dependent: :destroy, counter_cache: true
  has_many :winners, through: :winnings, source: :participant

  validates :name, presence: true
  validates :quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1 }
  validates :category, presence: true, inclusion: { in: %w[utama reguler] }
  validates :image, content_type: { 
    in: ['image/png', 'image/jpeg'], 
    message: 'harus berformat PNG atau JPEG'
  }, size: { 
    less_than: 2.megabytes, 
    message: 'tidak boleh lebih dari 2MB'
  }, if: -> { image.attached? }

  def image_url
    return nil unless image.attached? && persisted?
    
    begin
      # Generate URL with full domain to prevent frontend path concatenation issues
      signed_id = image.signed_id
      filename = image.filename.to_s
      
      # Use environment-based URL configuration
      base_url = get_base_url
      "#{base_url}/api/images/#{signed_id}/#{filename}"
    rescue => e
      Rails.logger.error("Error getting prize image URL: #{e.message}")
      nil
    end
  end

  scope :ordered_by_category, -> { 
    order(Arel.sql("CASE WHEN category = 'utama' THEN 0 ELSE 1 END"), created_at: :asc) 
  }

  def undrawn?
    # Use counter cache for better performance
    winnings_count < quantity
  end

  def drawn?
    !undrawn?
  end
  
  def remaining_quantity
    # Use counter cache for better performance
    [quantity - winnings_count, 0].max
  end

  # Helper method untuk konversi kategori lama
  def self.migrate_categories
    Prize.where(category: 'main').update_all(category: 'utama')
    Prize.where(category: 'regular').update_all(category: 'reguler')
  end
  
  private
  
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
end
