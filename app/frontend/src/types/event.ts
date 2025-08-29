export interface Event {
  id: number;
  name: string;
  eventDate: string;
  startTime?: string;
  location: string;
  description: string;
  ticketPrice: number;
  maxParticipants: number;
  registrationStatus: 'Pendaftaran dibuka' | 'Pendaftaran ditutup';
  category: 'utama' | 'reguler';
  participantsCount: number;
  availableSlots: number | null;
  registrationStart: string;
  registrationEnd: string;
  bannerUrl?: string;
  optimizedBannerUrls?: {
    thumb?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  createdAt: string;
  updatedAt: string;
  
  // Backend original names (for reference)
  event_date?: string;
  start_time?: string;
  ticket_price?: number;
  max_participants?: number;
  registration_status?: 'Pendaftaran dibuka' | 'Pendaftaran ditutup';
  participants_count?: number;
  available_slots?: number | null;
  registration_start?: string;
  registration_end?: string;
  banner_url?: string;
  created_at?: string;
  updated_at?: string;
  
  // Contact persons
  contactPerson1Name?: string;
  contactPerson1Phone?: string;
  contactPerson2Name?: string;
  contactPerson2Phone?: string;
  
  // Creator information
  creator?: {
    id: number;
    name: string;
    email: string;
    profilePhoto?: string;
  };
} 