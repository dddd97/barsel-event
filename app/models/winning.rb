class Winning < ApplicationRecord
  belongs_to :prize, counter_cache: true
  belongs_to :participant
  
  # Prevent duplicate winnings for same participant-prize combination
  validates :participant_id, uniqueness: { scope: :prize_id, message: "has already won this prize" }
  
  # Also prevent participant from winning multiple prizes in same event
  validate :participant_can_only_win_once_per_event
  
  private
  
  def participant_can_only_win_once_per_event
    return unless participant && prize
    
    existing_winnings = Winning.joins(:prize)
                              .where(participant: participant)
                              .where(prizes: { event_id: prize.event_id })
                              .where.not(id: id)
    
    if existing_winnings.exists?
      errors.add(:participant, "can only win one prize per event")
    end
  end
end
