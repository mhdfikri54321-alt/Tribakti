import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { 
  History, 
  ChevronRight, 
  Trophy, 
  Calendar, 
  Search,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';

export default function HistoriUjian() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listRiwayat, setListRiwayat] = useState([]);
  const [search, setSearch] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  
  // State untuk Detail Jawaban
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailJawaban, setDetailJawaban] = useState([]);
  const [selectedUjian, setSelectedUjian] = useState(null);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const akunId = savedUser?.id;

  useEffect(() => {
    if (!akunId) { navigate('/login'); return; }
    fetchData();
  }, [akunId, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dataSiswa } = await supabase
        .from('pendaftaran')
        .select('nama_lengkap, paket_pilihan, status')
        .eq('akun_id', akunId)
        .single();
      
      if (dataSiswa) setStudentInfo(dataSiswa);

      const { data, error } = await supabase
        .from('riwayat_ujian_sim')
        .select('*')
        .eq('akun_id', akunId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListRiwayat(data || []);
    } catch (err) {
      console.error("Gagal memuat riwayat:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailJawaban = async (riwayat) => {
    setSelectedUjian(riwayat);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from('detail_ujian_soal')
        .select(`
          *,
          bank_soal_sim!soal_id (
            pertanyaan,
            pilihan_a,
            pilihan_b,
            pilihan_c,
            pilihan_d,
            kunci_jawaban
          )
        `)
        .eq('riwayat_ujian_id', riwayat.id);

      if (error) throw error;
      setDetailJawaban(data || []);
    } catch (err) {
      console.error("Gagal memuat detail jawaban:", err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const riwayatDisaring = listRiwayat.filter(item => 
    item.status.toLowerCase().includes(search.toLowerCase()) ||
    new Date(item.created_at).toLocaleDateString('id-ID').includes(search)
  );

  const stats = {
    total: listRiwayat.length,
    lulus: listRiwayat.filter(r => r.status === 'LULUS').length,
    tertinggi: listRiwayat.length > 0 ? Math.max(...listRiwayat.map(r => r.skor)) : 0
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="histori" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Akademik</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Histori Simulasi</span>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#37352f]/20">
               <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
               <p className="text-xs font-bold uppercase tracking-widest">Memuat histori...</p>
            </div>
          ) : !(studentInfo?.status === 'Aktif' || studentInfo?.status === 'Berhasil') ? (
            <div className="bg-white border border-amber-100 rounded-2xl p-10 text-center shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#37352f]">Akses Terkunci 🔒</h3>
              <p className="text-sm text-[#37352f]/60 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                Anda harus menyelesaikan pendaftaran dan pembayaran paket terlebih dahulu sebelum dapat mengakses histori ujian.
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
              <div className="mb-6 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 md:mb-4">Rekam Jejak Ujian 📈</h2>
            <p className="text-sm md:text-lg text-[#37352f]/70 leading-relaxed max-w-2xl font-medium">
              Pantau perkembangan skor simulasi Anda dari waktu ke waktu untuk memastikan kesiapan menghadapi ujian resmi.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 md:gap-6 mb-8 md:mb-12">
            <div className="bg-white border border-[#e9e9e7] rounded-xl p-3.5 md:p-6 shadow-sm">
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1 md:mb-2">Total Ujian</p>
              <div className="flex items-end gap-1 md:gap-2">
                <span className="text-xl md:text-3xl font-bold">{stats.total}</span>
                <span className="text-[9px] md:text-xs font-medium text-[#37352f]/40 mb-0.5 md:mb-1">Sesi</span>
              </div>
            </div>
            <div className="bg-white border border-[#e9e9e7] rounded-xl p-3.5 md:p-6 shadow-sm">
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1 md:mb-2">Lulus</p>
              <div className="flex items-end gap-1 md:gap-2">
                <span className="text-xl md:text-3xl font-bold text-emerald-600">{stats.lulus}</span>
                <span className="text-[9px] md:text-xs font-medium text-[#37352f]/40 mb-0.5 md:mb-1">Sesi</span>
              </div>
            </div>
            <div className="bg-white border border-[#e9e9e7] rounded-xl p-3.5 md:p-6 shadow-sm">
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1 md:mb-2">Skor Max</p>
              <div className="flex items-end gap-1 md:gap-2">
                <span className="text-xl md:text-3xl font-bold text-[#0b6e99]">{stats.tertinggi}</span>
                <span className="text-[9px] md:text-xs font-medium text-[#37352f]/40 mb-0.5 md:mb-1">Poin</span>
              </div>
            </div>
          </div>

          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
              <input 
                type="text" 
                placeholder="Cari histori..." 
                className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#0b6e99] transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Jenis Ujian</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Skor</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Benar/Salah</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Status</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efefed]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="w-6 h-6 border-2 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/20">Memuat histori...</p>
                      </td>
                    </tr>
                  ) : riwayatDisaring.length > 0 ? (
                    riwayatDisaring.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fbfbfa] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.jenis_ujian === 'motorik' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.jenis_ujian === 'motorik' ? <Trophy className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#37352f] flex items-center gap-2">
                                {item.jenis_ujian === 'motorik' ? 'Ujian Motorik' : 'Ujian Materi'}
                                <span className="text-[9px] font-medium text-[#37352f]/30">
                                  {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                              </p>
                              <p className="text-[10px] font-medium text-[#37352f]/40 uppercase tracking-widest">
                                {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`text-lg font-bold ${item.skor >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {item.skor}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> {item.total_benar}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3" /> {item.total_salah}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${item.status === 'LULUS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => fetchDetailJawaban(item)}
                            className="p-2 bg-[#efefed] hover:bg-[#0b6e99] text-[#37352f]/40 hover:text-white rounded-lg transition-all group/btn"
                            title="Lihat Detail Jawaban"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <History className="w-10 h-10 text-[#37352f]/10 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-[#37352f]/60">Belum ada riwayat</h3>
                        <p className="text-xs text-[#37352f]/40">Selesaikan simulasi ujian untuk melihat rekam jejak Anda.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="block md:hidden divide-y divide-[#efefed]">
              {loading ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/20">Memuat histori...</p>
                </div>
              ) : riwayatDisaring.length > 0 ? (
                riwayatDisaring.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col gap-4 hover:bg-[#fbfbfa] transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.jenis_ujian === 'motorik' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {item.jenis_ujian === 'motorik' ? <Trophy className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#37352f]">
                            {item.jenis_ujian === 'motorik' ? 'Ujian Motorik' : 'Ujian Materi'}
                          </p>
                          <p className="text-[10px] font-medium text-[#37352f]/40 uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${item.status === 'LULUS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#fbfbfa] p-3 rounded-xl border border-[#efefed] text-center">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-0.5">Skor</p>
                        <p className={`text-base font-bold ${item.skor >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>{item.skor}</p>
                      </div>
                      <div className="border-x border-[#efefed]">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-0.5">Benar</p>
                        <p className="text-base font-bold text-emerald-600">{item.total_benar}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-0.5">Salah</p>
                        <p className="text-base font-bold text-red-600">{item.total_salah}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => fetchDetailJawaban(item)}
                      className="w-full py-2.5 bg-[#efefed] hover:bg-[#0b6e99] hover:text-white rounded-xl transition-all text-xs font-bold text-[#37352f]/60 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Lihat Detail Jawaban
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-6 py-16 text-center">
                  <History className="w-10 h-10 text-[#37352f]/10 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-[#37352f]/60">Belum ada riwayat</h3>
                  <p className="text-xs text-[#37352f]/40">Selesaikan simulasi ujian untuk melihat rekam jejak Anda.</p>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </main>
        <Footer />
      </div>

      {showDetail && (
        <div className="fixed inset-0 bg-[#37352f]/40 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 md:p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-[#efefed] flex justify-between items-center bg-[#fbfbfa]">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white border border-[#e9e9e7] rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-[#0b6e99]" />
                </div>
                <div>
                  <h3 className="text-base md:text-xl font-bold text-[#37352f] leading-none mb-1 md:mb-1.5">Detail Hasil Simulasi</h3>
                  <p className="text-[8px] md:text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest leading-none">
                    {selectedUjian && new Date(selectedUjian.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetail(false)}
                className="w-9 h-9 md:w-10 md:h-10 bg-white border border-[#e9e9e7] hover:bg-red-50 hover:text-red-600 rounded-lg md:rounded-xl flex items-center justify-center transition-all group flex-shrink-0"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fbfbfa]">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-16 md:py-20">
                  <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/20">Menganalisis jawaban...</p>
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#e9e9e7] shadow-sm">
                      <p className="text-[8px] md:text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest mb-1 md:mb-2">Skor Akhir</p>
                      <p className={`text-2xl md:text-3xl font-black ${selectedUjian?.skor >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>{selectedUjian?.skor}</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#e9e9e7] shadow-sm">
                      <p className="text-[8px] md:text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest mb-1 md:mb-2">Benar</p>
                      <p className="text-2xl md:text-3xl font-black text-emerald-600">{selectedUjian?.total_benar}</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#e9e9e7] shadow-sm">
                      <p className="text-[8px] md:text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest mb-1 md:mb-2">Salah</p>
                      <p className="text-2xl md:text-3xl font-black text-red-600">{selectedUjian?.total_salah}</p>
                    </div>
                    <div className="bg-white p-4 md:p-6 rounded-2xl border border-[#e9e9e7] shadow-sm">
                      <p className="text-[8px] md:text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest mb-1 md:mb-2">Status</p>
                      <p className={`text-xs md:text-sm font-black uppercase tracking-widest mt-1 md:mt-2 ${selectedUjian?.status === 'LULUS' ? 'text-emerald-600' : 'text-red-600'}`}>{selectedUjian?.status}</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#37352f]/40 border-l-4 border-[#0b6e99] pl-3 md:pl-4">Review Soal & Jawaban</h4>
                    
                    {!detailLoading && detailJawaban.length === 0 && (
                      <div className="bg-white border border-[#e9e9e7] rounded-3xl p-8 md:p-12 text-center shadow-sm">
                        <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-[#37352f]/10 mx-auto mb-4" />
                        <h3 className="text-xs md:text-sm font-bold text-[#37352f]/60">Data detail tidak ditemukan</h3>
                        <p className="text-[10px] md:text-xs text-[#37352f]/40">Detail soal dan jawaban tidak tersedia untuk sesi ujian ini.</p>
                      </div>
                    )}

                    {detailJawaban.map((item, idx) => (
                      <div key={item.id} className="bg-white border border-[#e9e9e7] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
                        <div className="px-4 md:px-8 py-4 md:py-6 border-b border-[#f5f5f4] flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 bg-[#fbfbfa]">
                          <div className="flex gap-3 md:gap-4 items-start">
                            <span className="w-7 h-7 md:w-8 md:h-8 bg-[#37352f] text-white rounded-lg flex items-center justify-center font-bold text-xs md:text-sm shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs md:text-sm font-bold text-[#37352f] leading-relaxed">
                              {item.bank_soal_sim?.pertanyaan}
                            </p>
                          </div>
                          <div className={`px-2.5 py-0.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest shrink-0 self-end sm:self-start ${item.is_benar ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {item.is_benar ? 'BENAR' : 'SALAH'}
                          </div>
                        </div>
                        <div className="p-4 md:p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {['a', 'b', 'c', 'd'].map(opsi => {
                              const isCorrect = opsi.toUpperCase() === item.bank_soal_sim?.kunci_jawaban;
                              const isStudentAnswer = opsi.toUpperCase() === item.jawaban_siswa;
                              
                              return (
                                <div 
                                  key={opsi}
                                  className={`p-3 md:p-4 rounded-xl border text-[11px] md:text-xs font-medium flex items-center gap-3 md:gap-4 ${
                                    isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                                    isStudentAnswer && !item.is_benar ? 'bg-red-50 border-red-200 text-red-700' : 
                                    'bg-white border-[#efefed] text-[#37352f]/60'
                                  }`}
                                >
                                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center font-bold text-[10px] md:text-xs shrink-0 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 
                                    isStudentAnswer && !item.is_benar ? 'bg-red-600 text-white' : 
                                    'bg-[#efefed] text-[#37352f]/30'
                                  }`}>
                                    {opsi.toUpperCase()}
                                  </div>
                                  <span className="flex-1 leading-snug">{item.bank_soal_sim?.[`pilihan_${opsi}`]}</span>
                                  {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                  {isStudentAnswer && !item.is_benar && <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 md:px-8 py-4 md:py-6 border-t border-[#efefed] flex justify-end bg-[#fbfbfa]">
              <button 
                onClick={() => setShowDetail(false)}
                className="w-full sm:w-auto bg-[#37352f] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all text-center"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}