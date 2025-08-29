Rails.application.routes.draw do
  # Health check endpoint for Docker
  get 'health', to: proc { [200, {}, ['OK']] }
  
  # Preflight OPTIONS requests for CORS
  match '*path', to: 'api/cors#preflight', via: :options
  
  # API routes
  namespace :api do
    # Health check for API namespace
    get 'health', to: proc { [200, {}, ['OK']] }
    get 'me', to: 'admins#me'
    get 'debug', to: 'admins#debug'
    
    # Quick fix for frontend /api/users calls - return empty array
    get 'users', to: proc { [200, {'Content-Type' => 'application/json'}, ['[]']] }
    
    # Debug endpoint for banner URL testing
    get 'test_banner', to: proc { |env|
      event = Event.first
      result = {
        rails_env: Rails.env,
        has_event: event.present?,
        banner_attached: event&.banner&.attached?,
        banner_url_method: event&.banner_url,
        signed_id: event&.banner&.signed_id
      }
      [200, {'Content-Type' => 'application/json'}, [result.to_json]]
    }
    
    # Workaround for provider proxy issues - serve images via API
    get 'images/:signed_id/*filename', to: 'images#show', constraints: { filename: /.*/ }
    
    # Dashboard routes
    resources :dashboard, only: [:index] do
      collection do
        get :stats
        get :events  # SSE endpoint for real-time updates
      end
    end
    
    resources :sessions, only: [:create] do
      collection do
        get :debug
        delete :logout, to: 'sessions#destroy'
      end
    end
    
    # Audit logs routes
    resources :audit_logs, only: [:index, :show] do
      collection do
        get :stats
      end
    end
    
    resources :events, only: [:index, :show] do
      resources :prizes
      resources :participants do
        collection do
          get :export
        end
        member do
          get :card_data
          get :download_card
        end
      end
      
      member do
        get 'check-registration', to: 'participants#check_registration', as: :check_registration
      end
      
      # Prize drawing routes
      resources :prize_drawings, only: [] do
        collection do
          get :statistics
          get :eligible_participants
        end
        member do
          post :draw
          post :reset
        end
      end
      
      member do
        post 'draw', to: 'events#draw'
        get 'winners', to: 'events#winners'
      end
    end
    resources :participants, only: [:create]
    
    namespace :admin do
      resource :profile, only: [:show, :update] do
        get :debug
      end
      resources :admins, only: [:index, :show, :create, :update, :destroy]
      resources :events do
        collection do
          get :debug_list
          post :simple_create
        end
        resources :participants do
          collection do
            get :export
          end
        end
        resources :prizes
        
        # Prize drawing routes
        resources :prize_drawings, only: [] do
          collection do
            get :statistics
            get :eligible_participants
          end
          member do
            post :draw
            post :preview_draw
            post :confirm_winner
            post :reset
          end
        end
        
        member do
          get 'winners', to: 'events#winners'
        end
      end
    end
  end

  # Admin Panel routes
  namespace :admin_panel do
    get 'login', to: 'sessions#new'
    post 'login', to: 'sessions#create'
    get 'logout', to: 'sessions#destroy'
    delete 'logout', to: 'sessions#destroy'
    
    get 'dashboard', to: 'dashboard#index'
    
    resources :admins
    resources :audit_logs, only: [:index, :show]
    
    resources :events do
      resources :prizes do
        member do
          post 'draw'
          post 'reset_draw'
          post 'forfeit_and_redraw'
        end
        collection do
          post 'draw_all'
          post 'reset_all_draws'
        end
      end

      resources :participants do
        collection do
          get :export
        end
      end
      
      # Prize drawing management
      member do
        get 'prize_drawing', to: 'events#prize_drawing'
      end
      
      resource :live_drawing, only: [:show] do
        post 'draw_prize/:prize_id', to: 'live_drawings#draw_prize', as: :draw_prize
        post 'reset_prize/:prize_id', to: 'live_drawings#reset_prize', as: :reset_prize
      end
    end
  end

  # API-only backend - no Rails views needed
  # Frontend SPA handles all routing
  root to: proc { [200, {'Content-Type' => 'application/json'}, [{'status' => 'API OK', 'frontend_url' => 'http://103.123.24.253:8081'}.to_json]] }
end
