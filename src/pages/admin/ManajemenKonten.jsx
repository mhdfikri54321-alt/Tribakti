import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import { 
  ShieldCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  FileText, 
  Package, 
  Calendar, 
  Type, 
  Image as ImageIcon, 
  CreditCard, 
  Tag, 
  Layers, 
  ListChecks, 
  Info, 
  LayoutGrid, 
  HelpCircle, 
  Star, 
  MessageSquare, 
  User, 
  Camera,
  ChevronRight
} from 'lucide-react';

export default function ManajemenKonten() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('faq');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  // Data States
  const [faqs, setFaqs] = useState([]);
  const [artikels, setArtikels] = useState([]);
  const [packages, setPackages] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [dokumentasi, setDokumentasi] = useState([]);

  // Artikel Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Form Data States
  const [faqForm, setFaqForm] = useState({ tanya: '', jawab: '' });
  const [dokumentasiForm, setDokumentasiForm] = useState({ gambar_url: '', caption: '' });
  const [artikelForm, setArtikelForm] = useState({
    judul: '',
    tanggal: new Date().toISOString().split('T')[0],
    gambar_url: '',
    excerpt: '',
    full_text: ''
  });
  const [paketForm, setPaketForm] = useState({
    name: '',
    price: '',
    label: '',
    session_count: '',
    description: '',
    features: ''
  });
  const [ratingForm, setRatingForm] = useState({
    nama_siswa: '',
    paket_siswa: '',
    skor: 5,
    ulasan: ''
  });

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [faqRes, artikelRes, paketRes, ratingRes, dokRes] = await Promise.all([
        supabase.from('faq').select('*').order('created_at', { ascending: false }),
        supabase.from('artikel').select('*').order('created_at', { ascending: false }),
        supabase.from('packages').select('*').order('price', { ascending: true }),
        supabase.from('ratings').select('*').order('created_at', { ascending: false }),
        supabase.from('dokumentasi').select('*').order('created_at', { ascending: false })
      ]);

      if (faqRes.error) throw faqRes.error;
      if (artikelRes.error) throw artikelRes.error;
      if (paketRes.error) throw paketRes.error;
      if (ratingRes.error) throw ratingRes.error;
      if (dokRes.error) {
        // Jika tabel belum ada, jangan hentikan proses lain
        console.warn("Tabel dokumentasi mungkin belum dibuat:", dokRes.error.message);
      }

      setFaqs(faqRes.data || []);
      setArtikels(artikelRes.data || []);
      setPackages(paketRes.data || []);
      setRatings(ratingRes.data || []);
      setDokumentasi(dokRes.data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    if (activeTab === 'faq') setFaqForm({ tanya: '', jawab: '' });
    if (activeTab === 'artikel') {
      setArtikelForm({
        judul: '',
        tanggal: new Date().toISOString().split('T')[0],
        gambar_url: '',
        excerpt: '',
        full_text: ''
      });
      setSelectedFile(null);
      setPreviewUrl('');
    }
    if (activeTab === 'paket') setPaketForm({
      name: '',
      price: '',
      label: '',
      session_count: '',
      description: '',
      features: ''
    });
    if (activeTab === 'rating') setRatingForm({
      nama_siswa: '',
      paket_siswa: '',
      skor: 5,
      ulasan: ''
    });
    if (activeTab === 'dokumentasi') {
      setDokumentasiForm({ gambar_url: '', caption: '' });
      setSelectedFile(null);
      setPreviewUrl('');
    }
    setShowModal(true);
  };

  const handleOpenEdit = (data) => {
    setIsEditing(true);
    setSelectedId(data.id);
    if (activeTab === 'faq') setFaqForm({ tanya: data.tanya, jawab: data.jawab });
    if (activeTab === 'artikel') {
      setArtikelForm({
        judul: data.judul,
        tanggal: data.tanggal,
        gambar_url: data.gambar_url,
        excerpt: data.excerpt,
        full_text: data.full_text
      });
      setPreviewUrl(data.gambar_url);
    }
    if (activeTab === 'paket') setPaketForm({
      name: data.name,
      price: data.price,
      label: data.label || '',
      session_count: data.session_count || '',
      description: data.description || '',
      features: Array.isArray(data.features) ? data.features.join(', ') : (data.features || '')
    });
    if (activeTab === 'rating') setRatingForm({
      nama_siswa: data.nama_siswa,
      paket_siswa: data.paket_siswa,
      skor: data.skor,
      ulasan: data.ulasan
    });
    if (activeTab === 'dokumentasi') {
      setDokumentasiForm({ gambar_url: data.gambar_url, caption: data.caption });
      setPreviewUrl(data.gambar_url);
    }
    setShowModal(true);
  };

  const uploadImage = async (file, folder = 'artikel') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeTab === 'faq') {
        const payload = { tanya: faqForm.tanya, jawab: faqForm.jawab };
        if (isEditing) {
          await supabase.from('faq').update(payload).eq('id', selectedId);
        } else {
          await supabase.from('faq').insert([{ ...payload, created_by: savedUser.id }]);
        }
      } else if (activeTab === 'artikel') {
        let finalImageUrl = artikelForm.gambar_url;
        if (selectedFile) finalImageUrl = await uploadImage(selectedFile, 'artikel');
        const payload = {
          judul: artikelForm.judul,
          tanggal: artikelForm.tanggal,
          gambar_url: finalImageUrl,
          excerpt: artikelForm.excerpt,
          full_text: artikelForm.full_text
        };
        if (isEditing) {
          await supabase.from('artikel').update(payload).eq('id', selectedId);
        } else {
          await supabase.from('artikel').insert([{ ...payload, created_by: savedUser.id }]);
        }
      } else if (activeTab === 'paket') {
        const featuresArray = paketForm.features.split(',').map(f => f.trim()).filter(f => f !== '');
        const payload = {
          name: paketForm.name,
          price: parseFloat(paketForm.price),
          label: paketForm.label,
          session_count: paketForm.session_count,
          description: paketForm.description,
          features: featuresArray
        };
        if (isEditing) {
          await supabase.from('packages').update(payload).eq('id', selectedId);
        } else {
          await supabase.from('packages').insert([payload]);
        }
      } else if (activeTab === 'rating') {
        const payload = {
          nama_siswa: ratingForm.nama_siswa,
          paket_siswa: ratingForm.paket_siswa,
          skor: parseInt(ratingForm.skor),
          ulasan: ratingForm.ulasan
        };
        if (isEditing) {
          await supabase.from('ratings').update(payload).eq('id', selectedId);
        } else {
          await supabase.from('ratings').insert([payload]);
        }
      } else if (activeTab === 'dokumentasi') {
        let finalImageUrl = dokumentasiForm.gambar_url;
        if (selectedFile) finalImageUrl = await uploadImage(selectedFile, 'dokumentasi');
        const payload = {
          gambar_url: finalImageUrl,
          caption: dokumentasiForm.caption
        };
        if (isEditing) {
          await supabase.from('dokumentasi').update(payload).eq('id', selectedId);
        } else {
          await supabase.from('dokumentasi').insert([payload]);
        }
      }
      alert("Data berhasil disimpan!");
      setShowModal(false);
      fetchAllData();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const table = 
        activeTab === 'faq' ? 'faq' : 
        activeTab === 'artikel' ? 'artikel' : 
        activeTab === 'paket' ? 'packages' : 
        activeTab === 'rating' ? 'ratings' : 'dokumentasi';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      alert("Data berhasil dihapus!");
      fetchAllData();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const tabs = [
    { id: 'faq', label: 'FAQ', icon: HelpCircle, color: 'text-[#0b6e99]', bg: 'bg-[#0b6e99]/10' },
    { id: 'artikel', label: 'Artikel', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'paket', label: 'Paket Kursus', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'rating', label: 'Rating & Testimoni', icon: Star, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'dokumentasi', label: 'Dokumentasi', icon: Camera, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar role="admin" activeMenu="konten" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Manajemen Konten</span>
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
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <LayoutGrid className="w-3 h-3 text-[#0b6e99]" />
              Content Hub
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Manajemen <span className="text-[#37352f]/40">Konten Publik.</span>
            </h2>
            
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mt-6 md:mt-8 bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-[#e9e9e7] w-full sm:w-fit overflow-x-auto select-none no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest transition-all shrink-0 ${
                    activeTab === tab.id 
                      ? `${tab.bg} ${tab.color}` 
                      : 'text-[#37352f]/40 hover:text-[#37352f] hover:bg-[#efefed]'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === tab.id ? '' : 'text-[#37352f]/30'}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <AdminTabSwitcher group="kurikulum" activeTab="konten" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-[#37352f] tracking-tight">
                Daftar {tabs.find(t => t.id === activeTab).label}
              </h3>
              <p className="text-[#37352f]/40 text-xs md:text-sm font-medium mt-1">Kelola data {activeTab} yang tampil pada Landing Page.</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="bg-[#37352f] hover:bg-[#0b6e99] text-white px-6 py-3.5 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 justify-center w-full sm:w-auto shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tambah {activeTab.toUpperCase()} Baru
            </button>
          </div>

          {loading ? (
            <div className="p-20 text-center bg-white border border-[#e9e9e7] rounded-2xl">
              <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Menyingkronkan Data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'faq' && (
                <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Pertanyaan & Jawaban</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9e9e7]">
                        {faqs.map((faq) => (
                          <tr key={faq.id} className="hover:bg-[#fbfbfa] transition-colors">
                            <td className="p-6 max-w-2xl">
                              <div className="font-bold text-[#37352f] mb-2 hover:text-[#0b6e99] transition-colors text-base md:text-lg">{faq.tanya}</div>
                              <div className="text-sm text-[#37352f]/60 leading-relaxed line-clamp-2">{faq.jawab}</div>
                            </td>
                            <td className="p-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleOpenEdit(faq)} className="p-3 bg-[#efefed] hover:bg-[#0b6e99] hover:text-white text-[#37352f]/40 rounded-xl transition-all border border-[#e9e9e7]"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(faq.id)} className="p-3 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl transition-all border border-rose-100"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'artikel' && (
                <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Info Artikel</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Excerpt</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9e9e7]">
                        {artikels.map((artikel) => (
                          <tr key={artikel.id} className="hover:bg-[#fbfbfa] transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-12 bg-[#efefed] rounded-lg overflow-hidden shrink-0 border border-[#e9e9e7]">
                                  {artikel.gambar_url && <img src={artikel.gambar_url} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                  <div className="font-bold text-[#37352f] text-base md:text-lg hover:text-[#0b6e99] transition-colors">{artikel.judul}</div>
                                  <div className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {new Date(artikel.tanggal).toLocaleDateString('id-ID')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-sm text-[#37352f]/60 max-w-md line-clamp-2">{artikel.excerpt}</td>
                            <td className="p-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleOpenEdit(artikel)} className="p-3 bg-[#efefed] hover:bg-[#0b6e99] hover:text-white text-[#37352f]/40 rounded-xl transition-all border border-[#e9e9e7]"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(artikel.id)} className="p-3 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl transition-all border border-rose-100"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'paket' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => (
                        <div key={pkg.id} className="bg-white border border-[#e9e9e7] p-5 sm:p-8 rounded-2xl flex flex-col hover:border-[#0b6e99]/20 transition-all">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-xl font-bold text-[#37352f] leading-tight hover:text-[#0b6e99] transition-colors">{pkg.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-3 h-3 text-[#37352f]/40" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">{pkg.session_count} Sesi</p>
                              </div>
                            </div>
                            {pkg.label && <span className="px-3 py-1 bg-[#0b6e99]/10 text-[#0b6e99] text-[8px] font-bold uppercase tracking-widest rounded-full">{pkg.label}</span>}
                          </div>
                          <div className="mb-8">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 block mb-1">Investasi</span>
                            <span className="text-2xl font-bold text-[#37352f]">Rp {pkg.price.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex-1 space-y-4 mb-8">
                            <p className="text-xs text-[#37352f]/60 font-medium italic line-clamp-2">{pkg.description}</p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {pkg.features?.slice(0, 3).map((f, i) => (
                                <span key={i} className="text-[9px] font-bold bg-[#efefed] text-[#37352f]/60 px-2 py-1 rounded-md border border-[#e9e9e7] flex items-center gap-1">
                                  <div className="w-1 h-1 bg-[#0b6e99] rounded-full"></div> {f}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="pt-6 border-t border-[#e9e9e7] flex gap-3">
                            <button onClick={() => handleOpenEdit(pkg)} className="flex-1 py-3 bg-[#efefed] hover:bg-[#0b6e99] hover:text-white text-[#37352f]/60 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all">Edit</button>
                            <button onClick={() => handleDelete(pkg.id)} className="p-3 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-400 rounded-xl transition-all border border-rose-100"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                </div>
              )}

              {activeTab === 'rating' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ratings.map((rating) => (
                    <div key={rating.id} className="bg-white border border-[#e9e9e7] p-5 sm:p-8 rounded-2xl flex flex-col hover:border-[#0b6e99]/20 transition-all relative">
                      <div className="flex gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < rating.skor ? 'text-amber-400 fill-amber-400' : 'text-[#37352f]/10'}`} />
                        ))}
                      </div>
                      <div className="flex-1 mb-8">
                        <p className="text-sm text-[#37352f]/60 italic leading-relaxed line-clamp-4">"{rating.ulasan}"</p>
                      </div>
                      <div className="flex items-center gap-4 pt-6 border-t border-[#e9e9e7]">
                        <div className="w-10 h-10 bg-[#efefed] rounded-xl flex items-center justify-center text-[#37352f]/40 font-bold">
                          {rating.nama_siswa?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#37352f] tracking-tight">{rating.nama_siswa}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">{rating.paket_siswa}</p>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2 opacity-100">
                        <button onClick={() => handleOpenEdit(rating)} className="p-2 bg-white shadow-sm border border-[#e9e9e7] rounded-lg text-[#37352f]/40 hover:text-[#0b6e99] transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(rating.id)} className="p-2 bg-white shadow-sm border border-[#e9e9e7] rounded-lg text-[#37352f]/40 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'dokumentasi' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dokumentasi.map((item) => (
                    <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-[#e9e9e7] bg-white hover:shadow-xl transition-all">
                      <img src={item.gambar_url} alt={item.caption} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-[#37352f]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 md:p-6">
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-4 line-clamp-2">{item.caption || 'Tanpa Keterangan'}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEdit(item)} className="flex-1 py-2 bg-white/20 backdrop-blur-md hover:bg-white hover:text-[#37352f] text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-500/20 backdrop-blur-md hover:bg-rose-500 text-white rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* MODAL FORM - Unified Modal with conditional forms */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
          <div className="absolute inset-0 bg-[#37352f]/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className={`bg-white w-full ${activeTab === 'artikel' ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]`}>
            <div className="p-5 md:p-8 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1 block">Editor {activeTab.toUpperCase()}</span>
                <h3 className="text-xl md:text-3xl font-bold text-[#37352f] tracking-tight">
                  {isEditing ? `Edit ${activeTab}` : `Tambah ${activeTab} Baru`}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-[#37352f]/40 hover:text-rose-500 transition-all border border-[#e9e9e7]"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 md:p-8 overflow-y-auto flex-1 space-y-4 md:space-y-6">
              {activeTab === 'faq' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Pertanyaan Umum</label>
                    <div className="relative group">
                      <input type="text" required className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" placeholder="Contoh: Apakah bisa refund?" value={faqForm.tanya} onChange={(e) => setFaqForm({...faqForm, tanya: e.target.value})} />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Jawaban Lengkap</label>
                    <textarea required rows="3" className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all resize-none text-sm" placeholder="Tuliskan jawaban lengkap di sini..." value={faqForm.jawab} onChange={(e) => setFaqForm({...faqForm, jawab: e.target.value})}></textarea>
                  </div>
                </>
              )}

              {activeTab === 'artikel' && (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Judul Artikel</label>
                      <div className="relative group">
                        <input type="text" required className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" placeholder="Judul..." value={artikelForm.judul} onChange={(e) => setArtikelForm({...artikelForm, judul: e.target.value})} />
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Tanggal</label>
                      <input type="date" required className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" value={artikelForm.tanggal} onChange={(e) => setArtikelForm({...artikelForm, tanggal: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Gambar Cover</label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                      <div className="w-full aspect-video bg-[#efefed] rounded-2xl border-2 border-dashed border-[#e9e9e7] overflow-hidden flex items-center justify-center relative group">
                        {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-[#37352f]/20" />}
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                        }} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <div className="text-xs text-[#37352f]/40 italic">Disarankan 16:9 (Landscape)</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Excerpt</label>
                    <textarea required rows="2" className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all resize-none text-sm" value={artikelForm.excerpt} onChange={(e) => setArtikelForm({...artikelForm, excerpt: e.target.value})}></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Full Content</label>
                    <textarea required rows="6" className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all resize-none text-sm" value={artikelForm.full_text} onChange={(e) => setArtikelForm({...artikelForm, full_text: e.target.value})}></textarea>
                  </div>
                </div>
              )}

              {activeTab === 'paket' && (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Nama Paket</label>
                      <input type="text" required className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" value={paketForm.name} onChange={(e) => setPaketForm({...paketForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Harga</label>
                      <input type="number" required className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" value={paketForm.price} onChange={(e) => setPaketForm({...paketForm, price: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Label</label>
                      <input type="text" className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" value={paketForm.label} onChange={(e) => setPaketForm({...paketForm, label: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Sesi</label>
                      <input type="text" required className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" value={paketForm.session_count} onChange={(e) => setPaketForm({...paketForm, session_count: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Fitur (Pisahkan dengan koma)</label>
                    <textarea required rows="3" className="w-full px-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all resize-none text-sm" value={paketForm.features} onChange={(e) => setPaketForm({...paketForm, features: e.target.value})}></textarea>
                  </div>
                </div>
              )}

              {activeTab === 'rating' && (
                <div className="space-y-4 md:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Nama Siswa</label>
                      <div className="relative group">
                        <input type="text" required className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" placeholder="Contoh: Andi Pratama" value={ratingForm.nama_siswa} onChange={(e) => setRatingForm({...ratingForm, nama_siswa: e.target.value})} />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Paket yang Diambil</label>
                      <div className="relative group">
                        <input type="text" required className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" placeholder="Contoh: Paket Mahir" value={ratingForm.paket_siswa} onChange={(e) => setRatingForm({...ratingForm, paket_siswa: e.target.value})} />
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Skor Rating (1-5 Bintang)</label>
                    <div className="flex gap-2 bg-[#efefed] p-3 rounded-xl border border-[#e9e9e7] w-fit">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRatingForm({...ratingForm, skor: num})}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${ratingForm.skor >= num ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-white text-[#37352f]/10 border border-[#e9e9e7]'}`}
                        >
                          <Star className={`w-4 h-4 md:w-5 md:h-5 ${ratingForm.skor >= num ? 'fill-white' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Isi Ulasan / Testimoni</label>
                    <div className="relative group">
                      <textarea required rows="3" className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all resize-none text-sm" placeholder="Tuliskan ulasan siswa di sini..." value={ratingForm.ulasan} onChange={(e) => setRatingForm({...ratingForm, ulasan: e.target.value})}></textarea>
                      <MessageSquare className="absolute left-4 top-6 w-5 h-5 text-[#37352f]/30" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dokumentasi' && (
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Foto Dokumentasi</label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                      <div className="w-full aspect-video bg-[#efefed] rounded-2xl border-2 border-dashed border-[#e9e9e7] overflow-hidden flex items-center justify-center relative group">
                        {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-[#37352f]/20" />}
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                        }} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest">Keterangan Foto (Opsional)</label>
                    <div className="relative group">
                      <input type="text" className="w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm" placeholder="Contoh: Kegiatan Latihan Siswa..." value={dokumentasiForm.caption} onChange={(e) => setDokumentasiForm({...dokumentasiForm, caption: e.target.value})} />
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                    </div>
                  </div>
                </div>
              )}
              
              <button type="submit" disabled={submitting} className="bg-[#37352f] hover:bg-[#0b6e99] disabled:opacity-50 text-white w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                {submitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
