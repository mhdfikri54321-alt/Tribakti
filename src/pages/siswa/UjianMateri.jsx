import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Swal from 'sweetalert2';
import { 
  ChevronRight, 
  Timer, 
  FileQuestion, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function UjianMateri() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tahap, setTahap] = useState('ready');
  const [listSoal, setListSoal] = useState([]);
  const [indexSoalAktif, setIndexSoalAktif] = useState(0);
  const [jawabanSiswa, setJawabanSiswa] = useState({});
  const [waktuTersisa, setWaktuTersisa] = useState(600);
  const [hasilAkhir, setHasilAkhir] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const akunId = savedUser?.id;

  useEffect(() => {
    if (!akunId) { navigate('/login'); return; }
    loadInitialDataAndSoal();
  }, [akunId, navigate]);

  useEffect(() => {
    let timer;
    if (tahap === 'ujian' && waktuTersisa > 0) {
      timer = setInterval(() => {
        setWaktuTersisa(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            kumpulkanUjian();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [tahap, waktuTersisa]);

  const loadInitialDataAndSoal = async () => {
    setLoading(true);
    try {
      // 1. Ambil data pendaftaran siswa
      const { data: dataSiswa } = await supabase
        .from('pendaftaran')
        .select('nama_lengkap, paket_pilihan, status')
        .eq('akun_id', akunId)
        .single();
      
      if (dataSiswa) {
        setStudentInfo(dataSiswa);
      } else {
        setStudentInfo({
          nama_lengkap: savedUser?.nama_lengkap || savedUser?.username || 'Siswa',
          paket_pilihan: 'Belum Terdaftar'
        });
      }

      // 2. Ambil soal materi
      const { data: soalData, error: filterError } = await supabase
        .from('bank_soal_sim')
        .select('*')
        .eq('jenis_ujian', 'materi');

      if (filterError) {
        console.warn("Kolom jenis_ujian mungkin belum ada, mengambil semua soal sebagai fallback:", filterError.message);
        const { data: allSoal } = await supabase.from('bank_soal_sim').select('*');
        if (allSoal && allSoal.length > 0) {
          setListSoal((allSoal || []).sort(() => Math.random() - 0.5).slice(0, 10));
        } else {
          throw new Error("Tidak ada soal tersedia di database.");
        }
      } else if (soalData && soalData.length > 0) {
        setListSoal((soalData || []).sort(() => Math.random() - 0.5).slice(0, 10));
      } else {
        Swal.fire('Informasi', 'Belum ada soal ujian materi yang tersedia.', 'info');
        navigate('/ujian');
      }
    } catch (err) {
      console.error("Gagal memuat data:", err.message);
      Swal.fire('Error', 'Gagal memuat soal ujian.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mulaiUjian = () => {
    setTahap('ujian');
    setWaktuTersisa(600);
  };

  const pilihJawaban = (opsi) => {
    setJawabanSiswa(prev => ({ ...prev, [listSoal[indexSoalAktif].id]: opsi }));
  };

  const kumpulkanUjian = async () => {
    setLoading(true);
    let benar = 0;
    const detailData = listSoal.map(soal => {
      const jawaban = jawabanSiswa[soal.id];
      const isBenar = jawaban === soal.kunci_jawaban;
      if (isBenar) benar++;
      return { soal_id: soal.id, jawaban_siswa: jawaban || null, is_benar: isBenar };
    });

    const skor = Math.round((benar / listSoal.length) * 100);
    const statusUjian = skor >= 70 ? 'LULUS' : 'TIDAK LULUS';
    
    try {
      const payload = { 
        akun_id: akunId, 
        skor: skor, 
        total_benar: benar, 
        total_salah: listSoal.length - benar,
        status: statusUjian,
        jenis_ujian: 'materi'
      };

      let { data: riwayat, error: errRiwayat } = await supabase
        .from('riwayat_ujian_sim')
        .insert([payload])
        .select().single();

      // Fallback jika kolom jenis_ujian belum ada di database
      if (errRiwayat && errRiwayat.message.includes('jenis_ujian')) {
        console.warn("Kolom jenis_ujian belum ada di riwayat_ujian_sim, mencoba simpan tanpa kolom tersebut...");
        const { jenis_ujian, ...fallbackPayload } = payload;
        const { data: fallbackRiwayat, error: errFallback } = await supabase
          .from('riwayat_ujian_sim')
          .insert([fallbackPayload])
          .select().single();
        
        riwayat = fallbackRiwayat;
        errRiwayat = errFallback;
      }

      if (errRiwayat) throw errRiwayat;

      const { error: errDetail } = await supabase.from('detail_ujian_soal').insert(detailData.map(d => ({ ...d, riwayat_ujian_id: riwayat.id })));
      if (errDetail) throw errDetail;

      setHasilAkhir({ skor, status: statusUjian, benar, total: listSoal.length });
      setTahap('hasil');
    } catch (err) {
      console.error("Gagal menyimpan hasil:", err.message);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: 'Terjadi kesalahan saat menyimpan hasil ujian.',
        confirmButtonColor: '#37352f',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatWaktu = (detik) => `${Math.floor(detik / 60)}:${(detik % 60).toString().padStart(2, '0')}`;

  if (loading && tahap === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfa] text-[#37352f]/20">
        <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest">Menyiapkan simulasi materi...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="ujian" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Akademik</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Ujian Materi Teori</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{studentInfo?.nama_lengkap || 'Siswa'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Siswa</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {studentInfo?.nama_lengkap?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          {!(studentInfo?.status === 'Aktif' || studentInfo?.status === 'Berhasil') ? (
            <div className="bg-white border border-amber-100 rounded-2xl p-10 text-center shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#37352f]">Akses Terkunci 🔒</h3>
              <p className="text-sm text-[#37352f]/60 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                Anda harus menyelesaikan pendaftaran dan pembayaran paket terlebih dahulu sebelum dapat mengakses ujian teori.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-[#37352f] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
              >
                Cek Status Pendaftaran
              </button>
            </div>
          ) : (
            <>
              {tahap === 'ready' && (
                <div className="max-w-3xl mx-auto">
              <div className="mb-12">
                <div className="w-20 h-20 bg-blue-50 text-[#0b6e99] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <FileQuestion className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-bold tracking-tight mb-4 text-center">
                  Simulasi Ujian Materi 📚
                </h2>
                <p className="text-lg text-[#37352f]/70 leading-relaxed text-center mx-auto max-w-xl">
                  Uji pemahaman Anda mengenai rambu lalu lintas, peraturan jalan, dan etika berkendara secara teoritis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-white border border-[#e9e9e7] rounded-2xl p-8 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-50 text-[#0b6e99] rounded-xl flex items-center justify-center mb-6">
                    <FileQuestion className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{listSoal.length} Soal Teori</h3>
                  <p className="text-xs text-[#37352f]/60 font-medium">Soal acak dari bank soal materi.</p>
                </div>
                <div className="bg-white border border-[#e9e9e7] rounded-2xl p-8 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                    <Timer className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Waktu 10 Menit</h3>
                  <p className="text-xs text-[#37352f]/60 font-medium">Latih konsentrasi dan pemahaman teori Anda.</p>
                </div>
              </div>

              <div className="bg-[#37352f] text-white rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h4 className="text-xl font-bold mb-2">Siap Memulai?</h4>
                  <p className="text-white/60 text-sm font-medium">Pastikan Anda sudah mempelajari modul materi sebelumnya.</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate('/ujian')} 
                    className="bg-white/10 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
                  >
                    Kembali
                  </button>
                  <button 
                    onClick={mulaiUjian} 
                    className="bg-white text-[#37352f] px-8 py-3 rounded-xl text-sm font-bold hover:bg-[#0b6e99] hover:text-white transition-all shadow-xl shadow-white/5 flex items-center gap-2"
                  >
                    Mulai Ujian
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tahap === 'ujian' && listSoal[indexSoalAktif] && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div className="flex items-center gap-4 bg-white border border-[#e9e9e7] px-6 py-3 rounded-xl shadow-sm w-full md:w-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Progress Materi</span>
                  <div className="flex-1 md:w-32 bg-[#efefed] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0b6e99] h-full transition-all duration-300" style={{ width: `${((indexSoalAktif + 1) / listSoal.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-bold">{indexSoalAktif + 1} / {listSoal.length}</span>
                </div>
                
                <div className={`flex items-center gap-3 bg-white border px-6 py-3 rounded-xl shadow-sm w-full md:w-auto justify-center ${waktuTersisa < 60 ? 'border-red-200 animate-pulse' : 'border-[#e9e9e7]'}`}>
                  <Clock className={`w-4 h-4 ${waktuTersisa < 60 ? 'text-red-500' : 'text-[#37352f]/40'}`} />
                  <span className={`text-xl font-bold font-mono ${waktuTersisa < 60 ? 'text-red-600' : 'text-[#37352f]'}`}>{formatWaktu(waktuTersisa)}</span>
                </div>
              </div>
              
              <div className="bg-white border border-[#e9e9e7] rounded-2xl p-6 md:p-10 mb-6 md:mb-10">
                <h3 className="text-2xl font-bold text-[#37352f] mb-10 leading-relaxed">
                  {listSoal[indexSoalAktif].pertanyaan}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {['A', 'B', 'C', 'D'].map(opsi => (
                    <button 
                      key={opsi} 
                      onClick={() => pilihJawaban(opsi)} 
                      className={`group w-full text-left p-6 rounded-xl border-2 transition-all flex items-center gap-6 ${jawabanSiswa[listSoal[indexSoalAktif].id] === opsi ? 'border-[#0b6e99] bg-[#0b6e99]/5' : 'border-[#efefed] hover:border-[#e9e9e7] hover:bg-[#fbfbfa]'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${jawabanSiswa[listSoal[indexSoalAktif].id] === opsi ? 'bg-[#0b6e99] text-white' : 'bg-[#efefed] text-[#37352f]/30 group-hover:bg-white group-hover:text-[#0b6e99]'}`}>
                        {opsi}
                      </div>
                      <span className={`text-sm font-bold flex-1 ${jawabanSiswa[listSoal[indexSoalAktif].id] === opsi ? 'text-[#0b6e99]' : 'text-[#37352f]/70'}`}>
                        {listSoal[indexSoalAktif][`pilihan_${opsi.toLowerCase()}`]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setIndexSoalAktif(p => p - 1)} 
                  disabled={indexSoalAktif === 0} 
                  className={`px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all ${indexSoalAktif === 0 ? 'text-[#37352f]/10 cursor-not-allowed' : 'text-[#37352f]/40 hover:text-[#37352f] hover:bg-[#efefed]'}`}
                >
                  Sebelumnya
                </button>
                {indexSoalAktif === listSoal.length - 1 ? (
                  <button 
                    onClick={kumpulkanUjian} 
                    className="bg-[#0b6e99] text-white px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#0b6e99]/90 transition-all shadow-lg shadow-[#0b6e99]/20"
                  >
                    Selesaikan Ujian
                  </button>
                ) : (
                  <button 
                    onClick={() => setIndexSoalAktif(p => p + 1)} 
                    className="bg-[#37352f] text-white hover:bg-[#0b6e99] px-10 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#37352f]/10"
                  >
                    Selanjutnya
                  </button>
                )}
              </div>
            </div>
          )}

          {tahap === 'hasil' && hasilAkhir && (
            <div className="max-w-2xl mx-auto text-center py-10">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-2xl ${hasilAkhir.status === 'LULUS' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                {hasilAkhir.status === 'LULUS' ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-[#37352f] mb-4">
                Hasil Ujian Materi
              </h2>
              <p className="text-lg text-[#37352f]/60 font-medium mb-12 max-w-md mx-auto">
                {hasilAkhir.status === 'LULUS' 
                  ? 'Selamat! Anda memiliki pemahaman teori yang sangat baik.' 
                  : 'Jangan menyerah. Pelajari kembali modul materi dan coba simulasi lagi.'}
              </p>

              <div className="bg-white border border-[#e9e9e7] rounded-2xl p-6 md:p-10 grid grid-cols-3 gap-4 md:gap-6 mb-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Skor Akhir</p>
                  <p className={`text-4xl font-bold ${hasilAkhir.status === 'LULUS' ? 'text-emerald-600' : 'text-red-600'}`}>{hasilAkhir.skor}</p>
                </div>
                <div className="space-y-1 border-x border-[#efefed]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Benar</p>
                  <p className="text-4xl font-bold text-[#37352f]">{hasilAkhir.benar}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Status</p>
                  <p className={`text-sm font-bold uppercase tracking-widest mt-2 ${hasilAkhir.status === 'LULUS' ? 'text-emerald-600' : 'text-red-600'}`}>{hasilAkhir.status}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => {
                    setTahap('ready');
                    setIndexSoalAktif(0);
                    setJawabanSiswa({});
                    loadInitialDataAndSoal();
                  }} 
                  className="bg-[#0b6e99] text-white px-10 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99]/90 transition-all"
                >
                  Ulangi Ujian
                </button>
                <button 
                  onClick={() => navigate('/histori')} 
                  className="bg-[#efefed] text-[#37352f] px-10 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#e9e9e7] transition-all"
                >
                  Lihat Histori
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
