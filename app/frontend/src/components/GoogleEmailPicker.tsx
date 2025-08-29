import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface GoogleEmailPickerProps {
  onEmailSelect: (email: string, name: string) => void;
  onError?: (error: string) => void;
}

interface DecodedToken {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export const GoogleEmailPicker = ({ onEmailSelect, onError }: GoogleEmailPickerProps) => {
  const handleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        onError?.('Tidak ada data kredensial dari Google');
        return;
      }
      
      const decoded = jwtDecode<DecodedToken>(credentialResponse.credential);
      const fullName = decoded.name || `${decoded.given_name} ${decoded.family_name}`.trim();
      onEmailSelect(decoded.email, fullName);
    } catch (error) {
      console.error('Error decoding Google token:', error);
      onError?.('Gagal memproses data dari Google');
    }
  };

  const handleError = () => {
    onError?.('Gagal menghubungkan dengan Google');
  };

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
        width="100%"
        locale="id"
        context="signin"
        auto_select={false}
        cancel_on_tap_outside={true}
      />
    </div>
  );
}; 