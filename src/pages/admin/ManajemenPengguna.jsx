import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Calendar,
  User,
  Plus,
  Edit2,
  Trash2,
  X,
  Key,
  ChevronRight
} from 'lucide-react';

export default function ManajemenPengguna() {
  const navigate = useNavigate();
  const [semuaAkun, setSemuaAkun] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State Modal & Form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    password: '',
    role: 'siswa',
    nik: ''
  });

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchSemuaAkun();
  }, []);

  const fetchSemuaAkun = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('akun_pengguna')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSemuaAkun(data || []);
    } catch (err) {
      console.error("Gagal memuat akun:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI CRUD ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ nama_lengkap: '', username: '', password: '', role: 'siswa', nik: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (akun) => {
    setIsEditing(true);
    setSelectedId(akun.id);
    setFormData({
      nama_lengkap: akun.nama_lengkap || '',
      username: akun.username || '',
      password: akun.password || '',
      role: akun.role || 'siswa',
      nik: akun.nik || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        nik: formData.nik
      };

      if (isEditing) {
        const { error } = await supabase
          .from('akun_pengguna')
          .update(payload)
          .eq('id', selectedId);
        if (error) throw error;
        alert("Akun berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from('akun_pengguna')
          .insert([payload]);
        if (error) throw error;
        alert("Akun baru berhasil dibuat!");
      }

      setShowModal(false);
      fetchSemuaAkun();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.")) return;
    
    try {
      const { error } = await supabase
        .from('akun_pengguna')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert("Akun telah dihapus!");
      fetchSemuaAkun();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Filter Data berdasarkan pencarian
  const filteredAkun = semuaAkun.filter((akun) => {
    const searchTerm = search.toLowerCase();
    return (
      (akun.nama_lengkap || '').toLowerCase().includes(searchTerm) ||
      (akun.username || '').toLowerCase().includes(searchTerm) ||
      (akun.nik || '').toLowerCase().includes(searchTerm) ||
      (akun.role || '').toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar role="admin" activeMenu="pengguna" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Manajemen Pengguna</span>
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
              Keamanan & Akses
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Master Data <span className="text-[#37352f]/40">Akun.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Kelola kredensial, role, dan pantau seluruh entitas pengguna yang memiliki akses ke dalam sistem Tri Bakti.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="bg-white px-5 py-3 rounded-2xl border border-[#e9e9e7] flex items-center gap-4 shrink-0 shadow-sm justify-between sm:justify-start">
                  <div className="text-right border-r border-[#e9e9e7] pr-4">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Total Entitas</p>
                    <p className="text-sm font-bold text-[#37352f] leading-none">{semuaAkun.length} Akun</p>
                  </div>
                  <div className="w-10 h-10 bg-[#0b6e99]/10 text-[#0b6e99] rounded-xl flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <button 
                  onClick={handleOpenAdd}
                  className="bg-[#37352f] hover:bg-[#0b6e99] text-white px-6 py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 justify-center shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" /> Tambah Akun Baru
                </button>
              </div>
            </div>
          </div>

          <AdminTabSwitcher group="pengguna" activeTab="akun" />

          <div className="mb-8">
            <div className="w-full md:w-96 relative group">
              <input 
                type="text" 
                placeholder="Cari nama atau username..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors">
                <Search className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Identitas Pengguna</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Kontak & Akses</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Hak Akses</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Aksi Manajemen</th>
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
                  ) : filteredAkun.length > 0 ? (
                    filteredAkun.map((akun) => (
                      <tr key={akun.id} className="hover:bg-[#fbfbfa] transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#efefed] rounded-xl flex items-center justify-center text-[#37352f]/40 hover:bg-[#0b6e99]/10 hover:text-[#0b6e99] transition-colors border border-[#e9e9e7]">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-[#37352f] text-base md:text-lg hover:text-[#0b6e99] transition-colors">{akun.nama_lengkap || 'Tanpa Nama'}</div>
                              <div className="text-[10px] text-[#37352f]/40 font-bold uppercase tracking-widest mt-1">
                                UID: {akun.id ? String(akun.id).slice(0, 8) : '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2 text-sm font-bold text-[#37352f]">
                            <User className="w-3.5 h-3.5 text-[#37352f]/30" />
                            {akun.username || '-'}
                          </div>
                          <div className="text-[10px] font-bold text-[#37352f]/40 mt-1 uppercase flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Sejak {new Date(akun.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase border ${
                            akun.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            akun.role === 'instruktur' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {akun.role}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleOpenEdit(akun)}
                              className="p-3 bg-[#efefed] hover:bg-[#0b6e99] hover:text-white text-[#37352f]/40 rounded-xl transition-all border border-[#e9e9e7]"
                              title="Edit Akun"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(akun.id)}
                              className="p-3 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl transition-all border border-rose-100"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-20 text-center text-[#37352f]/40 font-medium italic">
                        Tidak ada data akun yang ditemukan.
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

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div className="absolute inset-0 bg-[#37352f]/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="p-5 md:p-8 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1 block">Sistem Kredensial</span>
                <h3 className="text-xl md:text-3xl font-bold text-[#37352f] tracking-tight">
                  {isEditing ? 'Edit Informasi Akun' : 'Buat Akun Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-[#37352f]/40 hover:text-rose-500 transition-all border border-[#e9e9e7]"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 md:p-8 overflow-y-auto flex-1 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Nama Lengkap Pengguna</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      required 
                      className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                      placeholder="Contoh: Budi Santoso"
                      value={formData.nama_lengkap}
                      onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">NIK (16 digit NIK)</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                      placeholder="16 digit NIK"
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                    />
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Username Pengguna</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      required 
                      className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                      placeholder="Masukkan username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Hak Akses (Role)</label>
                  <select 
                    className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="siswa">Siswa</option>
                    <option value="instruktur">Instruktur</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Kata Sandi (Password)</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                </div>
                <p className="text-[9px] text-[#37352f]/40 font-medium italic">*Pastikan password dicatat atau diinformasikan kepada pengguna terkait.</p>
              </div>
              
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-[#37352f] hover:bg-[#0b6e99] disabled:opacity-50 text-white w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                {submitting ? 'Memproses Data...' : (isEditing ? 'Simpan Perubahan Akun' : 'Aktifkan Akun Baru')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
