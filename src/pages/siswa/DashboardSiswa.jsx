import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { 
  ChevronRight, 
  Sparkles, 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  FileQuestion,
  Trophy,
  ShieldCheck,
  CreditCard,
  Clock,
  CheckCircle2
} from 'lucide-react';

function DashboardSiswa() {
  const [user, setUser] = useState(null);
  const [listPaket, setListPaket] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchLatestUserInfo(parsedUser.id);
    } else {
      navigate('/login');
    }
    fetchPackages();
  }, [navigate]);

  const fetchLatestUserInfo = async (userId) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('akun_pengguna')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const { data: pendaftaranData } = await supabase
        .from('pendaftaran')
        .select('paket_pilihan, status')
        .eq('akun_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userData) {
        const finalUser = {
          ...userData,
          paket: pendaftaranData?.paket_pilihan || userData.paket,
          status_pendaftaran: pendaftaranData?.status || 'Belum Terdaftar'
        };
        setUser(finalUser);
        localStorage.setItem('user', JSON.stringify(finalUser));
      }
    } catch (err) {
      console.error('Error fetching latest user info:', err.message);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      setListPaket(data || []);
    } catch (err) {
      console.error('Error fetching packages:', err.message);
    }
  };

  const handleSelectPackage = (paket) => {
    navigate('/pendaftaran', { state: { paket } });
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{user?.nama_lengkap || 'Siswa'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Siswa</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {user?.nama_lengkap?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3 text-[#0b6e99]" />
              Selamat Datang Kembali
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
              Halo, {user?.nama_lengkap?.split(' ')[0] || 'Siswa'} 👋
            </h2>
            <p className="text-[#37352f]/70 text-lg leading-relaxed max-w-2xl font-medium">
              {user?.paket 
                ? `Anda saat ini terdaftar aktif dalam ${user.paket}. Mari lanjutkan progres belajar Anda.` 
                : 'Pilih paket belajar terbaik untuk memulai perjalanan Anda mendapatkan SIM bersama TriBakti.'}
            </p>
          </div>

          {!user?.paket ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listPaket.map((paket) => (
                <div key={paket.id} className="bg-white border border-[#e9e9e7] p-8 rounded-2xl hover:border-[#0b6e99]/30 hover:shadow-lg hover:shadow-[#0b6e99]/5 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl flex items-center justify-center text-[#0b6e99]">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-[#efefed] px-3 py-1 rounded-lg">
                      {paket.session_count} Sesi
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{paket.name}</h3>
                  <p className="text-[#37352f]/60 text-sm leading-relaxed mb-8 font-medium">
                    {paket.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-[#efefed]">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Biaya Investasi</p>
                      <p className="text-lg font-bold">Rp {paket.price?.toLocaleString('id-ID')}</p>
                    </div>
                    <button 
                      onClick={() => handleSelectPackage(paket)}
                      className="bg-[#37352f] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
                    >
                      Pilih Paket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Status Section */}
              <div className={`p-6 md:p-8 rounded-2xl border ${user?.status_pendaftaran === 'Menunggu Konfirmasi' ? 'bg-amber-50 border-amber-100' : 'bg-white border-[#e9e9e7]'}`}>
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${user?.status_pendaftaran === 'Menunggu Konfirmasi' ? 'bg-amber-100 text-amber-600' : 'bg-[#efefed] text-[#0b6e99]'}`}>
                    {user?.status_pendaftaran === 'Menunggu Konfirmasi' ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">Status Pendaftaran</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${user?.status_pendaftaran === 'Menunggu Konfirmasi' ? 'bg-amber-200/50 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {user?.status_pendaftaran}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#37352f]/70 leading-relaxed max-w-2xl">
                      {user?.status_pendaftaran === 'Menunggu Konfirmasi' 
                        ? 'Pembayaran Anda sedang kami verifikasi. Fitur penjadwalan akan terbuka secara otomatis setelah disetujui oleh Admin.' 
                        : `Anda terdaftar pada ${user.paket}. Silakan manfaatkan seluruh fitur di sidebar untuk memulai proses belajar.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions / Progress Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                  onClick={() => navigate('/jadwal')}
                  className="bg-white border border-[#e9e9e7] p-6 rounded-2xl hover:border-[#0b6e99]/30 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <Calendar className="w-5 h-5 mb-4 text-[#37352f]/40 group-hover:text-[#0b6e99] transition-colors" />
                  <h4 className="text-sm font-bold mb-1">Jadwal Kursus</h4>
                  <p className="text-[10px] font-medium text-[#37352f]/50">Atur sesi latihan Anda</p>
                </div>
                <div 
                  onClick={() => navigate('/materi')}
                  className="bg-white border border-[#e9e9e7] p-6 rounded-2xl hover:border-[#0b6e99]/30 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <BookOpen className="w-5 h-5 mb-4 text-[#37352f]/40 group-hover:text-[#0b6e99] transition-colors" />
                  <h4 className="text-sm font-bold mb-1">Materi Belajar</h4>
                  <p className="text-[10px] font-medium text-[#37352f]/50">Pelajari teori berkendara</p>
                </div>
                <div 
                  onClick={() => navigate('/ujian-materi')}
                  className="bg-white border border-[#e9e9e7] p-6 rounded-2xl hover:border-[#0b6e99]/30 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <FileQuestion className="w-5 h-5 mb-4 text-[#37352f]/40 group-hover:text-[#0b6e99] transition-colors" />
                  <h4 className="text-sm font-bold mb-1">Ujian Materi</h4>
                  <p className="text-[10px] font-medium text-[#37352f]/50">Teori rambu & etika</p>
                </div>
                <div 
                  onClick={() => navigate('/ujian-motorik')}
                  className="bg-white border border-[#e9e9e7] p-6 rounded-2xl hover:border-[#0b6e99]/30 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <Trophy className="w-5 h-5 mb-4 text-[#37352f]/40 group-hover:text-[#0b6e99] transition-colors" />
                  <h4 className="text-sm font-bold mb-1">Ujian Motorik</h4>
                  <p className="text-[10px] font-medium text-[#37352f]/50">Praktik & penguasaan</p>
                </div>
              </div>

              {/* Learning Journey / Step by Step */}
              <div className="bg-[#fbfbfa] border border-[#e9e9e7] rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-8">Alur Belajar TriBakti 🚀</h3>
                <div className="space-y-6">
                  {[
                    { title: 'Lengkapi Administrasi', desc: 'Selesaikan pendaftaran dan unggah bukti pembayaran.', status: (user?.status_pendaftaran === 'Aktif' || user?.status_pendaftaran === 'Berhasil') ? 'done' : 'current' },
                    { title: 'Pelajari Teori', desc: 'Baca modul dan tonton video tutorial di menu Materi Belajar.', status: (user?.status_pendaftaran === 'Aktif' || user?.status_pendaftaran === 'Berhasil') ? 'pending' : 'pending' },
                    { title: 'Booking Jadwal', desc: 'Pilih waktu dan instruktur untuk sesi latihan praktik.', status: 'pending' },
                    { title: 'Selesaikan Latihan', desc: 'Selesaikan semua sesi latihan untuk mendapatkan e-sertifikat dari Admin.', status: 'pending' },
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step.status === 'done' ? 'bg-emerald-500 text-white' : step.status === 'current' ? 'bg-[#37352f] text-white' : 'bg-[#efefed] text-[#37352f]/30'}`}>
                          {step.status === 'done' ? '✓' : idx + 1}
                        </div>
                        {idx !== 3 && <div className="w-px h-full bg-[#e9e9e7] mt-2"></div>}
                      </div>
                      <div className="pb-6">
                        <h4 className={`text-sm font-bold ${step.status === 'pending' ? 'text-[#37352f]/40' : 'text-[#37352f]'}`}>{step.title}</h4>
                        <p className="text-xs font-medium text-[#37352f]/50 mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default DashboardSiswa;
