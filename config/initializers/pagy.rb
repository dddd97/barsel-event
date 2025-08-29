# config/initializers/pagy.rb

# Memastikan gem Pagy dimuat saat aplikasi dimulai.
require 'pagy'
 
# Anda bisa menyesuaikan pengaturan default Pagy di sini.
# Contoh: Mengubah jumlah item default per halaman dari 20 menjadi 25.
# Pagy::DEFAULT[:items] = 25 