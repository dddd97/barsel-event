# frozen_string_literal: true

module Api
  class CorsController < ApplicationController
    skip_before_action :verify_authenticity_token

    def preflight
      headers['Access-Control-Allow-Origin'] = request.headers['Origin'] || 'http://localhost:5173'
      headers['Access-control-allow-methods'] = 'POST, PUT, DELETE, GET, OPTIONS'
      headers['Access-control-allow-headers'] = 'Origin, X-Requested-with, Content-Type, Accept, Authorization'
      headers['Access-control-allow-credentials'] = 'true'
      headers['Access-control-max-age'] = '1728000'

      render plain: ''
    end
  end
end 