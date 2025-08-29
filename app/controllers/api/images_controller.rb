class Api::ImagesController < ApplicationController
  # Workaround controller for serving Active Storage images via API
  # when provider proxy blocks /rails/ paths
  
  def show
    begin
      Rails.logger.info "Image request: signed_id=#{params[:signed_id]}, filename=#{params[:filename]}"
      
      # Decode the signed_id and serve the blob
      blob = ActiveStorage::Blob.find_signed!(params[:signed_id])
      
      Rails.logger.info "Found blob: id=#{blob.id}, filename=#{blob.filename}, content_type=#{blob.content_type}"
      
      # Set basic headers for image serving - simplified for compatibility
      response.headers['Content-Type'] = blob.content_type
      response.headers['Content-Length'] = blob.byte_size.to_s
      response.headers['Cache-Control'] = 'public, max-age=31536000'
      response.headers['Access-Control-Allow-Origin'] = '*'
      
      # Stream the file content - back to working version
      send_data blob.download, 
                type: blob.content_type, 
                disposition: 'inline',
                filename: blob.filename.to_s
                
      Rails.logger.info "Successfully served image: #{blob.filename}"
                
    rescue ActiveStorage::FileNotFoundError => e
      Rails.logger.warn "Image not found: signed_id=#{params[:signed_id]}, error: #{e.message}"
      head :not_found
    rescue => e
      Rails.logger.error "Image serving error: signed_id=#{params[:signed_id]}, error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      head :internal_server_error
    end
  end
end