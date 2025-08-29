import api from '../lib/axios';
import { previewPDF, downloadPDF } from '../utils/api';

export interface CardData {
  event: {
    id: number;
    name: string;
    location: string;
    event_date: string;
  };
  participant: {
    id: number;
    name: string;
    nik: string;
    phone_number: string;
    institution: string;
    email: string | null;
    registration_number: string;
  };
  qr_code_svg: string;
  banner_data_uri?: string | null;
}

export class ParticipantCardService {
  /**
   * Fetch card data for a participant
   */
  static async getCardData(eventId: number, participantId: number): Promise<CardData> {
    const response = await api.get(`/api/events/${eventId}/participants/${participantId}/card_data`);
    return response.data;
  }

  /**
   * Preview card as PDF in new tab (like Google Drive)
   */
  static async previewCard(eventId: number, participantId: number): Promise<void> {
    const url = `/api/events/${eventId}/participants/${participantId}/download_card`;
    previewPDF(url);
  }

  /**
   * Download card as PDF file (forces download)
   */
  static async downloadCard(eventId: number, participantId: number): Promise<void> {
    const url = `/api/events/${eventId}/participants/${participantId}/download_card`;
    await downloadPDF(url);
  }

  /**
   * Generate QR code data for a participant
   */
  static generateQRData(eventId: number, participantId: number, registrationNumber: string, name: string): string {
    return JSON.stringify({
      event_id: eventId,
      participant_id: participantId,
      registration_number: registrationNumber,
      name: name
    });
  }

  /**
   * Format registration number for display
   */
  static formatRegistrationNumber(registrationNumber: string): string {
    // Add any formatting logic here if needed
    return registrationNumber;
  }

  /**
   * Censor NIK for privacy
   */
  static censorNIK(nik: string): string {
    if (nik.length <= 8) return nik;
    return nik.substring(0, 4) + '****' + nik.substring(nik.length - 4);
  }

  /**
   * Format Indonesian date
   */
  static formatIndonesianDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

export default ParticipantCardService; 