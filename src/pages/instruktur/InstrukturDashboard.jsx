import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from '../siswa/Footer';
import {
  CheckCircle,
  Calendar,
  Clock,
  ChevronRight,
  BookOpen,
  UserCheck,
  PlusCircle,
  FileText,
  Sparkles
} from 'lucide-react';

export default function InstrukturDashboard() {
  const [jumlahAktif, setJumlahAktif] = useState(0);
  const [jumlahSelesai, setJumlahSelesai] = useState(0);
  const [jumlahTotalSesi, setJumlahTotalSesi] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // State baru untuk fitur pengganti
  const [todaySessions, setTodaySessions] = useState([]);

  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const instrukturId = savedUser?.id;
  const namaInstruktur = savedUser?.nama_lengkap || savedUser?.username || 'Instruktur';

  useEffect(() => {
    if (!instrukturId) {
      navigate('/');
      return;
    }
    initDashboardData();
  }, [instrukturId]);

  const initDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardOverviewData(),
      fetchTodaySessions()
    ]);
    setLoading(false);
  };

  const fetchDashboardOverviewData = async () => {
    try {
      const { count: countAktif } = await supabase
        .from('jadwal_latihan')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Dijadwalkan')
        .eq('instruktur_id', instrukturId);
      setJumlahAktif(countAktif || 0);

      const { count: countSelesai } = await supabase
        .from('jadwal_latihan')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Selesai')
        .eq('instruktur_id', instrukturId);
      setJumlahSelesai(countSelesai || 0);

      const { count: countTotal } = await supabase
        .from('slot_instruktur')
        .select('*', { count: 'exact', head: true })
        .eq('akun_id', instrukturId);
      setJumlahTotalSesi(countTotal || 0);
    } catch (err) {
      console.error("Gagal memuat data ringkasan:", err.message);
    }
  };

  const fetchTodaySessions = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('jadwal_latihan')
        .select(`
          id, 
          tanggal_waktu, 
          status,
          akun_pengguna!akun_id(nama_lengkap),
          kurikulum(materi)
        `)
        .eq('instruktur_id', instrukturId)
        .gte('tanggal_waktu', startOfDay)
        .lte('tanggal_waktu', endOfDay)
        .order('tanggal_waktu', { ascending: true });

      if (error) throw error;
      setTodaySessions(data || []);
    } catch (err) {
      console.error("Error loading today sessions:", err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfa] text-[#37352f]/40">
        <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="instruktur" activeMenu="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Dashboard</span>
          </div>
          <button 
            onClick={() => navigate('/profil')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer border-0 bg-transparent text-[#37352f] text-left p-0"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{namaInstruktur}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Instruktur</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {namaInstruktur.charAt(0)}
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Sparkles className="w-3 h-3 text-[#0b6e99]" />
              Pusat Kendali Pengajaran
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Selamat datang kembali, {namaInstruktur.split(' ')[0]} 👋
            </h2>
            <p className="text-[#37352f]/70 text-sm md:text-lg leading-relaxed max-w-2xl font-medium">
              Kelola sesi mengajar Anda hari ini dan pantau progres latihan siswa dengan lebih efisien.
            </p>
          </div>

          {/* Statistik Utama */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {[
              { label: 'Sesi Aktif', value: jumlahAktif, icon: <Clock className="w-6 h-6" />, color: 'text-[#37352f]', bg: 'bg-[#efefed]', iconColor: 'text-[#0b6e99]' },
              { label: 'Sesi Selesai', value: jumlahSelesai, icon: <CheckCircle className="w-6 h-6" />, color: 'text-[#37352f]', bg: 'bg-[#efefed]', iconColor: 'text-emerald-600' },
              { label: 'Total Slot', value: jumlahTotalSesi, icon: <Calendar className="w-6 h-6" />, color: 'text-[#37352f]', bg: 'bg-[#efefed]', iconColor: 'text-[#37352f]' }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-[#e9e9e7] p-6 md:p-8 rounded-2xl hover:border-[#0b6e99]/30 hover:shadow-lg hover:shadow-[#0b6e99]/5 transition-all group shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.iconColor} flex items-center justify-center mb-4 md:mb-6`}>
                  {item.icon}
                </div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1 md:mb-2">{item.label}</p>
                <p className={`text-2xl md:text-3xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sesi Hari Ini */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 md:p-6 border-b border-[#e9e9e7] flex justify-between items-center">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-[#37352f] tracking-tight flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-[#0b6e99]" /> Sesi Hari Ini
                    </h3>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => navigate('/sesi-aktif')} className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] flex items-center gap-1 hover:gap-1.5 transition-all">
                    Selengkapnya <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  {todaySessions.length > 0 ? (
                    <div className="space-y-4">
                      {todaySessions.map((sesi) => (
                        <div key={sesi.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 bg-[#fbfbfa] rounded-xl border border-[#e9e9e7] hover:border-[#0b6e99]/30 transition-all group gap-4">
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl flex flex-col items-center justify-center border border-[#e9e9e7] flex-shrink-0">
                              <span className="text-[8px] md:text-[10px] font-bold text-[#0b6e99] uppercase tracking-tighter leading-none mb-0.5 md:mb-1">Pukul</span>
                              <span className="text-xs md:text-sm font-bold text-[#37352f] leading-none">
                                {sesi.tanggal_waktu ? new Date(sesi.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm md:text-base font-bold text-[#37352f] group-hover:text-[#0b6e99] transition-colors">{sesi.akun_pengguna?.nama_lengkap}</h4>
                              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/50 mt-1">{sesi.kurikulum?.materi || 'Materi Latihan'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 w-full sm:w-auto justify-end sm:justify-start border-t border-[#efefed] sm:border-none pt-2 sm:pt-0">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${sesi.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#efefed] text-[#0b6e99]'}`}>
                              {sesi.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-[#efefed] rounded-xl flex items-center justify-center mx-auto mb-4 md:mb-6 text-[#37352f]/30">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-[#37352f] mb-1.5 md:mb-2">Tidak ada sesi hari ini</h3>
                      <p className="text-[#37352f]/50 font-medium text-xs md:text-sm">Anda bisa beristirahat atau menyiapkan materi untuk besok.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Akses Cepat */}
            <div className="space-y-6">
              <div className="bg-white border border-[#e9e9e7] rounded-2xl p-4 md:p-6 shadow-sm">
                <h3 className="text-base md:text-lg font-bold text-[#37352f] tracking-tight mb-4 md:mb-6">Akses Cepat</h3>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {[
                    { label: 'Input Nilai Siswa', path: '/sesi-aktif', icon: <UserCheck className="w-5 h-5" />, color: 'bg-[#0b6e99]' },
                    { label: 'Manajemen Materi', path: '/instruktur/materi', icon: <BookOpen className="w-5 h-5" />, color: 'bg-[#37352f]' },
                    { label: 'Data Master Siswa', path: '/instruktur/siswa', icon: <FileText className="w-5 h-5" />, color: 'bg-[#37352f]' },
                    { label: 'Buka Slot Waktu', path: '/manage-jam', icon: <PlusCircle className="w-5 h-5" />, color: 'bg-[#37352f]' }
                  ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={() => navigate(item.path)}
                      className="flex items-center justify-between p-4 md:p-5 bg-[#fbfbfa] hover:bg-white rounded-xl border border-[#e9e9e7] hover:border-[#0b6e99]/30 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-9 h-9 md:w-10 md:h-10 ${item.color} text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                          {item.icon}
                        </div>
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#37352f]/70 group-hover:text-[#37352f] text-left">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#37352f]/30 group-hover:text-[#0b6e99] transition-all flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
