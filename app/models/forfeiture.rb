class Forfeiture < ApplicationRecord
  belongs_to :event
  belongs_to :participant

  validates :participant_id, uniqueness: { scope: :event_id, message: "sudah pernah didiskualifikasi pada event ini." }
end
