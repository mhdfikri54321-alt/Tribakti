import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from '../siswa/Footer';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Star, 
  MessageSquare, 
  X, 
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';

export default function SesiAktif() {
  const [jadwalAktif, setJadwalAktif] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTanggal, setFilterTanggal] = useState('');
  
  const [showModalSelesai, setShowModalSelesai] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [nilaiInput, setNilaiInput] = useState('');
  const [catatanInput, setCatatanInput] = useState('');

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const namaInstruktur = savedUser?.nama_lengkap || 'Instruktur';
  const instrukturId = savedUser?.id;

  useEffect(() => {
    fetchSesiAktif();
  }, []);

  const fetchSesiAktif = async () => {
    setLoading(true);
    try {
      // Mengambil semua jadwal instruktur tanpa filter status
      const { data, error } = await supabase
        .from('jadwal_latihan')
        .select(`
          *, 
          akun_pengguna!akun_id(nama_lengkap), 
          kurikulum(materi)
        `)
        .eq('instruktur_id', instrukturId)
        .order('tanggal_waktu', { ascending: true });

      if (error) throw error;
      setJadwalAktif(data || []);
    } catch (err) {
      console.error("Gagal memuat sesi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredJadwal = jadwalAktif.filter((item) => {
    if (!filterTanggal) return true;
    const tanggalItem = item.tanggal_waktu ? new Date(item.tanggal_waktu).toISOString().split('T')[0] : '';
    return tanggalItem === filterTanggal;
  });

  const handleBukaPenyelesaian = (item) => {
    setSelectedJadwal(item);
    setShowModalSelesai(true);
  };

  const submitPenyelesaian = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jadwal_latihan')
        .update({ 
          status: 'Selesai', 
          nilai: parseInt(nilaiInput), 
          catatan_instruktur: catatanInput 
        })
        .eq('id', selectedJadwal.id);
        
      if (error) throw error;
      
      alert("Sesi latihan berhasil diselesaikan!");
      setShowModalSelesai(false);
      setNilaiInput('');
      setCatatanInput('');
      fetchSesiAktif();
    } catch (err) {
      alert("Gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="instruktur" activeMenu="sesi aktif" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Sesi Latihan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{namaInstruktur}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Instruktur</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {namaInstruktur.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Info className="w-3 h-3 text-[#0b6e99]" />
              Manajemen Pembelajaran
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Sesi Latihan <span className="text-[#0b6e99]">Aktif</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Daftar seluruh sesi yang perlu Anda ajarkan. Pantau kehadiran dan berikan evaluasi langsung kepada siswa.
              </p>
              <div className="relative w-64 group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors pointer-events-none" />
                
                {/* Placeholder overlay */}
                {!filterTanggal && (
                  <span className="absolute left-11 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#37352f]/40 pointer-events-none font-sans">
                    Pilih tanggal filter...
                  </span>
                )}
                
                <input 
                  type="date" 
                  className={`w-full bg-white border border-[#e9e9e7] rounded-xl pl-11 pr-4 py-3 text-xs font-semibold outline-none transition-all focus:border-[#0b6e99]/30 cursor-pointer min-h-[46px] ${filterTanggal ? 'text-[#37352f]' : 'text-transparent'}`}
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            {filteredJadwal.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fbfbfa]">
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Siswa</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Waktu & Materi</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Status</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9e9e7]">
                    {filteredJadwal.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fbfbfa] transition-colors group">
                        <td className="p-6">
                          <div className="font-semibold text-[#37352f] group-hover:text-[#0b6e99] transition-colors">
                            {item.akun_pengguna?.nama_lengkap}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Siswa Aktif</div>
                        </td>
                        <td className="p-6">
                          <div className="font-semibold text-[#37352f] text-sm flex items-center gap-2">
                            {item.tanggal_waktu ? (
                              <>
                                <span>{new Date(item.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span className="px-2 py-0.5 bg-[#efefed] text-[#0b6e99] rounded text-[11px] font-bold tracking-widest">
                                  {new Date(item.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')} WIB
                                </span>
                              </>
                            ) : (
                              'Belum diatur'
                            )}
                          </div>
                          <div className="text-xs font-bold uppercase tracking-widest text-[#37352f]/50 mt-1.5">
                            {item.kurikulum?.materi || 'Materi Belum Ditentukan'}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#efefed] text-[#0b6e99]'}`}>
                            {item.status || 'Belum Dimulai'}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          {item.status !== 'Selesai' ? (
                            <button 
                              onClick={() => handleBukaPenyelesaian(item)} 
                              className="px-6 py-3 bg-[#37352f] hover:bg-[#0b6e99] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                              Evaluasi Sesi
                            </button>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">Skor Akhir</span>
                              <span className="text-lg font-semibold text-[#37352f]">{item.nilai}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-24 text-center">
                <div className="w-20 h-20 bg-[#efefed] rounded-xl flex items-center justify-center mx-auto mb-6 text-[#37352f]/30">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-[#37352f] mb-2">
                  {loading ? 'Memuat data sesi...' : 'Tidak ada sesi latihan ditemukan.'}
                </h3>
                {!loading && <p className="text-[#37352f]/50 font-medium text-sm">Coba ubah filter tanggal atau hubungi admin.</p>}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Modal Evaluasi */}
      {showModalSelesai && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-[#37352f]/20" 
            onClick={() => setShowModalSelesai(false)}
          ></div>
          
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl relative z-10 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 md:p-8 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa] sticky top-0 z-10">
              <div>
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1 block">Evaluasi Pembelajaran</span>
                <h3 className="text-xl md:text-2xl font-bold text-[#37352f] tracking-tight">
                  Selesaikan Sesi
                </h3>
              </div>
              <button 
                onClick={() => setShowModalSelesai(false)} 
                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#37352f]/40 hover:text-red-500 transition-all border border-[#e9e9e7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitPenyelesaian} className="p-6 md:p-8 space-y-4 md:space-y-6">
              {/* Info Sesi */}
              <div className="bg-[#fbfbfa] p-4 md:p-6 rounded-xl border border-[#e9e9e7] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#0b6e99] border border-[#e9e9e7] shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Materi Sesi</p>
                    <p className="text-sm font-semibold text-[#37352f]">{selectedJadwal?.kurikulum?.materi || 'Materi Belum Ditentukan'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#0b6e99] border border-[#e9e9e7] shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Nama Siswa</p>
                    <p className="text-sm font-semibold text-[#37352f]">{selectedJadwal?.akun_pengguna?.nama_lengkap}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 ml-1">Nilai Performa (0 - 100)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      required 
                      className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-12 py-3.5 text-sm font-semibold text-[#37352f] outline-none transition-all focus:bg-white focus:border-[#0b6e99]/30"
                      placeholder="Masukkan skor siswa..."
                      value={nilaiInput}
                      onChange={(e) => setNilaiInput(e.target.value)}
                    />
                    <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 ml-1">Catatan Instruktur</label>
                  <div className="relative group">
                    <textarea 
                      required 
                      rows="3"
                      className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-12 py-3.5 text-sm font-semibold text-[#37352f] outline-none transition-all focus:bg-white focus:border-[#0b6e99]/30 resize-none"
                      placeholder="Berikan masukan atau evaluasi untuk siswa..."
                      value={catatanInput}
                      onChange={(e) => setCatatanInput(e.target.value)}
                    ></textarea>
                    <MessageSquare className="absolute left-4 top-6 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#37352f] hover:bg-[#0b6e99] text-white py-3.5 md:py-4 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    Simpan Evaluasi & Selesaikan Sesi
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
