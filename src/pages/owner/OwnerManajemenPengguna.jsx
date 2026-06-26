import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OwnerSidebar from './OwnerSidebar';
import Footer from '../siswa/Footer';
import { 
  Users, 
  Search, 
  User,
  Filter,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Phone,
  Package,
  BookOpen,
  Eye,
  X,
  Download,
  CreditCard,
  FileText
} from 'lucide-react';

export default function OwnerManajemenPengguna() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('siswa'); // 'siswa' atau 'instruktur'
  const [siswaList, setSiswaList] = useState([]);
  const [instrukturList, setInstrukturList] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterPaket, setFilterPaket] = useState('Semua');

  // States untuk modal detail
  const [showSiswaModal, setShowSiswaModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [siswaSesiDetail, setSiswaSesiDetail] = useState([]);


  // States untuk modal detail instruktur tidak lagi digunakan karena beralih ke halaman khusus


  const [modalLoading, setModalLoading] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data pendaftaran (siswa)
      const { data: pendaftaranData, error: pendaftaranErr } = await supabase
        .from('pendaftaran')
        .select('*')
        .order('created_at', { ascending: false });
      if (pendaftaranErr) throw pendaftaranErr;

      // 2. Ambil data instruktur dari akun_pengguna
      const { data: instrukturData, error: instrukturErr } = await supabase
        .from('akun_pengguna')
        .select('*')
        .eq('role', 'instruktur')
        .order('nama_lengkap', { ascending: true });
      if (instrukturErr) throw instrukturErr;

      // 3. Ambil data jadwal latihan untuk menghitung sesi
      const { data: jadwalData, error: jadwalErr } = await supabase
        .from('jadwal_latihan')
        .select('id, akun_id, instruktur_id, status');
      if (jadwalErr) throw jadwalErr;

      setSiswaList(pendaftaranData || []);
      setInstrukturList(instrukturData || []);
      setSesiList(jadwalData || []);
    } catch (err) {
      console.error("Gagal mengambil data:", err.message);
      alert("Error memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ambil opsi paket & status secara unik untuk opsi filter dropdown
  const uniquePaket = ['Semua', ...new Set(siswaList.map(p => p.paket_pilihan).filter(Boolean))];
  const uniqueStatus = ['Semua', ...new Set(siswaList.map(p => p.status).filter(Boolean))];

  // Saring data siswa
  const filteredSiswa = siswaList.filter((siswa) => {
    const query = search.toLowerCase();
    const matchesSearch = 
      (siswa.nama_lengkap || '').toLowerCase().includes(query) ||
      (siswa.nik || '').toLowerCase().includes(query) ||
      (siswa.no_whatsapp || '').toLowerCase().includes(query);
      
    const matchesStatus = filterStatus === 'Semua' || siswa.status === filterStatus;
    const matchesPaket = filterPaket === 'Semua' || siswa.paket_pilihan === filterPaket;
    
    return matchesSearch && matchesStatus && matchesPaket;
  });

  // Saring data instruktur
  const filteredInstruktur = instrukturList.filter((instruktur) => {
    const query = search.toLowerCase();
    return (
      (instruktur.nama_lengkap || '').toLowerCase().includes(query) ||
      (instruktur.username || '').toLowerCase().includes(query) ||
      (instruktur.nik || '').toLowerCase().includes(query)
    );
  });

  // Hitung progres sesi siswa
  const getSiswaProgress = (akunId) => {
    const siswaSesi = sesiList.filter(s => s.akun_id === akunId);
    const total = siswaSesi.length;
    const selesai = siswaSesi.filter(s => s.status === 'Selesai').length;
    const persentase = total > 0 ? Math.round((selesai / total) * 100) : 0;
    return { selesai, total, persentase };
  };

  // Hitung sesi diajar instruktur
  const getInstrukturSesiCount = (instrukturId) => {
    return sesiList.filter(s => s.instruktur_id === instrukturId && s.status === 'Selesai').length;
  };

  // Fungsi buka detail berkas pendaftaran (alamat domisili & bukti transfer)
  const handleBukaBerkasSiswa = (siswa) => {
    navigate(`/owner/siswa/detail?id=${siswa.id}`);
  };

  // Fungsi detail instruktur dipindahkan ke halaman khusus /owner/instruktur/sesi


  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <OwnerSidebar activeMenu="siswa" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Data Siswa & Instruktur</span>
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
          {/* Header Section */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Users className="w-3 h-3 text-[#0b6e99]" />
              Akademik & Operasional
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Siswa & <span className="text-[#37352f]/40">Instruktur TriBakti.</span>
            </h2>
            <p className="text-[#37352f]/60 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
              Pantau keaktifan belajar siswa, progres sesi kurikulum latihan, serta beban kerja instruktur mengemudi.
            </p>
          </div>

          {/* Tab Switcher & Search Bar */}
          <div className="flex flex-col gap-4 mb-8">
            {/* Tabs */}
            <div className="flex bg-[#efefed] p-1 rounded-xl w-fit border border-[#e9e9e7]">
              <button
                onClick={() => {
                  setActiveTab('siswa');
                  setSearch('');
                  setFilterStatus('Semua');
                  setFilterPaket('Semua');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'siswa' 
                    ? 'bg-white text-[#37352f] shadow-sm' 
                    : 'text-[#37352f]/50 hover:text-[#37352f]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Data Siswa
              </button>
              <button
                onClick={() => {
                  setActiveTab('instruktur');
                  setSearch('');
                  setFilterStatus('Semua');
                  setFilterPaket('Semua');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'instruktur' 
                    ? 'bg-white text-[#37352f] shadow-sm' 
                    : 'text-[#37352f]/50 hover:text-[#37352f]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Data Instruktur
              </button>
            </div>

            {/* Search and Filters Grid */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/40" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'siswa' ? "Cari nama, NIK, atau no. WhatsApp..." : "Cari nama, NIK, atau username..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e9e9e7] bg-white outline-none focus:border-[#0b6e99] text-xs font-medium transition-all"
                />
              </div>

              {/* Filters (Hanya untuk Tab Siswa) */}
              {activeTab === 'siswa' && (
                <div className="flex flex-wrap gap-3">
                  {/* Filter Paket */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-[#e9e9e7]">
                    <Package className="w-3.5 h-3.5 text-[#37352f]/45" />
                    <select
                      value={filterPaket}
                      onChange={(e) => setFilterPaket(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-[#37352f]/70 uppercase tracking-wider outline-none border-none py-1.5 cursor-pointer"
                    >
                      <option value="Semua">Semua Paket</option>
                      {uniquePaket.filter(p => p !== 'Semua').map((paket) => (
                        <option key={paket} value={paket}>{paket}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Status */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-[#e9e9e7]">
                    <Filter className="w-3.5 h-3.5 text-[#37352f]/45" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-[#37352f]/70 uppercase tracking-wider outline-none border-none py-1.5 cursor-pointer"
                    >
                      <option value="Semua">Semua Status</option>
                      {uniqueStatus.filter(s => s !== 'Semua').map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data List Container */}
          <div className="bg-white rounded-2xl border border-[#e9e9e7] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === 'siswa' ? (
                /* TAB SISWA */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Siswa</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Paket Kursus</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Status Pembayaran</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Progress Sesi Latihan</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9e9e7]">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center opacity-50">Memuat data siswa...</td>
                      </tr>
                    ) : filteredSiswa.length > 0 ? (
                      filteredSiswa.map((siswa) => {
                        const { selesai, total, persentase } = getSiswaProgress(siswa.akun_id);
                        return (
                          <tr key={siswa.id} className="text-sm hover:bg-[#fbfbfa] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#0b6e99]/5 flex items-center justify-center font-bold text-[#0b6e99] border border-[#0b6e99]/20 shrink-0">
                                  {siswa.nama_lengkap?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#37352f] truncate">{siswa.nama_lengkap}</p>
                                  <div className="text-[10px] text-[#37352f]/40 font-bold uppercase tracking-widest mt-1">
                                    {siswa.nik || 'NIK Belum Diisi'} • {siswa.jenis_kelamin} • {siswa.tempat_tanggal_lahir}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-[#37352f]/50 mt-1">
                                    <Phone className="w-3 h-3 text-[#37352f]/30" />
                                    <span>{siswa.no_whatsapp}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#37352f] bg-[#efefed] px-2.5 py-1 rounded-lg w-fit border border-[#e9e9e7]">
                                <Package className="w-3.5 h-3.5 text-[#0b6e99] shrink-0" />
                                {siswa.paket_pilihan}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                siswa.status === 'Berhasil' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {siswa.status === 'Berhasil' ? 'Aktif' : siswa.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5 max-w-[200px]">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-[#37352f]/50">{persentase}% Selesai</span>
                                  <span className="text-[#37352f]">{selesai} / {total} Sesi</span>
                                </div>
                                <div className="w-full bg-[#efefed] h-1.5 rounded-full overflow-hidden border border-[#e9e9e7]/50">
                                  <div 
                                    className="bg-[#0b6e99] h-full transition-all duration-500" 
                                    style={{ width: `${persentase}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2 md:gap-3">

                                <button 
                                  onClick={() => handleBukaBerkasSiswa(siswa)}
                                  className="p-2.5 bg-[#efefed] hover:bg-[#37352f] text-[#37352f]/40 hover:text-white rounded-xl transition-all border border-[#e9e9e7] shrink-0 inline-flex items-center justify-center cursor-pointer"
                                  title="Lihat Berkas & Bukti Pembayaran"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => navigate(`/owner/siswa/sesi?akun_id=${siswa.akun_id}&nama=${encodeURIComponent(siswa.nama_lengkap)}`)}
                                  className="p-2.5 bg-[#0b6e99]/10 hover:bg-[#0b6e99] text-[#0b6e99] hover:text-white rounded-xl transition-all border border-[#0b6e99]/20 shrink-0 inline-flex items-center justify-center cursor-pointer"
                                  title="Lihat Sesi Latihan"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center opacity-50 italic">Siswa tidak ditemukan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                /* TAB INSTRUKTUR */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Nama Instruktur</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Username / NIK</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Total Jam Mengajar</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9e9e7]">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center opacity-50">Memuat data instruktur...</td>
                      </tr>
                    ) : filteredInstruktur.length > 0 ? (
                      filteredInstruktur.map((instruktur) => {
                        const totalSesiMengajar = getInstrukturSesiCount(instruktur.id);
                        return (
                          <tr key={instruktur.id} className="text-sm hover:bg-[#fbfbfa] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#37352f]/5 flex items-center justify-center font-bold text-[#37352f] border border-[#37352f]/20 shrink-0">
                                  {instruktur.nama_lengkap?.charAt(0)}
                                </div>
                                <span className="font-bold text-[#37352f]">{instruktur.nama_lengkap}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-[#37352f]">{instruktur.username}</span>
                                <span className="text-[10px] text-[#37352f]/40 mt-0.5">NIK: {instruktur.nik || '-'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="inline-flex flex-col items-center justify-center bg-[#efefed] px-4 py-1.5 rounded-xl border border-[#e9e9e7]">
                                <span className="text-base font-bold text-[#0b6e99]">{totalSesiMengajar}</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-[#37352f]/40">Sesi Selesai</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                onClick={() => navigate(`/owner/instruktur/sesi?id=${instruktur.id}&nama=${encodeURIComponent(instruktur.nama_lengkap)}`)}
                                className="p-2 bg-[#efefed] hover:bg-[#0b6e99] text-[#37352f]/60 hover:text-white rounded-xl transition-all border border-[#e9e9e7] inline-flex items-center justify-center cursor-pointer"
                                title="Lihat Detail Jam Mengajar"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center opacity-50 italic">Instruktur tidak ditemukan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>



      {/* Detail Sesi Mengajar Instruktur beralih ke halaman khusus /owner/instruktur/sesi */}

    </div>
  );
}
