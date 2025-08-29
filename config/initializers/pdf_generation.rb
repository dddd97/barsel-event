# PDF Generation Configuration
# Limit concurrent PDF generation to prevent system overload

class PDFGeneration
  # Allow maximum 2 concurrent PDF generations
  @@semaphore = Concurrent::Semaphore.new(2)
  
  def self.with_semaphore(&block)
    @@semaphore.acquire do
      yield
    end
  rescue => e
    Rails.logger.error "PDF Generation failed with semaphore: #{e.message}"
    raise e
  end
end