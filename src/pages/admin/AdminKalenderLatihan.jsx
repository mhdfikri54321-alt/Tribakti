import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import { 
  Calendar, 
  Clock, 
  User, 
  TrendingUp, 
  Activity,
  ShieldCheck,
  Search,
  ChevronRight
} from 'lucide-react';

export default function AdminKalenderLatihan() {
  const navigate = useNavigate();
  const [jadwalLatihan, setJadwalLatihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchJadwalHariIni();
  }, []);

  const fetchJadwalHariIni = async () => {
    setLoading(true);
    
    // Mendapatkan format tanggal hari ini untuk filter (YYYY-MM-DD)
    const hariIni = new Date().toISOString().split('T')[0];
    
    // Query dengan join ke akun_pengguna melalui instruktur_id
    const { data, error } = await supabase
      .from('jadwal_latihan')
      .select(`
        *, 
        akun_pengguna!jadwal_latihan_instruktur_id_fkey(nama_lengkap)
      `)
      .gte('tanggal_waktu', `${hariIni}T00:00:00Z`)
      .lte('tanggal_waktu', `${hariIni}T23:59:59Z`)
      .order('tanggal_waktu', { ascending: true });

    if (error) {
      console.error("DEBUG ERROR:", error);
      alert("Gagal memuat jadwal: " + error.message);
    } else {
      setJadwalLatihan(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar activeMenu="kalender-latihan" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Kalender Latihan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Admin'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Administrator</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'A').charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          {/* Hero Section */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Activity className="w-3 h-3 text-[#0b6e99]" />
              Monitoring Harian
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Kalender <span className="text-[#37352f]/40">Latihan.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Pantau real-time aktivitas latihan mengemudi yang sedang berlangsung hari ini di seluruh cabang Tri Bakti.
              </p>
              <div className="bg-white border border-[#e9e9e7] px-5 py-3 rounded-2xl flex items-center gap-4 shrink-0 justify-between sm:justify-start w-full md:w-auto shadow-sm">
                <div className="text-right border-r border-[#e9e9e7] pr-4">
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Total Sesi</p>
                  <p className="text-sm font-bold text-[#37352f] leading-none">{jadwalLatihan.length} Pertemuan</p>
                </div>
                <div className="w-10 h-10 bg-[#0b6e99]/10 text-[#0b6e99] rounded-xl flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <AdminTabSwitcher group="pengguna" activeTab="kalender" />

          <div className="mb-8">
            <div className="bg-white border border-[#e9e9e7] p-4 sm:p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#0b6e99] text-white rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#37352f] tracking-tight">Agenda Hari Ini</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-0.5">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Sinkronisasi Jadwal...</p>
            </div>
          ) : jadwalLatihan.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jadwalLatihan.map((item) => (
                <div key={item.id} className="bg-white border border-[#e9e9e7] p-5 sm:p-8 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-[#efefed] rounded-xl flex flex-col items-center justify-center border border-[#e9e9e7]">
                      <span className="text-[8px] font-bold uppercase tracking-tighter leading-none mb-1 text-[#37352f]/40">Pukul</span>
                      <span className="text-sm md:text-base font-bold leading-none text-[#37352f]">
                        {new Date(item.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')}
                      </span>
                    </div>
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                      item.status === 'Selesai' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : 'bg-[#0b6e99]/10 text-[#0b6e99] border-[#0b6e99]/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#37352f] tracking-tight mb-2 md:mb-4">Pertemuan Ke-{item.pertemuan_ke}</h3>
                  
                  <div className="space-y-3 pt-4 md:pt-6 border-t border-[#e9e9e7]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#efefed] rounded-lg flex items-center justify-center text-[#37352f]/40 border border-[#e9e9e7]">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-[#37352f]/40 leading-none mb-1">Instruktur</p>
                        <p className="text-sm font-semibold text-[#37352f]">{item.akun_pengguna?.nama_lengkap || 'Tidak ada'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 md:py-32 bg-white border border-dashed border-[#e9e9e7] rounded-2xl">
              <Calendar className="w-12 h-12 md:w-16 md:h-16 text-[#37352f]/20 mx-auto mb-6" />
              <h3 className="text-lg md:text-xl font-bold text-[#37352f] mb-2">Tidak ada jadwal hari ini</h3>
              <p className="text-sm text-[#37352f]/40 font-medium">Sistem tidak menemukan agenda latihan yang dijadwalkan untuk hari ini.</p>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
