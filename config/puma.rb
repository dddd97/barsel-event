# Puma configuration optimized for production stability and concurrency
# Configure thread pool for better memory management and concurrent request handling
max_threads_count = ENV.fetch("PUMA_MAX_THREADS") { ENV.fetch("RAILS_MAX_THREADS", 12) }.to_i
min_threads_count = ENV.fetch("PUMA_MIN_THREADS") { 4 }.to_i
threads min_threads_count, max_threads_count

# Multi-worker mode for better concurrency (safe in Docker with proper setup)
workers ENV.fetch("WEB_CONCURRENCY") { 2 }.to_i

# Specifies the `port` that Puma will listen on to receive requests; default is 3000.
port ENV.fetch("PORT", 3000)

# Specifies the `environment` that Puma will run in.
environment ENV.fetch("RAILS_ENV") { "production" }

# Allow puma to be restarted by `bin/rails restart` command.
plugin :tmp_restart

# Run the Solid Queue supervisor inside of Puma for single-server deployments
plugin :solid_queue if ENV["SOLID_QUEUE_IN_PUMA"]

# Specify the PID file. Defaults to tmp/pids/server.pid in development.
pidfile ENV["PIDFILE"] if ENV["PIDFILE"]

# Configure request timeout to prevent hanging requests
worker_timeout 60 if ENV.fetch("WEB_CONCURRENCY", 0).to_i > 0

# Only bind once - let Rails/Puma handle the default binding
# Remove duplicate bind statements that cause conflicts

on_worker_boot do
  # Worker specific setup for clustered mode
  if ENV.fetch("WEB_CONCURRENCY", 0).to_i > 0
    ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
  end
end

before_fork do
  # Close database connections before forking (clustered mode only)
  if ENV.fetch("WEB_CONCURRENCY", 0).to_i > 0
    ActiveRecord::Base.connection_pool.disconnect! if defined?(ActiveRecord)
  end
end
