import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import Footer from '../siswa/Footer';
import Swal from 'sweetalert2';
import { 
  TrendingDown, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Calendar, 
  Wallet, 
  FileText, 
  Filter, 
  Upload, 
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';

export default function AdminPengeluaran() {
  const [loading, setLoading] = useState(true);
  const [pengeluaranList, setPengeluaranList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');

  // Form & Modal states
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null); // null if adding, item object if editing
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Bensin / Isi Minyak',
    nominal: '',
    keterangan: '',
    bukti_url: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const categories = [
    'Bensin / Isi Minyak',
    'Ganti Ban',
    'Servis & Perawatan Kendaraan',
    'Lainnya'
  ];

  useEffect(() => {
    fetchPengeluaran();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pengeluaranList, filterMonth, filterCategory]);

  const fetchPengeluaran = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengeluaran_operasional')
        .select('*')
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setPengeluaranList(data || []);
    } catch (err) {
      console.error("Gagal mengambil data pengeluaran:", err.message);
      Swal.fire('Error', 'Gagal memuat data pengeluaran operasional', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...pengeluaranList];

    // Filter by Category
    if (filterCategory !== 'Semua') {
      result = result.filter(item => item.kategori === filterCategory);
    }

    // Filter by Month
    if (filterMonth !== 'Semua') {
      result = result.filter(item => {
        const itemMonth = new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        return itemMonth === filterMonth;
      });
    }

    setFilteredList(result);
  };

  const getAvailableMonths = () => {
    const monthsSet = new Set();
    pengeluaranList.forEach(item => {
      const m = new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      monthsSet.add(m);
    });
    return ['Semua', ...Array.from(monthsSet)];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire('Format Salah', 'Silakan pilih gambar bukti pengeluaran (JPG, PNG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('File Terlalu Besar', 'Maksimal ukuran file adalah 5MB.', 'error');
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleOpenAddModal = () => {
    setEditItem(null);
    setForm({
      tanggal: new Date().toISOString().split('T')[0],
      kategori: 'Bensin / Isi Minyak',
      nominal: '',
      keterangan: '',
      bukti_url: ''
    });
    setSelectedFile(null);
    setFilePreview('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    setForm({
      tanggal: item.tanggal,
      kategori: item.kategori,
      nominal: item.nominal,
      keterangan: item.keterangan || '',
      bukti_url: item.bukti_url || ''
    });
    setSelectedFile(null);
    setFilePreview(item.bukti_url || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalBuktiUrl = form.bukti_url;

      // 1. Upload file if there is a new selected file
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `operasional/op_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bukti-gaji')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('bukti-gaji')
          .getPublicUrl(filePath);

        finalBuktiUrl = urlData?.publicUrl || '';
      }

      const payload = {
        tanggal: form.tanggal,
        kategori: form.kategori,
        nominal: parseInt(form.nominal, 10),
        keterangan: form.keterangan,
        bukti_url: finalBuktiUrl
      };

      if (editItem) {
        // Update
        const { error } = await supabase
          .from('pengeluaran_operasional')
          .update(payload)
          .eq('id', editItem.id);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Pengeluaran Diperbarui',
          text: 'Data pengeluaran operasional berhasil diperbarui.',
          confirmButtonColor: '#0b6e99'
        });
      } else {
        // Insert
        const { error } = await supabase
          .from('pengeluaran_operasional')
          .insert([payload]);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Pengeluaran Disimpan',
          text: 'Catatan pengeluaran operasional baru berhasil disimpan.',
          confirmButtonColor: '#0b6e99'
        });
      }

      setShowModal(false);
      fetchPengeluaran();
    } catch (err) {
      console.error("Gagal menyimpan pengeluaran:", err);
      Swal.fire('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus Pengeluaran?',
      text: 'Catatan pengeluaran ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#efefed',
      customClass: {
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer mx-1',
        cancelButton: 'bg-[#efefed] hover:bg-[#e4e4e7] text-[#37352f] font-semibold py-2 px-4 rounded-lg cursor-pointer mx-1'
      },
      buttonsStyling: false
    });

    if (confirm.isConfirmed) {
      try {
        const { error } = await supabase
          .from('pengeluaran_operasional')
          .delete()
          .eq('id', id);

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Berhasil Dihapus',
          text: 'Catatan pengeluaran berhasil dihapus.',
          confirmButtonColor: '#0b6e99'
        });

        fetchPengeluaran();
      } catch (err) {
        console.error("Gagal menghapus pengeluaran:", err.message);
        Swal.fire('Error', 'Gagal menghapus data pengeluaran', 'error');
      }
    }
  };

  const openPreview = (url, title) => {
    setPreviewImageUrl(url);
    setPreviewTitle(title);
    setShowPreviewModal(true);
  };

  const totalNominal = filteredList.reduce((sum, item) => sum + item.nominal, 0);

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar activeMenu="pengeluaran" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Pengeluaran Operasional</span>
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
          {/* Header Section */}
          <div className="mb-8 md:mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
                <TrendingDown className="w-3 h-3 text-red-500" />
                Operasional Harian
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
                Pengeluaran <span className="text-[#37352f]/40">Lainnya.</span>
              </h2>
              <p className="text-[#37352f]/70 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
                Kelola pencatatan biaya operasional sekolah mengemudi seperti bahan bakar, ban kendaraan, service berkala, dll.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-[#0b6e99] hover:bg-[#085577] text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" /> Tambah Catatan
            </button>
          </div>

          {/* Quick Statistics Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2">Total Operasional Terfilter</p>
                <h3 className="text-2xl font-extrabold text-[#37352f] font-mono">
                  Rp {totalNominal.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg w-fit">
                <Wallet className="w-3.5 h-3.5" /> Total Pengeluaran Aktif
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2">Jumlah Transaksi Terfilter</p>
                <h3 className="text-2xl font-extrabold text-[#37352f] font-mono">
                  {filteredList.length} Catatan
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-[#0b6e99] bg-[#efefed] px-2.5 py-1 rounded-lg w-fit">
                <FileText className="w-3.5 h-3.5" /> Entri Tercatat
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#e9e9e7] shadow-sm mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#37352f]/40" />
              <span className="text-xs font-bold uppercase text-[#37352f]/40 tracking-wider">Filter Data:</span>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#efefed] px-3 py-1.5 rounded-lg border border-[#e9e9e7] text-xs">
              <span className="text-[#37352f]/60 font-semibold">Kategori:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-[#efefed] px-3 py-1.5 rounded-lg border border-[#e9e9e7] text-xs">
              <span className="text-[#37352f]/60 font-semibold">Bulan:</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
              >
                {getAvailableMonths().map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center w-16">No</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 w-36">Tanggal</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 w-48">Kategori</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right w-44">Nominal</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Keterangan</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center w-36">Kwitansi</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-[#37352f]/40 font-medium text-xs md:text-sm">Memuat data pengeluaran operasional...</td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-[#37352f]/40 font-medium text-xs md:text-sm italic">Tidak ada catatan pengeluaran ditemukan.</td>
                    </tr>
                  ) : (
                    filteredList.map((item, index) => (
                      <tr key={item.id} className="hover:bg-[#fbfbfa] transition-colors text-sm">
                        <td className="px-6 py-5 text-center font-bold text-[#37352f]/40">{index + 1}</td>
                        <td className="px-6 py-5 font-semibold text-[#37352f]">
                          {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] font-bold text-[#37352f] bg-[#efefed] px-2.5 py-1 rounded-md border border-[#e9e9e7]">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-extrabold text-[#37352f]">
                          Rp {item.nominal.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-5 text-[#37352f]/80 font-medium">
                          {item.keterangan || '-'}
                        </td>
                        <td className="px-6 py-5 text-center">
                          {item.bukti_url ? (
                            <button
                              onClick={() => openPreview(item.bukti_url, item.kategori)}
                              className="inline-flex items-center gap-1.5 bg-[#0b6e99]/5 hover:bg-[#0b6e99] text-[#0b6e99] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-[#0b6e99]/20 cursor-pointer shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-xs text-[#37352f]/30 italic font-medium">Tidak ada</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 text-amber-600 flex items-center justify-center transition-all cursor-pointer"
                              title="Edit Catatan"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-500 flex items-center justify-center transition-all cursor-pointer"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Form Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <header className="p-6 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-[#0b6e99]" />
                <h3 className="text-lg font-bold text-[#37352f]">{editItem ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Operasional'}</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 bg-[#efefed] hover:bg-[#e4e4e2] text-[#37352f] rounded-full flex items-center justify-center transition-all border border-[#e9e9e7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/45 ml-1">Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30" />
                    <input
                      type="date"
                      name="tanggal"
                      required
                      value={form.tanggal}
                      onChange={handleInputChange}
                      className="w-full bg-[#efefed] border border-transparent rounded-xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#0b6e99] focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/45 ml-1">Kategori</label>
                  <select
                    name="kategori"
                    required
                    value={form.kategori}
                    onChange={handleInputChange}
                    className="w-full bg-[#efefed] border border-transparent rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#0b6e99] focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/45 ml-1">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#37352f]/40">Rp</span>
                  <input
                    type="number"
                    name="nominal"
                    required
                    placeholder="0"
                    min="0"
                    value={form.nominal}
                    onChange={handleInputChange}
                    className="w-full bg-[#efefed] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#0b6e99] focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/45 ml-1">Keterangan / Deskripsi</label>
                <textarea
                  name="keterangan"
                  rows="3"
                  placeholder="Deskripsi detail mengenai pengeluaran operasional..."
                  value={form.keterangan}
                  onChange={handleInputChange}
                  className="w-full bg-[#efefed] border border-transparent rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#0b6e99] focus:bg-white outline-none transition-all resize-none"
                />
              </div>

              {/* Receipt File Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/45 ml-1">Bukti Pembayaran / Kwitansi</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 bg-[#efefed] hover:bg-[#e4e4e2] text-[#37352f] px-4 py-2.5 rounded-xl border border-[#e9e9e7] text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-[#0b6e99]" />
                    Pilih Gambar
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-[#37352f]/50 font-medium">
                    {selectedFile ? selectedFile.name : (editItem && form.bukti_url ? 'Gambar terunggah' : 'Belum ada file terpilih')}
                  </span>
                </div>
                
                {/* Upload Image Preview */}
                {filePreview && (
                  <div className="mt-3 relative w-36 h-24 rounded-lg overflow-hidden border border-[#e9e9e7] bg-gray-50 flex items-center justify-center group">
                    <img src={filePreview} alt="Preview Bukti" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(editItem ? '' : '');
                        setForm(p => ({...p, bukti_url: editItem ? '' : ''}));
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <footer className="pt-4 border-t border-[#e9e9e7] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-[#efefed] hover:bg-[#e4e4e2] text-[#37352f] font-bold py-2.5 px-5 rounded-xl transition-all text-xs border border-transparent cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-[#0b6e99] hover:bg-[#085577] text-white font-bold py-2.5 px-5 rounded-xl transition-all text-xs border border-transparent cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
                >
                  {uploading ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Catat Pengeluaran')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <header className="p-5 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0b6e99]" />
                <h4 className="text-sm font-bold text-[#37352f]">Bukti Pengeluaran: <span className="font-extrabold">{previewTitle}</span></h4>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="w-7 h-7 bg-[#efefed] hover:bg-[#e4e4e2] text-[#37352f] rounded-full flex items-center justify-center transition-all border border-[#e9e9e7] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </header>
            
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-6">
              <img src={previewImageUrl} alt="Bukti Kwitansi" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md border border-[#e9e9e7]" />
            </div>

            <footer className="p-4 border-t border-[#e9e9e7] flex justify-end bg-[#fbfbfa]">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="bg-[#37352f] hover:bg-[#0b6e99] text-white font-bold py-2 px-5 rounded-lg text-xs transition-all cursor-pointer border-0"
              >
                Tutup Preview
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
