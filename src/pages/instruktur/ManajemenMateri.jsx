import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar'; 
import Footer from '../siswa/Footer'; 
import { ChevronRight, Search, BookOpen, Trash2 } from 'lucide-react';

export default function ManajemenMateri() {
  const [listMateri, setListMateri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // State form
  const [newMateri, setNewMateri] = useState({ judul: '', kategori: '', deskripsi: '', link_youtube: '' });
  const [fileFoto, setFileFoto] = useState(null);

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const namaInstruktur = savedUser?.nama_lengkap || 'Instruktur';

  useEffect(() => {
    fetchMateri();
  }, []);

  const fetchMateri = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materi_pembelajaran')
        .select(`*, akun_pengguna (nama_lengkap)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListMateri(data || []);
    } catch (err) {
      console.error("Error memuat materi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMateri = async (e) => {
    e.preventDefault();
    if (!fileFoto) return alert("Pilih foto cover terlebih dahulu!");
    setSubmitting(true);
    
    try {
      // 1. Upload file ke Storage
      const fileExt = fileFoto.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('materi_covers')
        .upload(fileName, fileFoto);

      if (uploadError) throw uploadError;

      // 2. Ambil URL Publik
      const { data: urlData } = supabase.storage
        .from('materi_covers')
        .getPublicUrl(fileName);

      // 3. Simpan ke Database
      const { error } = await supabase.from('materi_pembelajaran').insert([{
        ...newMateri,
        akun_id: savedUser?.id,
        thumbnail_url: urlData.publicUrl 
      }]);

      if (error) throw error;
      
      alert("Materi berhasil disimpan! 📚");
      setNewMateri({ judul: '', kategori: '', deskripsi: '', link_youtube: '' });
      setFileFoto(null);
      fetchMateri();
    } catch (err) {
      alert("Gagal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHapusMateri = async (id, fileName) => {
    if (!window.confirm("Hapus materi ini?")) return;
    try {
      const { error } = await supabase.from('materi_pembelajaran').delete().eq('id', id);
      if (error) throw error;
      fetchMateri();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const filteredMateri = listMateri.filter((item) =>
    item.judul?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="instruktur" activeMenu="materi" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Manajemen Materi</span>
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
              <BookOpen className="w-3 h-3 text-[#0b6e99]" />
              Konten Edukasi
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Manajemen <span className="text-[#0b6e99]">Materi</span>
            </h2>
            <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
              Kelola kurikulum, panduan video, dan modul pembelajaran untuk mendukung progres belajar siswa Tri Bakti.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
            
            {/* Form Input Materi Baru (Split Layout 1/3) */}
            <div className="lg:col-span-1">
              <div className="static lg:sticky lg:top-24">
                <div className="bg-white border border-[#e9e9e7] p-6 md:p-8 rounded-2xl shadow-sm">
                  <h3 className="text-base md:text-lg font-bold text-[#37352f] tracking-tight mb-4 md:mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#0b6e99] text-white rounded-lg flex items-center justify-center text-xs">+</span>
                    Modul Baru
                  </h3>
                  
                  <form onSubmit={handleAddMateri} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Judul Materi</label>
                      <input 
                        placeholder="Masukkan judul materi..." 
                        className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-5 py-3 text-sm font-semibold text-[#37352f] outline-none focus:bg-white focus:border-[#0b6e99]/30 transition-all" 
                        value={newMateri.judul}
                        onChange={e => setNewMateri({...newMateri, judul: e.target.value})} 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Kategori</label>
                      <input 
                        placeholder="Contoh: Teknik Dasar, Parkir..." 
                        className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-5 py-3 text-sm font-semibold text-[#37352f] outline-none focus:bg-white focus:border-[#0b6e99]/30 transition-all" 
                        value={newMateri.kategori}
                        onChange={e => setNewMateri({...newMateri, kategori: e.target.value})} 
                        required 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Foto Cover</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => setFileFoto(e.target.files[0])} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          required={!fileFoto}
                        />
                        <div className="w-full bg-[#efefed] border-2 border-dashed border-[#e9e9e7] rounded-xl p-6 text-center group-hover:border-[#0b6e99]/30 group-hover:bg-[#fbfbfa] transition-all">
                          <p className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest truncate">
                            {fileFoto ? fileFoto.name : 'Upload Thumbnail'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Deskripsi</label>
                      <textarea 
                        placeholder="Jelaskan isi materi..." 
                        className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-5 py-3 text-sm font-semibold text-[#37352f] outline-none focus:bg-white focus:border-[#0b6e99]/30 transition-all min-h-[100px] resize-none" 
                        value={newMateri.deskripsi}
                        onChange={e => setNewMateri({...newMateri, deskripsi: e.target.value})}
                      ></textarea>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Link YouTube (Opsional)</label>
                      <input 
                        placeholder="https://youtube.com/..." 
                        className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-5 py-3 text-sm font-semibold text-[#37352f] outline-none focus:bg-white focus:border-[#0b6e99]/30 transition-all" 
                        value={newMateri.link_youtube}
                        onChange={e => setNewMateri({...newMateri, link_youtube: e.target.value})} 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-[#37352f] hover:bg-[#0b6e99] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
                    >
                      {submitting ? 'Menyimpan...' : 'Terbitkan Materi ✓'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Daftar Materi (Split Layout 2/3) */}
            <div className="lg:col-span-2">
              <div className="mb-6 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#37352f]">Katalog Materi</h2>
                <div className="relative w-full sm:w-80">
                  <input 
                    type="text" 
                    placeholder="Cari judul materi..." 
                    className="w-full bg-white border border-[#e9e9e7] rounded-xl px-5 py-3 text-xs font-semibold text-[#37352f] outline-none transition-all focus:border-[#0b6e99]/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#37352f]/30 w-4 h-4" />
                </div>
              </div>

              <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
                {filteredMateri.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fbfbfa]">
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Preview</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Judul & Kategori</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Kontributor</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9e9e7]">
                        {filteredMateri.map((item) => (
                          <tr key={item.id} className="hover:bg-[#fbfbfa] transition-colors">
                            <td className="p-6">
                              <div className="w-20 h-14 rounded-xl overflow-hidden border border-[#e9e9e7] bg-[#efefed]">
                                <img src={item.thumbnail_url} alt="cover" className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="font-semibold text-[#37352f] text-sm mb-1">{item.judul}</div>
                              <span className="px-2 py-0.5 bg-[#efefed] text-[#0b6e99] rounded text-[9px] font-bold tracking-widest uppercase border border-[#e9e9e7]">
                                {item.kategori || 'Modul'}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="text-sm font-semibold text-[#37352f]">{item.akun_pengguna?.nama_lengkap || '-'}</div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Instruktur</div>
                            </td>
                            <td className="p-6 text-center">
                              <button 
                                onClick={() => handleHapusMateri(item.id)}
                                className="w-10 h-10 rounded-xl bg-[#fbfbfa] hover:bg-red-50 text-[#37352f]/30 hover:text-red-600 transition-all flex items-center justify-center mx-auto border border-[#e9e9e7]"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <div className="w-20 h-20 bg-[#efefed] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#37352f]/30">
                      <BookOpen className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-bold text-[#37352f] mb-2">Belum ada materi</h4>
                    <p className="text-[#37352f]/50 font-medium">Gunakan form di samping untuk menerbitkan modul pertama Anda.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
