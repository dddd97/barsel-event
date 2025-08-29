import { useState, useCallback } from 'react';
import ParticipantCardService from '../services/participantCardService';
import type { CardData } from '../services/participantCardService';

interface UseParticipantCardProps {
  eventId: number;
  participantId?: number;
}

interface UseParticipantCardReturn {
  cardData: CardData | null;
  loading: boolean;
  error: string | null;
  fetchCardData: (participantId: number) => Promise<void>;
  downloadCard: (participantId: number) => Promise<void>;
  clearError: () => void;
}

export const useParticipantCard = ({ eventId }: UseParticipantCardProps): UseParticipantCardReturn => {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCardData = useCallback(async (participantId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await ParticipantCardService.getCardData(eventId, participantId);
      setCardData(data);
    } catch (err) {
      console.error('Failed to fetch card data:', err);
      setError('Gagal memuat data kartu peserta. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const downloadCard = useCallback(async (participantId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await ParticipantCardService.downloadCard(eventId, participantId);
    } catch (err) {
      console.error('Failed to download card:', err);
      setError('Gagal mengunduh kartu peserta. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    cardData,
    loading,
    error,
    fetchCardData,
    downloadCard,
    clearError
  };
};

export default useParticipantCard; 