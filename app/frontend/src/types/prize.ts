export interface Prize {
  id: number;
  name: string;
  description: string;
  quantity: number;
  category: 'utama' | 'reguler';
  eventId: number;
  event?: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  
  // Dynamic calculated fields for prize drawing
  remainingQuantity?: number;
  wonCount?: number;
  
  // Aliases dari API baru
  prizeId?: number;
  prizeName?: string;
  prizeDescription?: string;
  prizeCategory?: 'utama' | 'reguler';
  prizeQuantity?: number;
  
  // Backend original names (for reference)
  nama_hadiah?: string;
  deskripsi?: string;
  jumlah?: number;
  kategori?: 'utama' | 'reguler';
  event_id?: number;
  created_at?: string;
  updated_at?: string;
  gambar_url?: string;
}

export interface PrizesResponse {
  prizes: Prize[];
} 