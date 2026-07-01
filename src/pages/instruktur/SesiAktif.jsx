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
  const [isFocused, setIsFocused] = useState(false);
  
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
          akun_pengguna!akun_id(
            nama_lengkap,
            pendaftaran(no_whatsapp)
          ), 
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
    if (!item.tanggal_waktu) return false;
    const dateObj = new Date(item.tanggal_waktu);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const tanggalItem = `${year}-${month}-${day}`;
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

  const handleApproveReschedule = async (item) => {
    if (!window.confirm("Apakah Anda yakin ingin menyetujui pengajuan reschedule ini?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jadwal_latihan')
        .update({ 
          status: 'Dijadwalkan',
          catatan_instruktur: null 
        })
        .eq('id', item.id);
        
      if (error) throw error;
      
      alert("Pengajuan reschedule berhasil disetujui!");
      fetchSesiAktif();
    } catch (err) {
      alert("Gagal menyetujui: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReschedule = async (item) => {
    if (!window.confirm("Apakah Anda yakin ingin menolak pengajuan reschedule ini? Status jadwal akan di-reset menjadi Belum Dijadwalkan.")) return;
    setLoading(true);
    try {
      if (item.tanggal_waktu) {
         const newDate = new Date(item.tanggal_waktu);
         const newTanggal = newDate.toLocaleDateString('en-CA'); 
         const newJam = `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`;

         await supabase
          .from('slot_instruktur')
          .update({ status: 'Tersedia' })
          .eq('instruktur_id', item.instruktur_id)
          .eq('tanggal', newTanggal)
          .eq('jam', newJam);
      }

      const { error } = await supabase
        .from('jadwal_latihan')
        .update({ 
          status: 'Belum Dijadwalkan',
          tanggal_waktu: null,
          instruktur_id: null,
          catatan_instruktur: 'Reschedule ditolak oleh Instruktur.' 
        })
        .eq('id', item.id);
        
      if (error) throw error;
      
      alert("Pengajuan reschedule berhasil ditolak.");
      fetchSesiAktif();
    } catch (err) {
      alert("Gagal menolak: " + err.message);
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
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {filterTanggal && (
                  <button 
                    onClick={() => setFilterTanggal('')} 
                    className="px-4 py-2 bg-[#efefed] hover:bg-red-50 text-[#37352f]/60 hover:text-red-600 border border-[#e9e9e7] rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Lihat Semua ✕
                  </button>
                )}
                <div className="relative w-64 group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors pointer-events-none" />
                  <input 
                    type="date"
                    className="w-full bg-white border border-[#e9e9e7] rounded-xl pl-11 pr-4 py-3 text-xs font-semibold outline-none transition-all focus:border-[#0b6e99]/30 cursor-pointer min-h-[46px] text-[#37352f]"
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                  />
                </div>
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
                          <div className="font-semibold text-[#37352f] group-hover:text-[#0b6e99] transition-colors flex items-center gap-2 flex-wrap">
                            <span>{item.akun_pengguna?.nama_lengkap}</span>
                            {item.status === 'Dijadwalkan' && item.akun_pengguna?.pendaftaran?.[0]?.no_whatsapp && (
                              <a
                                href={`https://wa.me/${item.akun_pengguna.pendaftaran[0].no_whatsapp.replace(/^0/, '62')}?text=${encodeURIComponent(
                                  `Halo ${item.akun_pengguna?.nama_lengkap || 'Siswa'}, saya ${namaInstruktur} selaku instruktur TriBakti Anda. Mengingatkan jadwal latihan kita pada tanggal ${item.tanggal_waktu ? new Date(item.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} pukul ${item.tanggal_waktu ? new Date(item.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':') : ''} WIB dengan materi: ${item.kurikulum?.materi || 'Materi Belajar'}. Mohon bersiap ya!`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide transition-all border border-emerald-500/20"
                                title="Kirim Pengingat Jadwal via WhatsApp"
                              >
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82c1.516.903 3.076 1.382 4.672 1.383 5.501 0 9.975-4.474 9.977-9.977.001-2.669-1.038-5.176-2.927-7.065-1.889-1.889-4.396-2.928-7.062-2.929-5.503 0-9.978 4.475-9.981 9.977-.001 1.77.464 3.491 1.343 5.013l-1.008 3.676 3.786-.993zm11.333-7.633c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.199.299-.775.979-.95 1.178-.175.199-.35.225-.65.075-.301-.15-1.267-.467-2.414-1.49-.893-.795-1.495-1.777-1.671-2.076-.175-.3-.019-.463.13-.612.135-.133.301-.35.451-.524.15-.175.2-.299.3-.5.1-.199.05-.375-.025-.524-.075-.15-.675-1.626-.925-2.227-.244-.583-.493-.503-.675-.512-.175-.01-.375-.011-.575-.011s-.525.075-.8.375c-.275.3-1.05 1.026-1.05 2.503s1.075 2.903 1.225 3.103c.15.199 2.115 3.227 5.125 4.525.715.309 1.274.494 1.708.632.719.228 1.373.196 1.89.119.577-.086 1.781-.727 2.031-1.427.25-.699.25-1.299.175-1.427-.075-.125-.275-.199-.575-.349z"/>
                                </svg>
                                WhatsApp
                              </a>
                            )}
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
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                            item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 
                            item.status === 'Pengajuan Reschedule' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            item.status === 'Dijadwalkan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-[#efefed] text-[#0b6e99]'
                          }`}>
                            {item.status === 'Dijadwalkan' ? 'Dikunci (Dijadwalkan)' : (item.status || 'Belum Dimulai')}
                          </span>
                          {item.status === 'Pengajuan Reschedule' && item.catatan_instruktur && (
                            <div className="text-[9px] text-[#0b6e99] font-bold uppercase tracking-wider mt-1.5 max-w-xs leading-relaxed italic">
                              {item.catatan_instruktur}
                            </div>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          {item.status === 'Pengajuan Reschedule' ? (
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => handleApproveReschedule(item)} 
                                className="px-4 py-2 bg-[#0b6e99] hover:bg-[#085a80] text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button 
                                onClick={() => handleRejectReschedule(item)} 
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : item.status !== 'Selesai' ? (
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
