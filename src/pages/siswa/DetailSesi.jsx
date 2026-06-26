import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2,
  Info,
  Star
} from 'lucide-react';

export default function DetailSesi() {
  const { nomorSesi } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dataSesi, setDataSesi] = useState(null);
  const [errorSesi, setErrorSesi] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const masterMateriTriBakti = {
    1: { materi: "Pengenalan instrumen mobil & gas kopling", deskripsi: "Pengenalan fungsi pedal (gas, rem, kopling), tuas transmisi, penggunaan lampu, wiper, dan teknik feeling kopling dasar." },
    2: { materi: "Cara menjalankan & menghentikan mobil", deskripsi: "Latihan koordinasi kaki antara kopling dan gas untuk stabilitas awal." },
    3: { materi: "Belajar oper gigi (transmisi)", deskripsi: "Teknik perpindahan gigi manual dari 1 ke 2, ke 3, dst secara halus." },
    4: { materi: "Latihan belok & menjaga jarak aman", deskripsi: "Latihan memutar setir, memprediksi radius putar, dan feeling bodi." },
    5: { materi: "Latihan di jalan raya (lalu lintas ringan)", deskripsi: "Simulasi berkendara di area pemukiman dan jalan raya sekunder." },
    6: { materi: "Latihan tanjakan & turunan", deskripsi: "Teknik stop & go di tanjakan menggunakan rem tangan atau setengah kopling." },
    7: { materi: "Teknik parkir seri (mundur)", deskripsi: "Latihan memasukkan mobil ke slot parkir posisi tegak lurus." },
    8: { materi: "Teknik parkir paralel", deskripsi: "Teknik memarkir di pinggir jalan raya (sejajar dengan trotoar)." },
    9: { materi: "Latihan di jalan raya (lalu lintas padat)", deskripsi: "Mengemudi di jalan protokol, menghadapi kemacetan, dan menyalip." },
    10: { materi: "Pemantapan materi & evaluasi", deskripsi: "Mengulang kembali materi yang dianggap kurang oleh instruktur." },
    11: { materi: "Ujian praktek akhir", deskripsi: "Pengujian menyeluruh mulai dari persiapan hingga kelayakan mengemudi mandiri." }
  };

  useEffect(() => {
    fetchDetailSesi();
  }, [nomorSesi]);

  const fetchDetailSesi = async () => {
    setLoading(true);
    const sesiAngka = parseInt(nomorSesi, 10);
    
    if (!nomorSesi || isNaN(sesiAngka)) {
      setErrorSesi("Nomor sesi tidak valid.");
      setLoading(false);
      return;
    }

    try {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      const akunId = savedUser?.id;

      if (!akunId) {
        navigate('/login');
        return;
      }

      // Ambil Info Siswa
      const { data: dataSiswa } = await supabase
        .from('pendaftaran')
        .select('nama_lengkap')
        .eq('akun_id', akunId)
        .single();
      if (dataSiswa) setStudentInfo(dataSiswa);

      // Ambil data detail sesi
      const { data, error } = await supabase
        .from('jadwal_latihan')
        .select(`
          *,
          instruktur:akun_pengguna!instruktur_id(nama_lengkap)
        `)
        .eq('akun_id', akunId)
        .eq('pertemuan_ke', sesiAngka)
        .maybeSingle();

      if (error) {
        const { data: retryData } = await supabase
          .from('jadwal_latihan')
          .select(`
            *,
            instruktur:akun_pengguna!jadwal_latihan_instruktur_id_fkey(nama_lengkap)
          `)
          .eq('akun_id', akunId)
          .eq('pertemuan_ke', sesiAngka)
          .maybeSingle();
        
        setDataSesi(retryData ? { ...retryData, nama_instruktur: retryData.instruktur?.nama_lengkap } : null);
      } else {
        setDataSesi(data ? { ...data, nama_instruktur: data.instruktur?.nama_lengkap } : null);
      }
    } catch (err) {
      console.error("Gagal mengambil detail sesi:", err.message);
      setErrorSesi(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfa] text-[#37352f]/20">
        <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-bold uppercase tracking-widest">Memuat detail sesi...</p>
      </div>
    );
  }

  const infoMateriStatis = masterMateriTriBakti[Number(nomorSesi)] || { materi: `Sesi Kursus ${nomorSesi}`, deskripsi: "Deskripsi materi belum dikonfigurasi." };
  const statusSesi = dataSesi?.status || "Belum Dijadwalkan";

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="jadwal" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Jadwal</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Detail Sesi {nomorSesi}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{studentInfo?.nama_lengkap || 'Siswa'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Siswa</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {studentInfo?.nama_lengkap?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <button 
            onClick={() => navigate('/jadwal')} 
            className="flex items-center gap-2 text-[#37352f]/40 hover:text-[#37352f] transition-colors text-xs font-bold uppercase tracking-widest mb-6 md:mb-10"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Jadwal
          </button>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 md:p-10 border-b border-[#e9e9e7] bg-[#fbfbfa] flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white border border-[#e9e9e7] rounded-2xl flex items-center justify-center text-[#0b6e99] flex-shrink-0">
                   <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                   <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-0.5 md:mb-1">Pertemuan {nomorSesi}</p>
                   <h2 className="text-lg sm:text-2xl font-bold tracking-tight">{infoMateriStatis.materi}</h2>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest border self-start sm:self-auto ${statusSesi === 'Selesai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {statusSesi}
              </span>
            </div>

            <div className="p-6 md:p-10 space-y-8 md:space-y-12">
              <section>
                <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 md:mb-4">Deskripsi Latihan</h3>
                <p className="text-sm md:text-base text-[#37352f]/70 leading-relaxed font-medium">{infoMateriStatis.deskripsi}</p>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                <div className="space-y-1.5 md:space-y-3">
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">
                    <Calendar className="w-3 h-3" /> Tanggal
                  </div>
                  <p className="text-sm font-bold">
                    {dataSesi?.tanggal || dataSesi?.tanggal_waktu ? new Date(dataSesi.tanggal || dataSesi.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum diatur'}
                  </p>
                </div>
                <div className="space-y-1.5 md:space-y-3">
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">
                    <Clock className="w-3 h-3" /> Waktu
                  </div>
                  <p className="text-sm font-bold">{dataSesi?.jam ? `${dataSesi.jam} WIB` : dataSesi?.tanggal_waktu ? `${new Date(dataSesi.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')} WIB` : 'Belum diatur'}</p>
                </div>
                <div className="space-y-1.5 md:space-y-3">
                  <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">
                    <User className="w-3 h-3" /> Instruktur
                  </div>
                  <p className="text-sm font-bold">{dataSesi?.nama_instruktur || 'Belum diatur'}</p>
                </div>
              </section>

              <section className="pt-8 md:pt-10 border-t border-[#efefed]">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 bg-blue-50 text-[#0b6e99] rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">Evaluasi & Feedback</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                   <div className="md:col-span-1 bg-[#fbfbfa] p-4 md:p-6 rounded-xl border border-[#e9e9e7] text-center">
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 md:mb-2">Nilai Performa</p>
                      <div className="text-3xl md:text-4xl font-black text-[#0b6e99]">
                        {dataSesi?.nilai || '-'}
                      </div>
                      <p className="text-[9px] md:text-[10px] font-bold text-[#37352f]/30 mt-1">Skor / 100</p>
                   </div>
                   <div className="md:col-span-3 bg-[#fbfbfa] p-4 md:p-6 rounded-xl border border-[#e9e9e7]">
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 md:mb-4">Catatan Instruktur</p>
                      <div className="text-xs md:text-sm font-medium text-[#37352f]/70 italic leading-relaxed">
                        {dataSesi?.catatan_instruktur ? `"${dataSesi.catatan_instruktur}"` : '"Belum ada catatan evaluasi dari instruktur untuk sesi ini."'}
                      </div>
                   </div>
                </div>
              </section>
            </div>

            <div className="p-6 md:p-10 bg-[#fbfbfa] border-t border-[#e9e9e7] text-center">
               <button 
                 onClick={() => navigate('/jadwal')}
                 className="w-full sm:w-auto bg-[#37352f] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all shadow-lg shadow-[#37352f]/10"
               >
                 Kembali ke Agenda
               </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
