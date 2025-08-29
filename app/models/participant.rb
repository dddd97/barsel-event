class Participant < ApplicationRecord
  belongs_to :event, counter_cache: true
  has_one_attached :card
  has_one :forfeiture, dependent: :destroy

  has_many :winnings, dependent: :destroy
  has_many :won_prizes, through: :winnings, source: :prize

  validates :name, presence: true, length: { maximum: 100 }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP, message: "harus berupa format email yang valid" }, 
                   allow_blank: true, length: { maximum: 100 },
                   uniqueness: { scope: :event_id, message: "sudah terdaftar untuk event ini" }
  validates :phone_number, presence: true,
                       format: { with: /\A\+?[\d\s-]{10,}\z/, message: "harus berupa nomor telepon yang valid" },
                       length: { maximum: 20 },
                       uniqueness: { scope: :event_id, message: "sudah terdaftar untuk event ini" }
  validates :registration_number, presence: true, uniqueness: { scope: :event_id }
  validates :nik, presence: true, length: { is: 16, message: "harus berupa 16 digit angka" }, 
                 format: { with: /\A\d{16}\z/, message: "harus berupa angka" },
                 uniqueness: { scope: :event_id, message: "sudah terdaftar untuk event ini" }
  validates :institution, length: { maximum: 100 }, allow_blank: true

  before_validation :generate_registration_number, on: :create
  before_create :check_event_capacity

  def winner?
    winnings.exists?
  end

  def forfeited?
    forfeiture.present?
  end

  private

  def generate_registration_number
    return if registration_number.present?
    
    # Use a transaction with advisory lock to prevent race conditions
    # This ensures that only one participant registration can be processed at a time per event
    self.registration_number = self.class.transaction do
      # Get an advisory lock specific to this event
      self.class.connection.execute("SELECT pg_advisory_xact_lock(#{event_id})")
      
      # Get event sequence number
      event_sequence = event.sequence_number
      
      # Find the highest sequential number used for this event
      # Extract the sequential part from existing registration numbers
      existing_numbers = event.participants
        .where("registration_number LIKE ?", "E#{event_sequence}-%")
        .pluck(:registration_number)
        .map { |reg_num| reg_num.split('-').last.to_i }
        .compact
      
      # The next number is the highest existing number + 1, or 1 if no participants exist
      next_number = existing_numbers.empty? ? 1 : existing_numbers.max + 1
      
      # Format: E<event_sequence>-<sequential_number>
      # Pad the number with leading zeros to ensure at least 4 digits
      "E#{event_sequence}-#{next_number.to_s.rjust(4, '0')}"
    end
  end

  def check_event_capacity
    return unless event.max_participants.present?
    
    if event.participants_count >= event.max_participants
      errors.add(:base, 'Event telah mencapai kapasitas maksimum peserta')
      throw :abort
    end
  end
end
