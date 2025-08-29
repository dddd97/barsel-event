import { AccordionCard } from './AccordionCard';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const faqItems = [
  {
    question: 'Bagaimana cara mendaftar event?',
    answer: 'Untuk mendaftar event, Anda dapat mengklik tombol "Daftar Event" pada halaman detail event. Kemudian isi formulir pendaftaran dengan data diri Anda yang valid. Setelah berhasil mendaftar, Anda akan menerima kartu peserta virtual yang dapat digunakan sebagai bukti pendaftaran.'
  },
  {
    question: 'Apakah saya perlu membawa kartu peserta saat event berlangsung?',
    answer: 'Ya, Anda perlu membawa kartu peserta baik dalam bentuk cetak (print) atau digital (PDF) pada smartphone Anda. Kartu peserta akan digunakan untuk verifikasi kehadiran dan juga untuk mengikuti undian doorprize.'
  },
  {
    question: 'Bagaimana cara mengecek status pendaftaran saya?',
    answer: 'Anda dapat mengecek status pendaftaran dengan mengklik tombol "Cek Status Pendaftaran" pada halaman detail event. Kemudian masukkan NIK dan nomor telepon yang digunakan saat pendaftaran untuk melihat status pendaftaran Anda.'
  },
  {
    question: 'Bagaimana sistem doorprize bekerja?',
    answer: 'Sistem doorprize menggunakan metode pengundian acak yang transparan. Hanya peserta yang terdaftar dan hadir pada event yang berkesempatan memenangkan hadiah. Pengundian dilakukan secara langsung pada akhir acara dan pemenang akan diumumkan saat itu juga.'
  },
  {
    question: 'Apakah saya bisa mendaftar lebih dari satu event?',
    answer: 'Ya, Anda dapat mendaftar di beberapa event yang berbeda. Namun, untuk satu event tertentu, Anda hanya dapat mendaftar satu kali menggunakan NIK yang sama.'
  }
];

export const FrequentlyAskedQuestions = () => {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <QuestionMarkCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Pertanyaan yang Sering Diajukan</h2>
          <p className="mt-4 text-lg text-slate-600">
            Berikut adalah jawaban untuk pertanyaan yang sering diajukan seputar event dan sistem doorprize.
          </p>
        </div>
        
        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {faqItems.map((item, index) => (
            <AccordionCard 
              key={index} 
              title={item.question}
              defaultOpen={index === 0}
            >
              <div className="prose prose-slate max-w-none">
                <p>{item.answer}</p>
              </div>
            </AccordionCard>
          ))}
        </div>
        
        <div className="mx-auto mt-12 max-w-xl rounded-xl bg-primary-50 p-6 text-center shadow-sm ring-1 ring-primary-100">
          <h3 className="text-lg font-medium text-primary-800">Masih punya pertanyaan?</h3>
          <p className="mt-2 text-primary-700">
            Jika Anda memiliki pertanyaan lain, silakan hubungi kami melalui kontak yang tersedia di detail event.
          </p>
        </div>
      </div>
    </div>
  );
}; 