import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import { 
  Users, 
  UserPlus, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  ShieldCheck,
  X,
  ChevronRight,
  Wallet
} from 'lucide-react';

export default function ManajemenInstruktur() {
  const navigate = useNavigate();
  const [instrukturList, setInstrukturList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  // State Modal Tambah Instruktur
  const [showModalInstruktur, setShowModalInstruktur] = useState(false);
  const [formInstruktur, setFormInstruktur] = useState({
    nama_lengkap: '', 
    username: '', 
    password: '', 
    umur: '', 
    no_telepon: '', 
    alamat: '',
    nama_bank: '',
    no_rekening: ''
  });

  useEffect(() => {
    fetchInstruktur();
  }, []);

  const fetchInstruktur = async () => {
    setLoading(true);
    try {
      const { data: dataInstruktur, error } = await supabase
        .from('instruktur')
        .select('*, akun_pengguna(username)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstrukturList(dataInstruktur || []);
    } catch (err) {
      console.error("Gagal memuat instruktur:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI TAMBAH INSTRUKTUR ---
  const handleTambahInstruktur = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: akunData, error: errAkun } = await supabase
        .from('akun_pengguna')
        .insert([{
          nama_lengkap: formInstruktur.nama_lengkap,
          username: formInstruktur.username,
          password: formInstruktur.password,
          role: 'instruktur'
        }])
        .select()
        .single();

      if (errAkun) throw errAkun;

      const { error: errProfil } = await supabase
        .from('instruktur')
        .insert([{
          nama_lengkap: formInstruktur.nama_lengkap,
          umur: parseInt(formInstruktur.umur),
          no_telepon: formInstruktur.no_telepon,
          alamat: formInstruktur.alamat,
          akun_id: akunData.id,
          nama_bank: formInstruktur.nama_bank,
          no_rekening: formInstruktur.no_rekening
        }]);

      if (errProfil) throw errProfil;

      alert("Akun Instruktur Berhasil Dibuat!");
      setShowModalInstruktur(false);
      setFormInstruktur({ 
        nama_lengkap: '', 
        username: '', 
        password: '', 
        umur: '', 
        no_telepon: '', 
        alamat: '',
        nama_bank: '',
        no_rekening: ''
      });
      fetchInstruktur(); // Refresh tabel

    } catch (err) {
      alert("Gagal menambahkan instruktur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar activeMenu="instruktur" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Manajemen Instruktur</span>
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
              <ShieldCheck className="w-3 h-3 text-[#0b6e99]" />
              Sertifikasi Pengajar
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Manajemen <span className="text-[#37352f]/40">Instruktur.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Kelola data tenaga pengajar profesional, atur akun akses, dan pantau ketersediaan instruktur Tri Bakti.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="bg-white px-5 py-3 rounded-2xl border border-[#e9e9e7] flex items-center gap-4 shrink-0 shadow-sm justify-between sm:justify-start">
                  <div className="text-right border-r border-[#e9e9e7] pr-4">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Total Aktif</p>
                    <p className="text-sm font-bold text-[#37352f] leading-none">{instrukturList.length} Orang</p>
                  </div>
                  <div className="w-10 h-10 bg-[#0b6e99]/10 text-[#0b6e99] rounded-xl flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <button 
                  onClick={() => setShowModalInstruktur(true)}
                  className="bg-[#37352f] hover:bg-[#0b6e99] text-white px-6 py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 justify-center shadow-sm shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> Tambah Instruktur
                </button>
              </div>
            </div>
          </div>

          <AdminTabSwitcher group="pengguna" activeTab="instruktur" />

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Nama Instruktur</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Kontak & Umur</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Domisili</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Rekening Bank</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Sesi Mengajar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Memuat Pengajar...</p>
                      </td>
                    </tr>
                  ) : instrukturList.length > 0 ? (
                    instrukturList.map((ins) => (
                      <tr key={ins.id} className="hover:bg-[#fbfbfa] transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#efefed] rounded-2xl flex items-center justify-center text-[#37352f]/40 hover:bg-[#0b6e99]/10 hover:text-[#0b6e99] transition-all border border-[#e9e9e7]">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="font-bold text-[#37352f] text-lg tracking-tight hover:text-[#0b6e99] transition-colors">{ins.nama_lengkap}</div>
                              <div className="flex items-center gap-2 text-[10px] text-[#37352f]/40 font-bold uppercase tracking-widest mt-1">
                                  <User className="w-3 h-3" />
                                  {ins.akun_pengguna?.username}
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-[#37352f] bg-[#efefed] px-3 py-1.5 rounded-lg w-fit border border-[#e9e9e7]">
                              <Phone className="w-3.5 h-3.5 text-[#0b6e99]" />
                              {ins.no_telepon}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#37352f]/40 px-3">
                              <Calendar className="w-3.5 h-3.5" />
                              {ins.umur} Tahun
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-start gap-2 text-sm font-medium text-[#37352f]/60 leading-relaxed max-w-xs">
                            <MapPin className="w-4 h-4 text-[#37352f]/30 mt-0.5 shrink-0" />
                            {ins.alamat}
                          </div>
                        </td>
                        <td className="p-6">
                          {ins.nama_bank || ins.no_rekening ? (
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-150 px-3 py-2 rounded-xl w-fit border border-gray-200">
                              <Wallet className="w-4 h-4 text-[#0b6e99]" />
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">Rekening</p>
                                <p className="font-mono leading-none">{ins.nama_bank} - {ins.no_rekening}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic font-semibold">Belum Diisi</span>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          <button
                            onClick={() => navigate(`/admin/instruktur/sesi?id=${ins.akun_id}&nama=${encodeURIComponent(ins.nama_lengkap)}`)}
                            className="px-4 py-2 bg-[#efefed] hover:bg-[#0b6e99] hover:text-white text-[#37352f]/70 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border border-[#e9e9e7] hover:border-transparent"
                          >
                            Lihat Sesi
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-20 text-center text-[#37352f]/40 font-medium italic">
                        Belum ada instruktur yang terdaftar.
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

      {/* MODAL FORM TAMBAH INSTRUKTUR */}
      {showModalInstruktur && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div className="absolute inset-0 bg-[#37352f]/40 backdrop-blur-sm" onClick={() => setShowModalInstruktur(false)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="p-5 md:p-8 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1 block">Registrasi Pengajar</span>
                <h3 className="text-xl md:text-3xl font-bold text-[#37352f] tracking-tight">Tambah Instruktur</h3>
              </div>
              <button 
                onClick={() => setShowModalInstruktur(false)} 
                className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-[#37352f]/40 hover:text-rose-500 transition-all border border-[#e9e9e7]"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleTambahInstruktur} className="p-5 md:p-8 overflow-y-auto flex-1 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    placeholder="Nama sesuai identitas"
                    value={formInstruktur.nama_lengkap}
                    onChange={(e) => setFormInstruktur({...formInstruktur, nama_lengkap: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Username Akun</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    placeholder="Masukkan username"
                    value={formInstruktur.username}
                    onChange={(e) => setFormInstruktur({...formInstruktur, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    placeholder="••••••••"
                    value={formInstruktur.password}
                    onChange={(e) => setFormInstruktur({...formInstruktur, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Umur</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    placeholder="Contoh: 30"
                    value={formInstruktur.umur}
                    onChange={(e) => setFormInstruktur({...formInstruktur, umur: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">No. Telepon / WA</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                  placeholder="0812xxxx"
                  value={formInstruktur.no_telepon}
                  onChange={(e) => setFormInstruktur({...formInstruktur, no_telepon: e.target.value})}
                />
              </div>

              {/* Rekening Bank Form Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Nama Bank</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    placeholder="Contoh: BCA, Mandiri, BRI"
                    value={formInstruktur.nama_bank}
                    onChange={(e) => setFormInstruktur({...formInstruktur, nama_bank: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Nomor Rekening</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    placeholder="Contoh: 1234567890"
                    value={formInstruktur.no_rekening}
                    onChange={(e) => setFormInstruktur({...formInstruktur, no_rekening: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Alamat Lengkap</label>
                <textarea 
                  required 
                  className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all resize-none text-sm"
                  placeholder="Alamat domisili saat ini"
                  rows="3"
                  value={formInstruktur.alamat}
                  onChange={(e) => setFormInstruktur({...formInstruktur, alamat: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-4 md:pt-6 border-t border-[#e9e9e7] flex gap-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#37352f] hover:bg-[#0b6e99] disabled:opacity-50 text-white flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  {loading ? 'Memproses...' : 'Daftarkan Instruktur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
