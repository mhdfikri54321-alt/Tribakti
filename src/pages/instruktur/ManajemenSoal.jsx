import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar'; 
import Footer from '../siswa/Footer';
import { ChevronRight, Plus, Search, Trash2, Video, Edit } from 'lucide-react';

export default function ManajemenSoal() {
  const [listSoal, setListSoal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('semua'); // 'semua', 'materi', 'motorik'
  
  const [soalBaru, setSoalBaru] = useState({ 
    pertanyaan: '', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', kunci_jawaban: 'A',
    jenis_ujian: 'materi', video_url: ''
  });

  const [videoFile, setVideoFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const namaInstruktur = savedUser?.nama_lengkap || 'Instruktur';

  const fetchSoal = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bank_soal_sim')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterJenis !== 'semua') {
        query = query.eq('jenis_ujian', filterJenis);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      setListSoal(data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoal();
  }, [filterJenis]);

  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalVideoUrl = soalBaru.video_url;

      // Upload video jika ada
      if (videoFile && soalBaru.jenis_ujian === 'motorik') {
        setUploading(true);
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('soal-video')
          .upload(filePath, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('soal-video')
          .getPublicUrl(filePath);
        
        finalVideoUrl = publicUrl;
      }

      if (editingId) {
        // Update existing question
        const { error } = await supabase
          .from('bank_soal_sim')
          .update({
            pertanyaan: soalBaru.pertanyaan,
            pilihan_a: soalBaru.pilihan_a,
            pilihan_b: soalBaru.pilihan_b,
            pilihan_c: soalBaru.pilihan_c,
            pilihan_d: soalBaru.pilihan_d,
            kunci_jawaban: soalBaru.kunci_jawaban,
            jenis_ujian: soalBaru.jenis_ujian,
            video_url: finalVideoUrl
          })
          .eq('id', editingId);

        if (error) throw error;
        alert("Soal berhasil diperbarui! 📝");
      } else {
        // Insert new question
        const { error } = await supabase.from('bank_soal_sim').insert([{
          ...soalBaru,
          video_url: finalVideoUrl
        }]);

        if (error) throw error;
        alert("Soal berhasil ditambahkan ke bank soal! 📝");
      }

      // Reset form
      setSoalBaru({ pertanyaan: '', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', kunci_jawaban: 'A', jenis_ujian: 'materi', video_url: '' });
      setVideoFile(null);
      setEditingId(null);
      // Reset input file secara manual jika perlu
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      fetchSoal();
    } catch (err) {
      alert("Gagal: " + err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleHapusSoal = async (id) => {
    if (!window.confirm("Hapus soal ini?")) return;
    try {
      const { error } = await supabase.from('bank_soal_sim').delete().eq('id', id);
      if (error) throw error;
      fetchSoal();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const filteredSoal = listSoal.filter(s => 
    s.pertanyaan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="instruktur" activeMenu="ujian" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Manajemen Soal</span>
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
              <Plus className="w-3 h-3 text-[#0b6e99]" />
              Pusat Evaluasi Teori
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Manajemen <span className="text-[#0b6e99]">Soal SIM</span>
            </h2>
            <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
              Kelola database pertanyaan simulasi ujian teori untuk membantu siswa mempersiapkan tes SIM sesungguhnya.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            
            {/* Form Input Soal Baru (1/3 Layout) */}
            <div className="lg:col-span-1">
              <div className="static lg:sticky lg:top-24">
                <div className="bg-white border border-[#e9e9e7] p-6 md:p-8 rounded-2xl shadow-sm">
                  <h3 className="text-base md:text-lg font-bold text-[#37352f] tracking-tight mb-4 md:mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#0b6e99] text-white rounded-lg flex items-center justify-center text-xs">
                      {editingId ? '✎' : '+'}
                    </span>
                    {editingId ? 'Edit Soal' : 'Input Soal Baru'}
                  </h3>
                  
                  <form onSubmit={handleSimpanSoal} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Pertanyaan</label>
                      <textarea 
                        placeholder="Tulis pertanyaan simulasi..." 
                        className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-4 py-3 text-sm font-semibold text-[#37352f] outline-none focus:bg-white focus:border-[#0b6e99]/30 transition-all min-h-[120px] resize-none" 
                        value={soalBaru.pertanyaan}
                        onChange={e => setSoalBaru({...soalBaru, pertanyaan: e.target.value})} 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {['a', 'b', 'c', 'd'].map((key) => (
                        <div key={key} className="space-y-2">
                          <label className="text-[9px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Opsi {key.toUpperCase()}</label>
                          <input 
                            placeholder={`Masukkan pilihan ${key.toUpperCase()}...`} 
                            className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-4 py-3 text-xs font-semibold text-[#37352f] outline-none focus:bg-white focus:border-[#0b6e99]/30 transition-all" 
                            value={soalBaru[`pilihan_${key}`]}
                            onChange={e => setSoalBaru({...soalBaru, [`pilihan_${key}`]: e.target.value})} 
                            required 
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Jenis Ujian</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['materi', 'motorik'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setSoalBaru({...soalBaru, jenis_ujian: val});
                              if (val === 'materi') setVideoFile(null);
                            }}
                            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${soalBaru.jenis_ujian === val ? 'bg-[#0b6e99] text-white border-[#0b6e99]' : 'bg-[#fbfbfa] text-[#37352f]/60 border-[#e9e9e7] hover:border-[#0b6e99]/30'}`}
                          >
                            {val === 'materi' ? 'Teori Materi' : 'Praktik Motorik'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {soalBaru.jenis_ujian === 'motorik' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Upload Video Praktik</label>
                        {soalBaru.video_url && (
                          <div className="mb-2 p-3 bg-[#fbfbfa] rounded-xl border border-[#e9e9e7] flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#0b6e99] truncate block hover:underline">
                              <a href={soalBaru.video_url} target="_blank" rel="noreferrer">Lihat Video Saat Ini</a>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSoalBaru({ ...soalBaru, video_url: '' })}
                              className="text-[10px] font-bold uppercase text-red-600 hover:text-red-800 transition-colors"
                            >
                              Hapus Video
                            </button>
                          </div>
                        )}
                        <div className="relative group">
                          <input 
                            type="file" 
                            accept="video/*"
                            onChange={(e) => setVideoFile(e.target.files[0])}
                            className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-4 py-3 text-xs font-semibold text-[#37352f] outline-none focus:bg-white focus:border-[#0b6e99]/30 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-[#efefed] file:text-[#0b6e99] hover:file:bg-[#e9e9e7]"
                          />
                        </div>
                        <p className="text-[9px] text-[#37352f]/40 ml-1 italic">*Video akan disimpan di folder storage soal-video</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Kunci Jawaban</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['A', 'B', 'C', 'D'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSoalBaru({...soalBaru, kunci_jawaban: val})}
                            className={`py-3 rounded-xl text-xs font-bold transition-all border ${soalBaru.kunci_jawaban === val ? 'bg-[#0b6e99] text-white border-[#0b6e99]' : 'bg-[#fbfbfa] text-[#37352f]/60 border-[#e9e9e7] hover:border-[#0b6e99]/30'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={editingId ? "flex gap-3" : ""}>
                      {editingId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setSoalBaru({ pertanyaan: '', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', kunci_jawaban: 'A', jenis_ujian: 'materi', video_url: '' });
                            setVideoFile(null);
                            const fileInput = document.querySelector('input[type="file"]');
                            if (fileInput) fileInput.value = '';
                          }}
                          className="flex-1 bg-[#efefed] hover:bg-[#e9e9e7] text-[#37352f]/60 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
                        >
                          Batal
                        </button>
                      )}
                      <button 
                        type="submit" 
                        disabled={submitting || uploading}
                        className={`${editingId ? 'flex-1' : 'w-full'} bg-[#37352f] hover:bg-[#0b6e99] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all`}
                      >
                        {uploading ? 'Mengunggah Video...' : (submitting ? 'Memproses...' : (editingId ? 'Update' : 'Simpan'))}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Daftar Soal (2/3 Layout) */}
            <div className="lg:col-span-2">
              <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#37352f]">Soal Ujian SIM</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-[#0b6e99] rounded-full"></span>
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Total {filteredSoal.length} Soal (Maks 10)</span>
                  </div>
                </div>

                {/* Filter & Search Wrapper */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                  {/* Filter Jenis Ujian */}
                  <div className="flex bg-white p-1 rounded-xl border border-[#e9e9e7] items-center h-[46px] sm:h-[50px] shrink-0">
                    {[
                      { id: 'semua', label: 'Semua' },
                      { id: 'materi', label: 'Materi' },
                      { id: 'motorik', label: 'Motorik' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setFilterJenis(item.id)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all ${
                          filterJenis === item.id 
                            ? 'bg-[#efefed] text-[#37352f]' 
                            : 'text-[#37352f]/40 hover:text-[#37352f]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-80 group">
                    <input 
                      type="text" 
                      placeholder="Cari pertanyaan..." 
                      className="w-full bg-white border border-[#e9e9e7] rounded-xl pl-5 pr-10 py-3 text-xs font-semibold text-[#37352f] outline-none transition-all focus:bg-white focus:border-[#0b6e99]/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {filteredSoal.length > 0 ? (
                  filteredSoal.map((s, index) => (
                    <div key={s.id} className="bg-white border border-[#e9e9e7] p-6 md:p-8 rounded-2xl hover:border-[#0b6e99]/30 transition-all shadow-sm">
                      <div className="flex justify-between items-start mb-4 md:mb-6 gap-4">
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          <span className="px-3 md:px-4 py-1.5 md:py-2 bg-[#37352f] text-white rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
                            Soal #{index + 1}
                          </span>
                          <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest border ${s.jenis_ujian === 'motorik' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-[#efefed] text-[#0b6e99] border-[#e9e9e7]'}`}>
                            {s.jenis_ujian === 'motorik' ? 'Motorik' : 'Materi'}
                          </span>
                          <span className="px-3 md:px-4 py-1.5 md:py-2 bg-amber-50 text-amber-700 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest border border-amber-100">
                            Kunci: {s.kunci_jawaban}
                          </span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingId(s.id);
                              setSoalBaru({
                                pertanyaan: s.pertanyaan || '',
                                pilihan_a: s.pilihan_a || '',
                                pilihan_b: s.pilihan_b || '',
                                pilihan_c: s.pilihan_c || '',
                                pilihan_d: s.pilihan_d || '',
                                kunci_jawaban: s.kunci_jawaban || 'A',
                                jenis_ujian: s.jenis_ujian || 'materi',
                                video_url: s.video_url || ''
                              });
                              setVideoFile(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-10 h-10 bg-white hover:bg-amber-50 text-[#37352f]/30 hover:text-amber-600 border border-[#e9e9e7] rounded-lg transition-all flex items-center justify-center"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleHapusSoal(s.id)}
                            className="w-10 h-10 bg-white hover:bg-red-50 text-[#37352f]/30 hover:text-red-600 border border-[#e9e9e7] rounded-lg transition-all flex items-center justify-center"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-base md:text-lg font-semibold text-[#37352f] mb-4 md:mb-6 leading-relaxed max-w-3xl">{s.pertanyaan}</p>
                      
                      {s.video_url && (
                        <div className="mb-6 p-4 bg-[#fbfbfa] rounded-xl border border-[#e9e9e7] flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#efefed] text-[#0b6e99] rounded-lg flex items-center justify-center">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest mb-0.5">Video Terlampir</p>
                            <a href={s.video_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0b6e99] truncate block hover:underline">
                              Lihat Video (Storage)
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'A', text: s.pilihan_a },
                          { label: 'B', text: s.pilihan_b },
                          { label: 'C', text: s.pilihan_c },
                          { label: 'D', text: s.pilihan_d }
                        ].map(opt => (
                          <div key={opt.label} className={`p-4 rounded-xl border transition-all flex items-center gap-4 ${s.kunci_jawaban === opt.label ? 'bg-[#fbfbfa] border-[#0b6e99]/30' : 'bg-white border-[#e9e9e7]'}`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${s.kunci_jawaban === opt.label ? 'bg-[#0b6e99] text-white' : 'bg-[#efefed] text-[#37352f]/40'}`}>
                              {opt.label}
                            </div>
                            <span className={`text-sm font-semibold transition-all ${s.kunci_jawaban === opt.label ? 'text-[#0b6e99]' : 'text-[#37352f]'}`}>
                              {opt.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-[#e9e9e7] py-24 text-center rounded-2xl">
                    <div className="w-24 h-24 bg-[#efefed] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#37352f]/30">
                      <Search className="w-12 h-12" />
                    </div>
                    <h4 className="text-xl font-bold text-[#37352f] mb-3">Database Kosong</h4>
                    <p className="text-[#37352f]/50 font-medium text-sm">Belum ada pertanyaan yang terdaftar di bank soal SIM.</p>
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
