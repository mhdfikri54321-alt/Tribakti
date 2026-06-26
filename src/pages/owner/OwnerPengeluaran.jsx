import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import OwnerSidebar from './OwnerSidebar';
import Footer from '../siswa/Footer';
import Swal from 'sweetalert2';
import { 
  TrendingDown, 
  Eye, 
  X, 
  Calendar, 
  Wallet, 
  FileText, 
  Filter, 
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';

export default function OwnerPengeluaran() {
  const [loading, setLoading] = useState(true);
  const [pengeluaranList, setPengeluaranList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');

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

  const openPreview = (url, title) => {
    setPreviewImageUrl(url);
    setPreviewTitle(title);
    setShowPreviewModal(true);
  };

  const totalNominal = filteredList.reduce((sum, item) => sum + item.nominal, 0);

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <OwnerSidebar activeMenu="pengeluaran" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Pengeluaran Operasional</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Owner'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Owner</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'O').charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          {/* Header Section */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <TrendingDown className="w-3 h-3 text-red-500" />
              Monitoring Biaya
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Pengeluaran <span className="text-[#37352f]/40">Operasional.</span>
            </h2>
            <p className="text-[#37352f]/70 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
              Tinjau daftar lengkap pencatatan pengeluaran harian dan operasional armada sekolah mengemudi Tri Bakti.
            </p>
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
                <Wallet className="w-3.5 h-3.5" /> Total Pengeluaran
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-[#37352f]/40 font-medium text-xs md:text-sm">Memuat data pengeluaran operasional...</td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-[#37352f]/40 font-medium text-xs md:text-sm italic">Tidak ada catatan pengeluaran ditemukan.</td>
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
