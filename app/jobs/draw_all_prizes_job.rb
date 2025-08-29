class DrawAllPrizesJob < ApplicationJob
  queue_as :default

  def perform(event_id)
    event = Event.find(event_id)
    
    undrawn_prizes = event.prizes.where(winner_id: nil)
    return if undrawn_prizes.empty?

    available_participants = event.participants.where.not(id: ineligible_participant_ids(event)).to_a
    return if available_participants.empty?

    ActiveRecord::Base.transaction do
      undrawn_prizes.each do |prize|
        break if available_participants.empty?

        winners_to_draw_count = [prize.quantity, available_participants.count].min
        
        winners = available_participants.sample(winners_to_draw_count)
        
        available_participants -= winners

        first_winner = winners.shift
        prize.update!(winner: first_winner, quantity: 1)

        winners.each do |winner|
          Prize.create!(
            event: event,
            name: prize.name,
            description: prize.description,
            image: prize.image,
            quantity: 1,
            winner: winner
          )
        end
      end
    end
  end

  private

  def ineligible_participant_ids(event)
    winner_ids = event.prizes.where.not(winner_id: nil).pluck(:winner_id)
    forfeited_ids = event.forfeitures.pluck(:participant_id)
    (winner_ids + forfeited_ids).uniq
  end
end 