import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Activity,
  X,
  Edit2,
  Trash2,
  ChevronRight
} from 'lucide-react';

export default function AdminManajemenMateri() {
  const navigate = useNavigate();
  const [listMateri, setListMateri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [formMateri, setFormMateri] = useState({ 
    materi: '', 
    deskripsi_materi: '', 
    pertemuan_ke: 0 
  });

  useEffect(() => {
    fetchMateri();
  }, []);

  const fetchMateri = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kurikulum')
      .select('*')
      .order('pertemuan_ke', { ascending: true }); 

    if (error) {
      console.error("DEBUG ERROR:", error);
      alert(`Gagal memuat materi: ${error.message}`);
    } else {
      setListMateri(data || []);
    }
    setLoading(false);
  };

  const openEditModal = (m) => {
    setEditId(m.id);
    setFormMateri({ 
        materi: m.materi, 
        deskripsi_materi: m.deskripsi_materi, 
        pertemuan_ke: m.pertemuan_ke 
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let error;

    if (editId) {
      const { error: updateError } = await supabase
        .from('kurikulum')
        .update(formMateri)
        .eq('id', editId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('kurikulum')
        .insert([formMateri]);
      error = insertError;
    }
    
    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      alert("Materi berhasil disimpan!");
      setShowModal(false);
      setEditId(null);
      setFormMateri({ materi: '', deskripsi_materi: '', pertemuan_ke: 0 });
      fetchMateri();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus materi ini?")) {
      await supabase.from('kurikulum').delete().eq('id', id);
      fetchMateri();
    }
  };

  const filteredData = listMateri.filter(m => 
    m.materi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar activeMenu="manajemen-materi" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Manajemen Materi</span>
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

        <main className="px-4 md:px-8 py-6 md:py-12 flex-1 overflow-y-auto">
          {/* Hero Section */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Activity className="w-3 h-3 text-[#0b6e99]" />
              Master Kurikulum
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Modul <span className="text-[#37352f]/40">Pembelajaran.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/60 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
                Kelola materi pelatihan mengemudi, urutan pertemuan, dan standar kompetensi yang harus dicapai oleh setiap siswa Tri Bakti.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="bg-white px-5 py-3 rounded-2xl border border-[#e9e9e7] flex items-center gap-4 shrink-0 shadow-sm justify-between sm:justify-start">
                  <div className="text-right border-r border-[#e9e9e7] pr-4">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Total Modul</p>
                    <p className="text-sm font-bold text-[#37352f] leading-none">{listMateri.length} Materi</p>
                  </div>
                  <div className="w-10 h-10 bg-[#0b6e99]/10 text-[#0b6e99] rounded-xl flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
                <button 
                  onClick={() => { setEditId(null); setFormMateri({ materi: '', deskripsi_materi: '', pertemuan_ke: 0 }); setShowModal(true); }}
                  className="bg-[#37352f] hover:bg-[#0b6e99] text-white px-6 py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 justify-center shadow-sm shrink-0"
                >
                  <Plus className="w-4 h-4" /> Tambah Materi
                </button>
              </div>
            </div>
          </div>

          <AdminTabSwitcher group="kurikulum" activeTab="kurikulum" />

          {/* Search Bar */}
          <div className="mb-8">
            <div className="w-full md:w-96 relative group">
              <input 
                type="text" 
                placeholder="Cari judul materi..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
            </div>
          </div>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Pertemuan</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Judul Materi</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Deskripsi Ringkas</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Menyusun Modul...</p>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((m) => (
                      <tr key={m.id} className="hover:bg-[#fbfbfa] transition-colors group">
                        <td className="p-6">
                          <div className="w-10 h-10 bg-[#efefed] rounded-xl flex items-center justify-center font-bold text-[#37352f]/40 group-hover:bg-[#0b6e99] group-hover:text-white transition-all border border-[#e9e9e7]">
                            {m.pertemuan_ke}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="font-bold text-[#37352f] text-lg tracking-tight group-hover:text-[#0b6e99] transition-colors">
                            {m.materi}
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="text-sm text-[#37352f]/60 leading-relaxed line-clamp-2 max-w-md">
                            {m.deskripsi_materi}
                          </p>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => openEditModal(m)}
                              className="p-3 bg-[#efefed] hover:bg-[#0b6e99] hover:text-white text-[#37352f]/40 rounded-xl transition-all border border-[#e9e9e7]"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id)}
                              className="p-3 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl transition-all border border-rose-100"
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
                        Belum ada modul pembelajaran yang dibuat.
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

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div className="absolute inset-0 bg-[#37352f]/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="p-5 md:p-8 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1 block">Editor Kurikulum</span>
                <h3 className="text-xl md:text-3xl font-bold text-[#37352f] tracking-tight">
                  {editId ? 'Edit Materi' : 'Tambah Materi Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-[#37352f]/40 hover:text-rose-500 transition-all border border-[#e9e9e7]"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 md:p-8 overflow-y-auto flex-1 space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Judul Materi</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                  placeholder="Contoh: Teknik Perpindahan Gigi"
                  value={formMateri.materi}
                  onChange={e => setFormMateri({...formMateri, materi: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Urutan Pertemuan (Pertemuan Ke-)</label>
                <input 
                  type="number" 
                  required 
                  className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
                  placeholder="1, 2, 3..."
                  value={formMateri.pertemuan_ke}
                  onChange={e => setFormMateri({...formMateri, pertemuan_ke: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Deskripsi Lengkap Materi</label>
                <textarea 
                  required 
                  className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all resize-none text-sm"
                  placeholder="Jelaskan apa saja yang akan dipelajari..."
                  rows="3"
                  value={formMateri.deskripsi_materi}
                  onChange={e => setFormMateri({...formMateri, deskripsi_materi: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-4 md:pt-6 border-t border-[#e9e9e7]">
                <button 
                  type="submit" 
                  className="bg-[#37352f] hover:bg-[#0b6e99] text-white w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  {editId ? 'Simpan Perubahan' : 'Tambahkan ke Kurikulum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
