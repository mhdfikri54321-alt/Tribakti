import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import { 
  Users, 
  CheckCircle, 
  Eye, 
  BarChart3, 
  ShieldCheck, 
  X,
  Phone,
  Package,
  Calendar,
  MapPin,
  TrendingUp,
  CreditCard,
  ChevronRight,
  Download,
  Search,
  Filter,
  FileText
} from 'lucide-react';

export default function ManajementSiswa() {
  const navigate = useNavigate();
  const [pendaftar, setPendaftar] = useState([]);
  const [loading, setLoading] = useState(true);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');



  // State untuk Search dan Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterPaket, setFilterPaket] = useState('Semua');

  // Ambil opsi paket & status secara unik untuk opsi filter dropdown
  const uniquePaket = ['Semua', ...new Set(pendaftar.map(p => p.paket_pilihan).filter(Boolean))];
  const uniqueStatus = ['Semua', ...new Set(pendaftar.map(p => p.status).filter(Boolean))];

  // Logic Penyaringan/Filtering data siswa
  const filteredPendaftar = pendaftar.filter((item) => {
    const matchesSearch = 
      (item.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nik || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.no_whatsapp || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === 'Semua' || item.status === filterStatus;
    const matchesPaket = filterPaket === 'Semua' || item.paket_pilihan === filterPaket;
    
    return matchesSearch && matchesStatus && matchesPaket;
  });

  useEffect(() => {
    fetchPendaftar();
  }, []);

  const fetchPendaftar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendaftaran')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendaftar(data || []);
    } catch (err) {
      console.error("Gagal memuat data pendaftaran:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI BUKA DETAIL BERKAS ---
  const handleBukaDetail = (item) => {
    navigate(`/admin/siswa/detail?id=${item.id}`);
  };

  const handleBukaNilai = (siswa) => {
    navigate(`/admin/siswa/sesi?akun_id=${siswa.akun_id}&nama=${encodeURIComponent(siswa.nama_lengkap)}`);
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar activeMenu="siswa" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Manajemen Siswa</span>
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
              <TrendingUp className="w-3 h-3 text-[#0b6e99]" />
              Operasional Siswa
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Manajemen <span className="text-[#37352f]/40">Siswa.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Verifikasi pendaftaran baru, generate jadwal latihan otomatis, dan pantau rapor kompetensi seluruh siswa Tri Bakti.
              </p>
              <div className="bg-white px-5 py-3 rounded-2xl border border-[#e9e9e7] flex items-center gap-4 shrink-0 shadow-sm">
                <div className="text-right border-r border-[#e9e9e7] pr-4">
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Total Terdaftar</p>
                  <p className="text-sm font-bold text-[#37352f] leading-none">
                    {filteredPendaftar.length !== pendaftar.length 
                      ? `${filteredPendaftar.length} dari ${pendaftar.length}` 
                      : pendaftar.length} Siswa
                  </p>
                </div>
                <div className="w-10 h-10 bg-[#0b6e99]/10 text-[#0b6e99] rounded-xl flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <AdminTabSwitcher group="pengguna" activeTab="siswa" />

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/35" />
              <input
                type="text"
                placeholder="Cari nama, NIK, atau no. WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] text-sm text-[#37352f] transition-all placeholder-[#37352f]/30"
              />
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-3">
              {/* Filter Paket */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#e9e9e7]">
                <Package className="w-3.5 h-3.5 text-[#37352f]/45" />
                <select
                  value={filterPaket}
                  onChange={(e) => setFilterPaket(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#37352f]/70 uppercase tracking-wider outline-none border-none py-1.5 cursor-pointer"
                >
                  <option value="Semua">Semua Paket</option>
                  {uniquePaket.filter(p => p !== 'Semua').map((paket) => (
                    <option key={paket} value={paket}>{paket}</option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#e9e9e7]">
                <Filter className="w-3.5 h-3.5 text-[#37352f]/45" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-xs font-bold text-[#37352f]/70 uppercase tracking-wider outline-none border-none py-1.5 cursor-pointer"
                >
                  <option value="Semua">Semua Status</option>
                  {uniqueStatus.filter(s => s !== 'Semua').map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Identitas Siswa</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Paket & Kontak</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Status Akun</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Menyingkronkan Data...</p>
                      </td>
                    </tr>
                  ) : filteredPendaftar.length > 0 ? (
                    filteredPendaftar.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fbfbfa] transition-colors">
                        <td className="p-6">
                          <div className="font-bold text-[#37352f] text-lg tracking-tight hover:text-[#0b6e99] transition-colors">{item.nama_lengkap}</div>
                          <div className="text-[10px] text-[#37352f]/40 font-bold uppercase tracking-widest mt-1">
                            {item.nik || 'NIK Belum Diisi'} • {item.jenis_kelamin} • {item.tempat_tanggal_lahir}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-[#37352f] bg-[#efefed] px-3 py-1.5 rounded-lg w-fit border border-[#e9e9e7]">
                              <Package className="w-3.5 h-3.5 text-[#0b6e99]" />
                              {item.paket_pilihan}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#37352f]/40 px-3">
                              <Phone className="w-3.5 h-3.5" />
                              {item.no_whatsapp}
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold tracking-widest uppercase border ${
                            item.status === 'Berhasil' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-center gap-2 md:gap-3">

                            <button 
                              onClick={() => handleBukaDetail(item)}
                              className="p-2.5 md:p-3 bg-[#efefed] hover:bg-[#37352f] text-[#37352f]/40 hover:text-white rounded-xl transition-all border border-[#e9e9e7] shrink-0"
                              title="Verifikasi Berkas"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleBukaNilai(item)}
                              className="p-2.5 md:p-3 bg-[#0b6e99]/10 hover:bg-[#0b6e99] text-[#0b6e99] hover:text-white rounded-xl transition-all border border-[#0b6e99]/20 shrink-0"
                              title="Rapor Kompetensi"
                            >
                              <BarChart3 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-20 text-center text-[#37352f]/40 font-medium italic text-xs md:text-sm">
                        {pendaftar.length > 0 ? 'Tidak ada siswa yang cocok dengan pencarian / penyaringan.' : 'Belum ada siswa yang terdaftar dalam sistem.'}
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
