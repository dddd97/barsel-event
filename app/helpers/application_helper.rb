module ApplicationHelper
  include Pagy::Frontend

  def censor_nik(nik)
    return nil unless nik.present?
    return nik if nik.length < 5
    
    # Keep first 8 digits, censor middle 4, show last 4
    visible_part_start = nik[0..7]
    censored_part = "XXXX"
    visible_part_end = nik[-4..-1]
    
    "#{visible_part_start}#{censored_part}#{visible_part_end}"
  end

  def format_indonesian_date(date)
    return '-' unless date

    bulan = {
      1 => 'Januari',
      2 => 'Februari',
      3 => 'Maret',
      4 => 'April',
      5 => 'Mei',
      6 => 'Juni',
      7 => 'Juli',
      8 => 'Agustus',
      9 => 'September',
      10 => 'Oktober',
      11 => 'November',
      12 => 'Desember'
    }

    "#{date.day} #{bulan[date.month]} #{date.year}"
  end
  
  def format_indonesian_short_date(date)
    return '-' unless date
    
    bulan_singkat = {
      1 => 'Jan',
      2 => 'Feb',
      3 => 'Mar',
      4 => 'Apr',
      5 => 'Mei',
      6 => 'Jun',
      7 => 'Jul',
      8 => 'Agt',
      9 => 'Sep',
      10 => 'Okt',
      11 => 'Nov',
      12 => 'Des'
    }
    
    "#{date.day} #{bulan_singkat[date.month]} #{date.year}"
  end
  
  def format_indonesian_day_date(date)
    return '-' unless date
    
    hari = {
      0 => 'Minggu',
      1 => 'Senin',
      2 => 'Selasa',
      3 => 'Rabu',
      4 => 'Kamis',
      5 => 'Jumat',
      6 => 'Sabtu'
    }
    
    bulan = {
      1 => 'Januari',
      2 => 'Februari',
      3 => 'Maret',
      4 => 'April',
      5 => 'Mei',
      6 => 'Juni',
      7 => 'Juli',
      8 => 'Agustus',
      9 => 'September',
      10 => 'Oktober',
      11 => 'November',
      12 => 'Desember'
    }
    
    "#{hari[date.wday]}, #{date.day} #{bulan[date.month]} #{date.year}"
  end
  
  def format_indonesian_datetime(datetime)
    return '-' unless datetime
    
    bulan = {
      1 => 'Januari',
      2 => 'Februari',
      3 => 'Maret',
      4 => 'April',
      5 => 'Mei',
      6 => 'Juni',
      7 => 'Juli',
      8 => 'Agustus',
      9 => 'September',
      10 => 'Oktober',
      11 => 'November',
      12 => 'Desember'
    }
    
    "#{datetime.day} #{bulan[datetime.month]} #{datetime.year}, #{datetime.strftime("%H:%M")} WIB"
  end
  
  def format_phone_number(phone)
    return '-' unless phone.present?
    
    # Hapus karakter non-digit
    digits = phone.gsub(/\D/, '')
    
    # Format nomor sesuai panjangnya
    case digits.length
    when 0..3
      digits
    when 4..7
      "#{digits[0..3]}-#{digits[4..-1]}"
    when 8..11
      "#{digits[0..3]}-#{digits[4..7]}-#{digits[8..-1]}"
    else
      remaining = digits[12..-1]
      if remaining.present?
        "#{digits[0..3]}-#{digits[4..7]}-#{digits[8..11]}-#{remaining}"
      else
        "#{digits[0..3]}-#{digits[4..7]}-#{digits[8..11]}"
      end
    end
  end
end
