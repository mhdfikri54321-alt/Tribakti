import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import Footer from '../siswa/Footer';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Wallet, 
  Clock, 
  ArrowRight,
  TrendingUp,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAkun: 0,
    totalInstruktur: 0,
    siswaAktif: 0,
    siswaPending: 0,
    totalPendapatan: 0,
    lakiLaki: 0,
    perempuan: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [genderChart, setGenderChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const GENDER_COLORS = ['#0b6e99', '#37352f'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Statistik Dasar
      const { count: countAkun } = await supabase.from('akun_pengguna').select('*', { count: 'exact', head: true });
      const { count: countInstruktur } = await supabase.from('instruktur').select('*', { count: 'exact', head: true });
      const { count: countSiswaAktif } = await supabase.from('pendaftaran').select('*', { count: 'exact', head: true }).eq('status', 'Berhasil');
      const { count: countSiswaPending } = await supabase.from('pendaftaran').select('*', { count: 'exact', head: true }).neq('status', 'Berhasil');

      // 2. Pendapatan, Tren & Gender
      const { data: allData } = await supabase
        .from('pendaftaran')
        .select('total_bayar, status, created_at, jenis_kelamin')
        .order('created_at', { ascending: true });

      const totalUang = allData ? allData.filter(i => i.status === 'Berhasil').reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0) : 0;

      // Proses Tren (6 Bulan Terakhir)
      const monthlyData = {};
      let countLaki = 0;
      let countPerempuan = 0;

      allData?.forEach(item => {
        // Tren
        const month = new Date(item.created_at).toLocaleString('id-ID', { month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { laki: 0, perempuan: 0 };
        }

        // Gender
        if (item.jenis_kelamin === 'Laki-laki') {
          countLaki++;
          monthlyData[month].laki++;
        }
        if (item.jenis_kelamin === 'Perempuan') {
          countPerempuan++;
          monthlyData[month].perempuan++;
        }
      });

      const chartFormatted = Object.keys(monthlyData).slice(-6).map(key => ({
        name: key,
        'Laki-laki': monthlyData[key].laki,
        'Perempuan': monthlyData[key].perempuan
      }));

      const genderFormatted = [
        { name: 'Laki-laki', value: countLaki },
        { name: 'Perempuan', value: countPerempuan }
      ];

      // 3. Ambil data pendaftaran terbaru
      const { data: recentData } = await supabase
        .from('pendaftaran')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5); 

      setStats({
        totalAkun: countAkun || 0,
        totalInstruktur: countInstruktur || 0,
        siswaAktif: countSiswaAktif || 0,
        siswaPending: countSiswaPending || 0,
        totalPendapatan: totalUang,
        lakiLaki: countLaki,
        perempuan: countPerempuan
      });
      setRecentRegistrations(recentData || []);
      setChartData(chartFormatted);
      setGenderChart(genderFormatted);

    } catch (err) {
      console.error("Dashboard Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar role="admin" activeMenu="dashboard" />
      
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
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Admin'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Administrator</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'A').charAt(0)}
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          {/* Hero Section */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <TrendingUp className="w-3 h-3 text-[#0b6e99]" />
              Statistik Real-time
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Pusat Kendali <span className="text-[#37352f]/40">Sistem.</span>
            </h2>
            <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
              Pantau seluruh aktivitas operasional, pendaftaran siswa, dan kesehatan finansial Tri Bakti dalam satu dashboard terintegrasi.
            </p>
          </div>

          {/* Statistik Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
            {[
              { label: 'Pendapatan', value: `Rp ${stats.totalPendapatan.toLocaleString('id-ID')}`, icon: <Wallet className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Siswa Aktif', value: stats.siswaAktif, icon: <UserCheck className="w-5 h-5" />, color: 'text-[#0b6e99]', bg: 'bg-[#0b6e99]/10', border: 'border-[#0b6e99]/20' },
              { label: 'Siswa Pending', value: stats.siswaPending, icon: <Clock className="w-5 h-5" />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
              { label: 'Instruktur', value: stats.totalInstruktur, icon: <Users className="w-5 h-5" />, color: 'text-[#37352f]', bg: 'bg-[#efefed]', border: 'border-[#e9e9e7]' }
            ].map((item, i) => (
              <div key={i} className="bg-white border border-[#e9e9e7] rounded-2xl p-5 md:p-6 shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-4 border ${item.border}`}>
                  {item.icon}
                </div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 md:mb-2">{item.label}</p>
                <p className={`text-xl md:text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            {/* Grafik Mini di Dashboard */}
            <div className="bg-white border border-[#e9e9e7] rounded-2xl p-5 md:p-6 lg:col-span-2 shadow-sm">
              <div className="flex justify-between items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-[#37352f] tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#0b6e99]" /> Tren Pendaftaran
                  </h3>
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Aktivitas 6 bulan terakhir</p>
                </div>
                <button 
                  onClick={() => navigate('/admin/laporan')}
                  className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/60 hover:text-[#0b6e99] flex items-center gap-1 transition-all shrink-0"
                >
                  Detail <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e9e7" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#37352f4d', fontSize: 10, fontWeight: 700}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#37352f4d', fontSize: 10, fontWeight: 700}}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: '1px solid #e9e9e7', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      cursor={{fill: '#fbfbfa'}}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '10px', fontSize: '11px', fontWeight: 600}} />
                    <Bar dataKey="Laki-laki" fill="#0b6e99" radius={[6, 6, 0, 0]} barSize={15} />
                    <Bar dataKey="Perempuan" fill="#37352f" radius={[6, 6, 0, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafik Gender di Dashboard */}
            <div className="bg-white border border-[#e9e9e7] rounded-2xl p-5 md:p-6 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[#37352f] tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0b6e99]" /> Profil Siswa
                </h3>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Distribusi Gender</p>
              </div>
              
              <div className="h-[180px] md:h-[200px] w-full my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: '1px solid #e9e9e7', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 md:p-4 rounded-xl bg-[#0b6e99]/10 border border-[#0b6e99]/20">
                  <p className="text-[8px] font-bold uppercase text-[#0b6e99] tracking-widest mb-1">Laki-laki</p>
                  <p className="text-base md:text-lg font-bold text-[#37352f]">{stats.lakiLaki}</p>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-[#efefed] border border-[#e9e9e7]">
                  <p className="text-[8px] font-bold uppercase text-[#37352f]/60 tracking-widest mb-1">Perempuan</p>
                  <p className="text-base md:text-lg font-bold text-[#37352f]">{stats.perempuan}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Pendaftaran Terbaru */}
          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 md:p-6 border-b border-[#e9e9e7] flex justify-between items-center gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[#37352f] tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#0b6e99]" /> Pendaftaran Terbaru
                </h3>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Data 5 pendaftar terakhir</p>
              </div>
              <button 
                onClick={() => navigate('/admin/siswa')}
                className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/60 hover:text-[#0b6e99] flex items-center gap-1 transition-all shrink-0"
              >
                Lihat Semua <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa]">
                    <th className="p-6 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Nama Siswa</th>
                    <th className="p-6 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Paket Pilihan</th>
                    <th className="p-6 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {recentRegistrations.length > 0 ? (
                    recentRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-[#fbfbfa] transition-colors group">
                        <td className="p-6">
                          <div className="font-semibold text-[#37352f]">{reg.nama_lengkap || 'Tanpa Nama'}</div>
                          <div className="text-[9px] md:text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest mt-1">ID: #{reg.id.toString().slice(-6)}</div>
                        </td>
                        <td className="p-6 text-xs md:text-sm font-semibold text-[#37352f]">
                          {reg.paket_pilihan || 'N/A'}
                        </td>
                        <td className="p-6 text-right">
                          <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest border ${reg.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                            {reg.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-20 text-center text-[#37352f]/40 font-medium text-xs md:text-sm">
                        Belum ada data pendaftaran.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
