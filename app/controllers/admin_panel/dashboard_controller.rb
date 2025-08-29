module AdminPanel
  class DashboardController < AdminPanel::BaseController
    def index
      @total_events = Event.count
      @total_participants = Participant.count
      @total_prizes = Prize.sum(:quantity)
      @total_winners = Winning.count
    end
  end
end 