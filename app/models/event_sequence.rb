class EventSequence < ApplicationRecord
  # Get the next sequence number using compact numbering (no gaps)
  def self.next_sequence_number
    begin
      # Use a transaction with advisory lock to prevent race conditions
      transaction do
        # Get an advisory lock
        connection.execute("SELECT pg_advisory_xact_lock(0)")
        
        # Find the lowest available sequence number by checking existing events
        existing_sequences = Event.pluck(:sequence_number).compact.sort
        Rails.logger.info "EventSequence: existing sequences: #{existing_sequences}"
        
        # Find the first gap in the sequence, or use the next number after the highest
        next_number = 1
        existing_sequences.each do |seq_num|
          if next_number == seq_num
            next_number += 1
          else
            # Found a gap, use this number
            break
          end
        end
        
        Rails.logger.info "EventSequence: next number will be #{next_number}"
        # Return the next available number
        next_number
      end
    rescue => e
      Rails.logger.error "EventSequence error: #{e.message}, using fallback"
      Rails.logger.error e.backtrace.join("\n")
      
      # Fallback: simple max + 1
      max_seq = Event.maximum(:sequence_number) || 0
      fallback_number = max_seq + 1
      Rails.logger.info "EventSequence: using fallback number #{fallback_number}"
      fallback_number
    end
  end
end 