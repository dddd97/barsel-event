import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, CreditCard, Building2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '../lib/axios';
import { previewPDF, downloadPDF } from '../utils/api';
import { GoogleEmailPicker } from '../components/GoogleEmailPicker';

interface Event {
  id: number;
  name: string;
  title?: string;
  description: string;
  date?: string;
  eventDate: string;
  location: string;
  maxParticipants?: number;
  participantsCount: number;
}

export const EventRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    nik: '',
    institution: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [participantData, setParticipantData] = useState<any>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/api/events/${id}`);
        setEvent(response.data);
      } catch (err) {
        console.error('Failed to fetch event:', err);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: [] });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate that email is provided from Google
    if (!formData.email) {
      setError('Email wajib diisi melalui Google OAuth');
      return;
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      setError('Silakan verifikasi bahwa Anda bukan robot');
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await api.post(`/api/events/${id}/participants`, {
        participant: formData,
        'g-recaptcha-response': recaptchaToken,
      });
      
      if (response.status === 201) {
        setParticipantData(response.data);
        setRegistrationSuccess(true);
      }
    } catch (err: unknown) {
      if (
        err && 
        typeof err === 'object' && 
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'status' in err.response &&
        err.response.status === 422
      ) {
        setError('Terdapat kesalahan pada form. Mohon periksa kembali data yang diisi.');
        if ('data' in err.response && err.response.data && typeof err.response.data === 'object' && 'errors' in err.response.data) {
          setFieldErrors(err.response.data.errors as Record<string, string[]>);
        }
      } else if (
        err && 
        typeof err === 'object' && 
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
      ) {
        setError(String(err.response.data.error));
      } else {
        setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
      }
      
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCard = async () => {
    if (!participantData) return;
    
    setCardLoading(true);
    try {
      // Use the same method as CheckRegistration
      const url = `/api/events/${id}/participants/${participantData.id}/download_card`;
      await downloadPDF(url);
    } catch (error) {
      console.error('Failed to download card:', error);
      alert('Gagal mengunduh kartu peserta');
    } finally {
      setCardLoading(false);
    }
  };

  const handleGoogleEmailSelect = (email: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      email: email,
      name: name || prev.name // Use Google name if available, otherwise keep existing
    }));
    setGoogleError(null);
  };

  const handleGoogleError = (error: string) => {
    setGoogleError(error);
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
  };

  // const formatPhoneNumber = (value: string) => {
  //   // Remove all non-digits
  //   const phoneNumber = value.replace(/\D/g, '');
  //   
  //   // Format as Indonesian phone number
  //   if (phoneNumber.startsWith('62')) {
  //     return phoneNumber.replace(/(\d{2})(\d{3,4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  //   } else if (phoneNumber.startsWith('08')) {
  //     return phoneNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
  //   }
  //   return phoneNumber;
  // }; // Unused function

  // const formatNIK = (value: string) => {
  //   // Remove all non-digits and limit to 16 characters
  //   const nik = value.replace(/\D/g, '').slice(0, 16);
  //   // Format as 4-4-4-4 groups
  //   return nik.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  // }; // Unused function

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="text-center mb-10">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
          
          {/* Event Info Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="flex justify-center gap-4 mt-6">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
          
          {/* Form Skeleton */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
              <div className="h-12 bg-gray-200 rounded-xl mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCapacityFull = event.maxParticipants && event.participantsCount >= event.maxParticipants;

  // Show success view if registration was successful
  if (registrationSuccess && participantData) {
    const handlePreviewCard = async () => {
      if (!participantData) return;
      
      try {
        // Use the same method as CheckRegistration
        const url = `/api/events/${id}/participants/${participantData.id}/download_card`;
        previewPDF(url);
      } catch (error) {
        console.error('Failed to preview card:', error);
        alert('Gagal membuka preview kartu peserta');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-20 pb-12 animate-fade-in-up">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-800 mb-4">
              Registrasi Berhasil!
            </h1>
            <p className="text-lg text-green-600 max-w-2xl mx-auto">
              Selamat! Data pendaftaran Anda berhasil disimpan.
            </p>
          </div>

          {/* Participant Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in-up-delay-1">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Data Pendaftaran Anda
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl text-center">
                <p className="text-sm font-medium opacity-90">Nomor Registrasi</p>
                <p className="text-2xl font-bold">{participantData.registration_number}</p>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Nama Lengkap</p>
                    <p className="text-gray-600">{participantData.name}</p>
                  </div>
                </div>
                
                {participantData.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-gray-600">{participantData.email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">NIK</p>
                    <p className="text-gray-600 font-mono">{participantData.nik}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Nomor Telepon</p>
                    <p className="text-gray-600">{participantData.phone_number}</p>
                  </div>
                </div>
                
                {participantData.institution && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Instansi</p>
                      <p className="text-gray-600">{participantData.institution}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 space-y-3">
              <button
                onClick={handlePreviewCard}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview Kartu Peserta
                </div>
              </button>
              
              <button
                onClick={handleDownloadCard}
                disabled={cardLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-2">
                  {cardLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  Download Kartu Peserta
                </div>
              </button>
            </div>
          </div>

          {/* Additional Action Buttons */}
          <div className="text-center space-y-4 animate-fade-in-up-delay-2">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setRegistrationSuccess(false);
                  setParticipantData(null);
                  setFormData({
                    name: '',
                    email: '',
                    phone_number: '',
                    nik: '',
                    institution: '',
                  });
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200"
              >
                Daftar Peserta Lain
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 bg-white text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 pb-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Daftar Event
          </h1>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{event.name || event.title}</h2>
            <p className="text-gray-600 mb-4">{event.description}</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {new Date(event.eventDate || event.date || '').toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {event.location}
              </span>
              {event.maxParticipants && (
                <span className={`flex items-center gap-1 ${isCapacityFull ? 'text-red-500' : 'text-green-500'}`}>
                  <User className="w-4 h-4" />
                  {event.participantsCount}/{event.maxParticipants} peserta
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 relative">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-blue-600 font-medium">Memproses pendaftaran...</p>
              </div>
            </div>
          )}
          {isCapacityFull ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Pendaftaran Ditutup</h3>
              <p className="text-gray-600">Event ini telah mencapai kapasitas maksimum peserta.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Form Pendaftaran</h3>
                <p className="text-gray-600">Lengkapi data diri Anda untuk mendaftar event ini</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="group">
                  <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    placeholder="Masukkan nama lengkap Anda"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      fieldErrors.name?.length 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                    }`}
                    value={formData.name}
                    onChange={handleChange}
                  />
                  {fieldErrors.name?.length > 0 && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-down">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.name[0]}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="group">
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Alamat Email <span className="text-blue-600 text-xs">(Wajib dari Google)</span>
                  </label>
                  
                  {/* Google OAuth Email Picker */}
                  <div className="mb-3">
                    <GoogleEmailPicker 
                      onEmailSelect={handleGoogleEmailSelect}
                      onError={handleGoogleError}
                    />
                  </div>
                  
                  {googleError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {googleError}
                    </p>
                  )}
                  
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Email akan terisi otomatis dari Google"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      fieldErrors.email?.length 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500'
                    } bg-gray-50 cursor-not-allowed`}
                    value={formData.email}
                    readOnly
                    disabled
                  />
                  {fieldErrors.email?.length > 0 && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-down">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.email[0].includes('sudah terdaftar') 
                        ? 'Email ini sudah terdaftar untuk event ini. Silakan gunakan email lain.'
                        : fieldErrors.email[0]
                      }
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Email akan diambil otomatis dari akun Google Anda
                  </p>
                </div>

                {/* Phone Number Field */}
                <div className="group">
                  <label htmlFor="phone_number" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    id="phone_number"
                    required
                    placeholder="08123456789"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      fieldErrors.phone_number?.length 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                    }`}
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                  {fieldErrors.phone_number?.length > 0 && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-down">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.phone_number[0]}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Format: 08xxxxxxxxx atau +62xxxxxxxxx</p>
                </div>

                {/* NIK Field */}
                <div className="group">
                  <label htmlFor="nik" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4" />
                    NIK (Nomor Induk Kependudukan)
                  </label>
                  <input
                    type="text"
                    name="nik"
                    id="nik"
                    required
                    placeholder="1234567890123456"
                    pattern="\d{16}"
                    maxLength={16}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      fieldErrors.nik?.length 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                    }`}
                    value={formData.nik}
                    onChange={handleChange}
                  />
                  {fieldErrors.nik?.length > 0 && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-down">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.nik[0]}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">16 digit angka sesuai KTP</p>
                </div>

                {/* Institution Field */}
                <div className="group">
                  <label htmlFor="institution" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4" />
                    Instansi/Perusahaan <span className="text-gray-400 text-xs">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    name="institution"
                    id="institution"
                    placeholder=""
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      fieldErrors.institution?.length 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                    }`}
                    value={formData.institution}
                    onChange={handleChange}
                  />
                  {fieldErrors.institution?.length > 0 && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-slide-down">
                      <AlertCircle className="w-4 h-4" />
                      {fieldErrors.institution[0]}
                    </p>
                  )}

                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-slide-down animate-shake">
                    <p className="text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </p>
                  </div>
                )}

                {/* reCAPTCHA */}
                <div className="pt-4">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                    onChange={handleRecaptchaChange}
                    onExpired={handleRecaptchaExpired}
                    className="mx-auto"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.email || !recaptchaToken}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Mendaftar...
                      </div>
                    ) : !formData.email ? (
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Pilih Email dari Google Terlebih Dahulu
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Daftar Sekarang
                      </div>
                    )}
                  </button>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center">
                  Dengan mendaftar, Anda setuju dengan syarat dan ketentuan yang berlaku.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
