import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { ChevronRight, HelpCircle, ChevronDown, ChevronUp, BookOpen, Clock, ShieldCheck } from 'lucide-react';

export default function Bantuan() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Bagaimana cara melengkapi administrasi pendaftaran?",
      answer: "Setelah melakukan pendaftaran dengan memilih paket belajar, Anda harus mentransfer biaya pendaftaran ke nomor rekening yang tertera di form pendaftaran, lalu mengunggah bukti transfer. Admin kami akan melakukan verifikasi pembayaran dalam waktu maksimal 1x24 jam. Status Anda akan berubah menjadi Aktif setelah disetujui."
    },
    {
      question: "Bagaimana cara melakukan booking jadwal latihan?",
      answer: "Setelah status pendaftaran Anda diverifikasi dan menjadi 'Aktif', silakan masuk ke menu 'Jadwal Kursus'. Anda dapat memilih instruktur yang tersedia, tanggal latihan, dan jam sesi yang Anda inginkan. Slot yang telah Anda pilih akan otomatis diblokir untuk sesi Anda."
    },
    {
      question: "Apakah saya bisa mengubah jadwal latihan (Reschedule)?",
      answer: "Bisa. Anda diberikan grace period (batas waktu ubah jadwal) selama 10 menit setelah booking dibuat untuk melakukan perubahan instan. Jika batas waktu 10 menit tersebut sudah terlewati, Anda dapat mengajukan permohonan reschedule dengan menuliskan alasan logis yang akan langsung diteruskan kepada Instruktur terkait untuk disetujui atau ditolak."
    },
    {
      question: "Bagaimana syarat untuk lulus dan mendapatkan sertifikat?",
      answer: "Anda harus menyelesaikan seluruh sesi latihan praktik (jumlah sesi tergantung paket pilihan Anda) dan menyelesaikan ujian teori (Ujian Materi) serta ujian praktik simulasi (Ujian Motorik) dengan skor minimal kelulusan 70. Setelah itu, E-Sertifikat kelulusan Anda akan diterbitkan oleh Admin di menu E-Sertifikat."
    },
    {
      question: "Di mana saya bisa melihat kuitansi pembayaran saya?",
      answer: "Siswa yang statusnya sudah 'Aktif' atau 'Berhasil' dapat mengunduh kuitansi resmi pendaftaran secara digital langsung dari Dashboard Siswa dengan mengeklik tombol 'Unduh Kuitansi'."
    }
  ];

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="bantuan" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Bantuan & FAQ</span>
          </div>
          <button 
            onClick={() => navigate('/profil')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer border-0 bg-transparent text-[#37352f] text-left p-0"
          >
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Siswa'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Siswa</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {savedUser?.nama_lengkap?.charAt(0) || 'S'}
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4">
                <HelpCircle className="w-3 h-3 text-[#0b6e99]" />
                Pusat Bantuan TriBakti
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
                Ada yang bisa kami bantu? 🤝
              </h2>
              <p className="text-[#37352f]/70 text-lg leading-relaxed max-w-2xl font-medium">
                Temukan jawaban cepat atas pertanyaan yang sering diajukan mengenai pendaftaran, penjadwalan, dan ujian kursus mengemudi.
              </p>
            </div>

            {/* Quick Cards Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white border border-[#e9e9e7] p-6 rounded-2xl">
                <BookOpen className="w-6 h-6 text-[#0b6e99] mb-4" />
                <h3 className="font-bold text-sm mb-1">Modul & Teori</h3>
                <p className="text-xs text-[#37352f]/60 leading-relaxed font-medium">Pelajari regulasi jalanan di menu Materi Belajar sebelum memulai ujian teori.</p>
              </div>
              <div className="bg-white border border-[#e9e9e7] p-6 rounded-2xl">
                <Clock className="w-6 h-6 text-[#0b6e99] mb-4" />
                <h3 className="font-bold text-sm mb-1">Batas Waktu Reschedule</h3>
                <p className="text-xs text-[#37352f]/60 leading-relaxed font-medium">Ubah jadwal bebas dalam 10 menit pertama. Setelah lewat, persetujuan instruktur diperlukan.</p>
              </div>
              <div className="bg-white border border-[#e9e9e7] p-6 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-[#0b6e99] mb-4" />
                <h3 className="font-bold text-sm mb-1">Kelulusan Resmi</h3>
                <p className="text-xs text-[#37352f]/60 leading-relaxed font-medium">Dapatkan sertifikat kompetensi resmi setelah menyelesaikan sesi praktik dan ujian simulator.</p>
              </div>
            </div>

            {/* Accordion FAQ */}
            <div className="bg-white border border-[#e9e9e7] rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-bold mb-8 text-[#37352f] border-b border-[#efefed] pb-4">Pertanyaan Populer (FAQ)</h3>
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="border-b border-[#efefed] pb-4 last:border-0 last:pb-0">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center text-left py-2 hover:text-[#0b6e99] transition-colors group cursor-pointer"
                    >
                      <span className="text-sm font-bold text-[#37352f] group-hover:text-[#0b6e99]">{faq.question}</span>
                      {openFaq === idx ? (
                        <ChevronUp className="w-4 h-4 text-[#37352f]/40" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#37352f]/40" />
                      )}
                    </button>
                    {openFaq === idx && (
                      <div className="mt-3 text-xs text-[#37352f]/70 leading-relaxed font-medium bg-[#fbfbfa] p-4 rounded-xl border border-[#e9e9e7]/50 animate-fadeIn">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
