require 'grover'

# Konfigurasi Grover untuk menggunakan Chrome yang diunduh oleh puppeteer
Grover.configure do |config|
  # Try multiple Chrome paths
  chrome_paths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ]
  
  chrome_path = chrome_paths.find { |path| File.exist?(path) && File.executable?(path) }
  
  if chrome_path.nil?
    Rails.logger.error "No Chrome executable found in paths: #{chrome_paths.join(', ')}"
    chrome_path = '/usr/bin/google-chrome-stable' # fallback
  end
   
  config.options = {
    executable_path: chrome_path,
    launch_args: [
      '--no-sandbox',
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--run-all-compositor-stages-before-draw',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-ipc-flooding-protection',
      '--headless',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images'
    ],
    # Opsi tambahan
    wait_until: 'networkidle2',
    emulate_media: 'screen',
    prefer_css_page_size: true,
    print_background: true,
    timeout: 60_000
  }

  Rails.logger.info "Grover menggunakan Chrome di: #{chrome_path} (exists: #{File.exist?(chrome_path)}, executable: #{File.executable?(chrome_path) rescue false})"
end 