import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: string) => void;
  handleApiError: (error: AxiosError, context?: string) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const handleApiError = useCallback((error: AxiosError, context?: string) => {
    const status = error.response?.status;
    const errorData = error.response?.data as any;
    
    let message = 'Terjadi kesalahan';
    
    switch (status) {
      case 400:
        message = errorData?.error || 'Permintaan tidak valid';
        break;
      case 401:
        message = 'Sesi berakhir. Silakan login kembali';
        break;
      case 403:
        message = 'Anda tidak memiliki akses untuk melakukan ini';
        break;
      case 404:
        message = 'Data tidak ditemukan';
        break;
      case 422:
        // Handle validation errors
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: string) => toast.error(err));
          return;
        } else if (errorData?.error) {
          message = errorData.error;
        } else {
          message = 'Data tidak valid';
        }
        break;
      case 429:
        message = 'Terlalu banyak permintaan. Coba lagi nanti';
        break;
      case 500:
        message = 'Terjadi kesalahan server. Coba lagi nanti';
        break;
      default:
        message = errorData?.error || errorData?.message || 'Terjadi kesalahan yang tidak terduga';
    }
    
    if (context) {
      message = `${context}: ${message}`;
    }
    
    toast.error(message);
  }, []);
  
  const handleError = useCallback((error: unknown, context?: string) => {
    console.error('Error:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      handleApiError(error as AxiosError, context);
    } else {
      const message = context 
        ? `${context}: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}` 
        : (error instanceof Error ? error.message : 'Terjadi kesalahan');
      toast.error(message);
    }
  }, [handleApiError]);
  
  return { handleError, handleApiError };
};
