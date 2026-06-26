import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OwnerSidebar from './OwnerSidebar';
import Footer from '../siswa/Footer';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  CheckCircle,
  BarChart3,
  PieChart as PieIcon,
  ChevronRight,
  Star,
  Award,
  X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0b6e99', '#37352f', '#94a3b8', '#cbd5e1', '#64748b'];

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalPendapatan: 0,
    totalSesiSelesai: 0,
    totalPendaftaranAktif: 0,
    averageRating: '0.0',
    totalRatings: 0
  });
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [packageChartData, setPackageChartData] = useState([]);
  const [latestRatings, setLatestRatings] = useState([]);
  const [topInstructors, setTopInstructors] = useState([]);
  const [showRatingsModal, setShowRatingsModal] = useState(false);
  const [allRatings, setAllRatings] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [resSiswa, resPendaftaran, resJadwal, resRatings, resRatingsCount, resJadwalInstruktur] = await Promise.all([
        supabase.from('akun_pengguna').select('id', { count: 'exact' }).eq('role', 'siswa'),
        supabase.from('pendaftaran').select('total_bayar, status, created_at, paket_pilihan'),
        supabase.from('jadwal_latihan').select('id', { count: 'exact' }).eq('status', 'Selesai'),
        supabase.from('ratings').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('ratings').select('skor'),
        supabase.from('jadwal_latihan').select(`
          instruktur_id,
          status,
          instruktur:akun_pengguna!jadwal_latihan_instruktur_id_fkey(nama_lengkap)
        `).eq('status', 'Selesai')
      ]);

      const totalPendapatan = resPendaftaran.data?.reduce((acc, curr) => {
        if (curr.status === 'Berhasil') {
          return acc + (Number(curr.total_bayar) || 0);
        }
        return acc;
      }, 0) || 0;



      // Tren Pendapatan Bulanan Riil
      const successfulPayments = (resPendaftaran.data || [])
        .filter(item => item.status === 'Berhasil')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const monthlyRevenue = {};
      successfulPayments.forEach(item => {
        const date = new Date(item.created_at);
        const monthKey = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
        const nominal = Number(item.total_bayar) || 0;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + nominal;
      });

      const revenueData = Object.keys(monthlyRevenue).map(key => ({
        name: key,
        value: monthlyRevenue[key]
      }));

      // Distribusi Paket Kursus Riil
      const packageCounts = {};
      (resPendaftaran.data || []).forEach(item => {
        const pkg = item.paket_pilihan || 'Lainnya';
        packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
      });

      const packageData = Object.keys(packageCounts).map(key => ({
        name: key,
        value: packageCounts[key]
      }));

      // Rata-rata Rating & Total Rating
      const totalRatingsCount = resRatingsCount.data?.length || 0;
      const averageRating = totalRatingsCount > 0
        ? (resRatingsCount.data.reduce((acc, curr) => acc + (Number(curr.skor) || 0), 0) / totalRatingsCount).toFixed(1)
        : '0.0';

      // Instruktur Teraktif (Top 3)
      const instructorCounts = {};
      (resJadwalInstruktur.data || []).forEach(item => {
        const name = item.instruktur?.nama_lengkap || 'Instruktur';
        if (item.instruktur_id) {
          if (!instructorCounts[item.instruktur_id]) {
            instructorCounts[item.instruktur_id] = { name, count: 0 };
          }
          instructorCounts[item.instruktur_id].count += 1;
        }
      });
      const sortedInstructors = Object.values(instructorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        totalSiswa: resSiswa.count || 0,
        totalPendapatan: totalPendapatan,
        totalSesiSelesai: resJadwal.count || 0,
        totalPendaftaranAktif: resPendaftaran.data?.length || 0,
        averageRating: averageRating,
        totalRatings: totalRatingsCount
      });
      setRevenueChartData(revenueData);
      setPackageChartData(packageData);
      setLatestRatings(resRatings.data || []);
      setTopInstructors(sortedInstructors);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBukaSemuaUlasan = async () => {
    setShowRatingsModal(true);
    setModalLoading(true);
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAllRatings(data || []);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat ulasan: " + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <OwnerSidebar activeMenu="owner" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Owner Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Owner'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Owner</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'O').charAt(0)}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <BarChart3 className="w-3 h-3 text-[#0b6e99]" />
              Executive Summary
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Selamat datang, Owner <span className="text-[#37352f]/40">TriBakti.</span>
            </h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            {[
              { label: 'Total Pendapatan', value: `Rp ${stats.totalPendapatan.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Siswa', value: stats.totalSiswa, icon: Users, color: 'text-[#0b6e99]', bg: 'bg-[#0b6e99]/10' },
              { label: 'Sesi Latihan Selesai', value: stats.totalSesiSelesai, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Pendaftaran Aktif', value: stats.totalPendaftaranAktif, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-5 sm:p-8 rounded-2xl border border-[#e9e9e7] hover:border-[#0b6e99]/20 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1 md:mb-2">{item.label}</h3>
                <p className="text-2xl sm:text-3xl font-bold text-[#37352f]">{loading ? '...' : item.value}</p>
              </div>
            ))}
          </div>



          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-[#e9e9e7] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl font-bold text-[#37352f] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0b6e99]" />
                  Tren Pendapatan Bulanan
                </h3>
              </div>
              <div className="h-[260px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0b6e99" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0b6e99" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efefed" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#37352f', opacity: 0.5}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#37352f', opacity: 0.5}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e9e9e7', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#0b6e99" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-[#e9e9e7] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg md:text-xl font-bold text-[#37352f] flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-[#0b6e99]" />
                  Distribusi Paket Kursus
                </h3>
              </div>
              <div className="h-[260px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={packageChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {packageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e9e9e7', backgroundColor: '#fff' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Operational Intelligence Section: Ulasan Siswa & Instruktur Terpopuler */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-8">
            {/* Kepuasan & Ulasan Siswa */}
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-[#e9e9e7] shadow-sm lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 w-full">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[#37352f] flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Kepuasan & Ulasan Siswa
                  </h3>
                  <p className="text-xs text-[#37352f]/50 mt-1">Umpan balik terbaru yang dikirimkan oleh siswa melalui landing page.</p>
                  <button 
                    onClick={handleBukaSemuaUlasan}
                    className="text-[10px] font-bold text-[#0b6e99] hover:underline cursor-pointer bg-[#efefed] px-2.5 py-1.5 rounded-lg border border-[#e9e9e7] mt-3 block w-fit shrink-0"
                  >
                    Lihat Semua Ulasan
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl shrink-0">
                  <div className="text-amber-600 font-extrabold text-2xl leading-none">{loading ? '...' : stats.averageRating}</div>
                  <div>
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3.5 h-3.5 ${Math.round(Number(stats.averageRating)) >= star ? 'fill-current' : 'opacity-30'}`} 
                        />
                      ))}
                    </div>
                    <div className="text-[9px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">{loading ? '...' : `${stats.totalRatings} Ulasan`}</div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-xs opacity-50">Memuat ulasan siswa...</div>
              ) : latestRatings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {latestRatings.map((r, i) => (
                    <div key={i} className="bg-[#fbfbfa] p-5 rounded-xl border border-[#e9e9e7]/60 flex flex-col justify-between hover:border-[#0b6e99]/20 transition-all">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="font-bold text-xs text-[#37352f] truncate max-w-[70%]" title={r.nama_siswa}>{r.nama_siswa}</div>
                          <div className="flex text-amber-400 shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-2.5 h-2.5 ${r.skor >= star ? 'fill-current' : 'opacity-30'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-[#37352f]/70 italic leading-relaxed line-clamp-3">"{r.ulasan}"</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#efefed] text-[9px] font-bold text-[#37352f]/40 uppercase tracking-wider">
                        {r.paket_siswa || 'Paket Kursus'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-xs opacity-50 italic">Belum ada ulasan yang masuk.</div>
              )}
            </div>

            {/* Instruktur Terpopuler / Beban Kerja */}
            <div className="bg-white p-5 sm:p-8 rounded-2xl border border-[#e9e9e7] shadow-sm lg:col-span-1 flex flex-col">
              <div className="mb-6 flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[#37352f] flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#0b6e99]" />
                    Instruktur Teraktif
                  </h3>
                  <p className="text-xs text-[#37352f]/50 mt-1">Instruktur dengan akumulasi jam mengajar selesai tertinggi.</p>
                </div>
                <button 
                  onClick={() => navigate('/owner/siswa')}
                  className="text-[10px] font-bold text-[#0b6e99] hover:underline cursor-pointer bg-[#efefed] px-2.5 py-1.5 rounded-lg border border-[#e9e9e7] shrink-0"
                >
                  Detail
                </button>
              </div>

              {loading ? (
                <div className="py-10 text-center text-xs opacity-50 flex-grow flex items-center justify-center">Memuat performa instruktur...</div>
              ) : topInstructors.length > 0 ? (
                <div className="space-y-4 flex-grow flex flex-col justify-center">
                  {topInstructors.map((ins, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#fbfbfa] p-3 rounded-xl border border-[#e9e9e7]/60 hover:border-[#0b6e99]/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0b6e99]/5 border border-[#0b6e99]/20 flex items-center justify-center font-bold text-[#0b6e99] text-xs">
                          #{i+1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#37352f] truncate max-w-[120px]" title={ins.name}>{ins.name}</p>
                          <p className="text-[9px] text-[#37352f]/40 font-bold uppercase tracking-wider">instruktur</p>
                        </div>
                      </div>
                      <div className="bg-[#efefed] px-3 py-1 rounded-lg text-right shrink-0 border border-[#e9e9e7]/50">
                        <span className="text-xs font-bold text-[#37352f]">{ins.count}</span>
                        <span className="text-[9px] text-[#37352f]/40 font-bold ml-1">Sesi</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-xs opacity-50 italic flex-grow flex items-center justify-center">Belum ada riwayat sesi mengajar selesai.</div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* MODAL SEMUA ULASAN */}
      {showRatingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div className="absolute inset-0 bg-[#37352f]/40 backdrop-blur-sm" onClick={() => setShowRatingsModal(false)}></div>
          <div className="bg-white w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="p-6 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa] sticky top-0 z-10">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1 block">Feedback Pelanggan</span>
                <h3 className="text-xl font-bold text-[#37352f] tracking-tight">Semua Ulasan Siswa</h3>
              </div>
              <button 
                onClick={() => setShowRatingsModal(false)} 
                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#37352f]/40 hover:text-rose-500 transition-all border border-[#e9e9e7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {modalLoading ? (
                <div className="py-20 text-center text-xs opacity-50">
                  <div className="w-6 h-6 border-2 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-2"></div>
                  Memuat ulasan...
                </div>
              ) : allRatings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allRatings.map((r, i) => (
                    <div key={i} className="bg-[#fbfbfa] border border-[#e9e9e7]/60 p-5 rounded-xl flex flex-col justify-between hover:border-[#0b6e99]/20 transition-all shadow-sm">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <span className="font-bold text-xs text-[#37352f]">{r.nama_siswa}</span>
                            <span className="text-[9px] text-[#37352f]/40 font-bold block mt-0.5">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </span>
                          </div>
                          <div className="flex text-amber-400 shrink-0">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-2.5 h-2.5 ${r.skor >= star ? 'fill-current' : 'opacity-30'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-[#37352f]/70 italic leading-relaxed">"{r.ulasan}"</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#efefed] text-[9px] font-bold text-[#37352f]/40 uppercase tracking-wider">
                        {r.paket_siswa || 'Paket Kursus'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-xs opacity-50 italic">Belum ada ulasan yang masuk.</div>
              )}
            </div>
            
            <div className="p-6 bg-[#fbfbfa] border-t border-[#e9e9e7] sticky bottom-0 z-10 flex justify-end">
              <button 
                onClick={() => setShowRatingsModal(false)}
                className="bg-[#37352f] hover:bg-[#0b6e99] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
