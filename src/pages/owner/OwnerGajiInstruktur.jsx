import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OwnerSidebar from './OwnerSidebar';
import Footer from '../siswa/Footer';
import logoTribakti from '../../assets/logo_tribakti.png';
import {
  Wallet,
  Calendar,
  TrendingUp,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  FileText,
  Search,
  ExternalLink,
  Eye,
  X,
  Image as ImageIcon
} from 'lucide-react';

export default function OwnerGajiInstruktur() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  // State Utama
  const [activeTab, setActiveTab] = useState('proses'); // 'proses' atau 'riwayat'
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  
  // Tarif Gaji Terkini
  const [tarifPerSesi, setTarifPerSesi] = useState(50000);

  // Filter Periode Proses
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Filter Riwayat
  const [riwayatSearch, setRiwayatSearch] = useState('');
  const [riwayatFilterStatus, setRiwayatFilterStatus] = useState('Semua');
  const [riwayatFilterMonth, setRiwayatFilterMonth] = useState('Semua');
  const [riwayatFilterYear, setRiwayatFilterYear] = useState('Semua');

  // Data dari Database
  const [instrukturList, setInstrukturList] = useState([]);
  const [jadwalLatihan, setJadwalLatihan] = useState([]);
  const [savedSlips, setSavedSlips] = useState([]); // slip bulan terpilih
  const [allSlipsHistory, setAllSlipsHistory] = useState([]); // semua slip untuk tab riwayat

  // Active slip for printing

  // Modal Preview Gambar Bukti Pembayaran
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewInstructorName, setPreviewInstructorName] = useState('');
  const [previewPeriod, setPreviewPeriod] = useState('');

  // List Tahun & Bulan
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, name: 'Januari' },
    { value: 2, name: 'Februari' },
    { value: 3, name: 'Maret' },
    { value: 4, name: 'April' },
    { value: 5, name: 'Mei' },
    { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' },
    { value: 8, name: 'Agustus' },
    { value: 9, name: 'September' },
    { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' },
    { value: 12, name: 'Desember' }
  ];

  // Format Mata Uang
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  };

  // Cek Keberadaan Tabel dan Muat Data Awal
  useEffect(() => {
    checkTablesAndLoadData();
  }, []);

  // Muat ulang data setiap kali periode proses berubah
  useEffect(() => {
    if (tableExists) {
      fetchProcessPeriodData();
    }
  }, [selectedYear, selectedMonth, tableExists]);

  // Muat data riwayat slip secara keseluruhan jika tab riwayat dibuka
  useEffect(() => {
    if (tableExists && activeTab === 'riwayat') {
      fetchAllSlipsHistory();
    }
  }, [activeTab, tableExists]);

  const checkTablesAndLoadData = async () => {
    setLoading(true);
    try {
      // Test select dari tabel pengaturan_gaji
      const { error: testError } = await supabase.from('pengaturan_gaji').select('tarif_per_sesi').limit(1);
      
      if (testError && testError.code === 'PGRST205') {
        setTableExists(false);
        setLoading(false);
        return;
      }

      setTableExists(true);
      
      // Muat Tarif Gaji
      const { data: configData, error: configError } = await supabase
        .from('pengaturan_gaji')
        .select('tarif_per_sesi')
        .eq('id', 1)
        .maybeSingle();

      if (!configError && configData) {
        setTarifPerSesi(configData.tarif_per_sesi);
      }

      // Muat Instruktur
      const { data: instData, error: instError } = await supabase
        .from('akun_pengguna')
        .select(`
          id, nama_lengkap, username, nik,
          instruktur(nama_bank, no_rekening)
        `)
        .eq('role', 'instruktur')
        .order('nama_lengkap', { ascending: true });

      if (instError) throw instError;
      setInstrukturList(instData || []);

      // Muat jadwal & slip periode saat ini
      await fetchProcessPeriodData();

    } catch (err) {
      console.error("Gagal melakukan pengecekan data awal:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcessPeriodData = async () => {
    if (!tableExists) return;
    try {
      const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

      // 1. Ambil jadwal latihan selesai
      const { data: jadwalData, error: jadwalError } = await supabase
        .from('jadwal_latihan')
        .select('id, instruktur_id, tanggal_waktu, status')
        .eq('status', 'Selesai');

      if (jadwalError) throw jadwalError;
      setJadwalLatihan(jadwalData || []);

      // 2. Ambil slip gaji yang sudah tersimpan untuk bulan ini
      const { data: slipsData, error: slipsError } = await supabase
        .from('slip_gaji_instruktur')
        .select('*')
        .eq('bulan_tahun', monthStr);

      if (slipsError) throw slipsError;
      setSavedSlips(slipsData || []);

    } catch (err) {
      console.error("Gagal memuat data periode:", err.message);
    }
  };

  const fetchAllSlipsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('slip_gaji_instruktur')
        .select(`
          *,
          instruktur:akun_pengguna!slip_gaji_instruktur_instruktur_id_fkey(
            nama_lengkap, username, nik,
            instruktur(nama_bank, no_rekening)
          )
        `)
        .order('bulan_tahun', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllSlipsHistory(data || []);
    } catch (err) {
      console.error("Gagal memuat seluruh riwayat slip:", err.message);
    }
  };

  // Dapatkan jumlah sesi mengajar yang selesai untuk instruktur di bulan terpilih
  const getSesiSelesaiCount = (instrukturId) => {
    return jadwalLatihan.filter(s => {
      if (s.instruktur_id !== instrukturId) return false;
      if (!s.tanggal_waktu) return false;
      const d = new Date(s.tanggal_waktu);
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    }).length;
  };

  // Trigger Print dialog untuk slip tunggal
  const handlePrintSlip = (slip) => {
    let fullSlip = { ...slip };
    if (!fullSlip.instruktur) {
      const inst = instrukturList.find(i => i.id === slip.instruktur_id);
      if (inst) {
        fullSlip.instruktur = inst;
      }
    }
    
    // Direct DOM population:
    const printContainer = document.getElementById('print-slip-container');
    if (!printContainer) return;

    printContainer.querySelector('.slip-id').innerText = `ID Slip: #${fullSlip.id || ''}-${fullSlip.bulan_tahun || ''}`;
    printContainer.querySelector('.slip-nama').innerText = fullSlip.instruktur?.nama_lengkap || 'Nama Instruktur';
    printContainer.querySelector('.slip-nik').innerText = fullSlip.instruktur?.nik || fullSlip.instruktur?.username || '-';
    printContainer.querySelector('.slip-periode').innerText = formatBulanTahun(fullSlip.bulan_tahun);
    printContainer.querySelector('.slip-status').innerText = fullSlip.status_pembayaran || '';
    printContainer.querySelector('.slip-jumlah-sesi').innerText = `${fullSlip.jumlah_sesi || 0} Sesi`;
    printContainer.querySelector('.slip-tarif').innerText = formatRupiah(fullSlip.tarif_per_sesi);
    printContainer.querySelector('.slip-total-gaji').innerText = formatRupiah(fullSlip.total_gaji);
    printContainer.querySelector('.slip-total-gaji-received').innerText = formatRupiah(fullSlip.total_gaji);
    printContainer.querySelector('.slip-catatan').innerText = `${fullSlip.catatan || 'Kompensasi resmi untuk sesi latihan terverifikasi selesai oleh sistem.'}${fullSlip.tanggal_bayar ? ` Lunas ditransfer pada ${new Date(fullSlip.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''}`;
    printContainer.querySelector('.slip-penerima').innerText = fullSlip.instruktur?.nama_lengkap || 'Instruktur';

    document.body.classList.add('print-mode-slip');
    const cleanup = () => {
      document.body.classList.remove('print-mode-slip');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  // Helper memformat Periode
  const formatBulanTahun = (val) => {
    if (!val) return '';
    const [year, month] = val.split('-');
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIndex = parseInt(month, 10) - 1;
    return `${namaBulan[mIndex]} ${year}`;
  };

  // Cetak rekap gaji sekaligus
  const handlePrintRecap = () => {
    if (printRecapSlips.length === 0) {
      alert("Tidak ada data slip gaji untuk dicetak");
      return;
    }
    document.body.classList.add('print-mode-recap');
    const cleanup = () => {
      document.body.classList.remove('print-mode-recap');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  // Buka Modal Preview Gambar Bukti Pembayaran
  const handleOpenPreviewModal = (slip, namaInstruktur) => {
    setPreviewImageUrl(slip.bukti_pembayaran_url);
    setPreviewInstructorName(namaInstruktur);
    setPreviewPeriod(slip.bulan_tahun);
    setShowPreviewModal(true);
  };

  // Perhitungan Ringkasan Statistik
  const calculatedStats = () => {
    const activeSlips = savedSlips;
    
    // hitung draf juga untuk estimasi total pengeluaran
    const draftSlipsSum = instrukturList.reduce((sum, inst) => {
      const hasSlip = savedSlips.some(s => s.instruktur_id === inst.id);
      if (hasSlip) return sum;
      const sesiCount = getSesiSelesaiCount(inst.id);
      return sum + (sesiCount * tarifPerSesi);
    }, 0);

    const lunasSum = activeSlips.filter(s => s.status_pembayaran === 'Lunas').reduce((sum, s) => sum + s.total_gaji, 0);
    const belumBayarSum = activeSlips.filter(s => s.status_pembayaran === 'Belum Dibayar').reduce((sum, s) => sum + s.total_gaji, 0);

    return {
      estimasiTotal: lunasSum + belumBayarSum + draftSlipsSum,
      totalLunas: lunasSum,
      totalBelumBayar: belumBayarSum
    };
  };

  const stats = calculatedStats();

  const printRecapSlips = allSlipsHistory.filter(slip => {
    const nama = slip.instruktur?.nama_lengkap || '';
    const matchesSearch = nama.toLowerCase().includes(riwayatSearch.toLowerCase());
    const matchesStatus = riwayatFilterStatus === 'Semua' || slip.status_pembayaran === riwayatFilterStatus;
    
    let matchesMonth = true;
    let matchesYear = true;
    if (slip.bulan_tahun) {
      const [year, month] = slip.bulan_tahun.split('-');
      if (riwayatFilterMonth !== 'Semua') {
        matchesMonth = month === String(riwayatFilterMonth).padStart(2, '0');
      }
      if (riwayatFilterYear !== 'Semua') {
        matchesYear = year === riwayatFilterYear;
      }
    }
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  }).map(slip => {
    let fullSlip = { ...slip };
    if (!fullSlip.instruktur) {
      const inst = instrukturList.find(i => i.id === slip.instruktur_id);
      if (inst) {
        fullSlip.instruktur = inst;
      }
    }
    return fullSlip;
  });

  // Tampilan ketika tabel belum dikonfigurasi di Supabase
  if (!tableExists) {
    return (
      <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
        <OwnerSidebar activeMenu="gaji" />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-medium text-[#37352f]/60">Menu Owner</h1>
              <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
              <span className="text-sm font-semibold">Pemantauan Gaji</span>
            </div>
          </header>
          
          <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-[#e9e9e7] p-8 shadow-sm text-center">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tabel Gaji Belum Dikonfigurasi</h2>
              <p className="text-sm text-[#37352f]/60 mb-6 max-w-lg mx-auto">
                Fitur kompensasi gaji memerlukan tabel tambahan di Supabase Anda. 
                Saat ini Admin belum menjalankan script database SQL untuk mengaktifkan fitur ini.
              </p>
              
              <div className="bg-[#efefed] text-left p-4 rounded-xl font-mono text-xs overflow-x-auto border border-[#e9e9e7] max-h-72 mb-6">
                <pre>{`-- Silakan hubungi Administrator untuk membuat tabel berikut:
-- 1. pengaturan_gaji
-- 2. slip_gaji_instruktur`}</pre>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => checkTablesAndLoadData()}
                  className="bg-[#0b6e99] hover:bg-[#0b6e99]/90 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all cursor-pointer text-sm shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" /> Coba Lagi / Hubungkan
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Tampilan Utama Read-Only
  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <OwnerSidebar activeMenu="gaji" />

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        {/* Header Panel */}
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu Owner</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Pemantauan Gaji</span>
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
          {/* Header Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3">
              <Wallet className="w-3 h-3 text-[#0b6e99]" /> Pemantauan Keuangan (Read-Only)
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
              Gaji & <span className="text-[#37352f]/40">Kompensasi Instruktur.</span>
            </h2>
            <p className="text-[#37352f]/60 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
              Lihat laporan estimasi gaji mengajar, pantau slip gaji yang telah dikunci oleh Admin, verifikasi bukti pembayaran, dan cetak slip individual / rekap gaji.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-[#efefed] p-1 rounded-xl w-fit border border-[#e9e9e7] mb-8">
            <button
              onClick={() => setActiveTab('proses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'proses'
                  ? 'bg-white text-[#37352f] shadow-sm'
                  : 'text-[#37352f]/50 hover:text-[#37352f]'
              }`}
            >
              <RefreshCw className="w-4 h-4" /> Estimasi Bulanan
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'riwayat'
                  ? 'bg-white text-[#37352f] shadow-sm'
                  : 'text-[#37352f]/50 hover:text-[#37352f]'
              }`}
            >
              <FileText className="w-4 h-4" /> Riwayat Slip Gaji
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 text-[#0b6e99] animate-spin mb-4" />
              <p className="text-sm font-semibold text-[#37352f]/60">Memuat Data Keuangan...</p>
            </div>
          ) : (
            <>
              {/* TAB ESTIMASI GAJI BULANAN */}
              {activeTab === 'proses' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Period Filter & Statistics Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Period Selector Card */}
                    <div className="bg-white p-5 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Pilih Periode Bulan
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#37352f]/60 block mb-1">Bulan</label>
                            <select
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(Number(e.target.value))}
                              className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
                            >
                              {months.map(m => (
                                <option key={m.value} value={m.value}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#37352f]/60 block mb-1">Tahun</label>
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(Number(e.target.value))}
                              className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
                            >
                              {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#e9e9e7]/50 text-[11px] text-[#37352f]/60 font-medium">
                        * Owner hanya dapat memantau kalkulasi. Penguncian slip dikelola oleh Admin.
                      </div>
                    </div>

                    {/* Stats Box 1: Total Pengeluaran */}
                    <div className="bg-white p-5 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Estimasi Pengeluaran</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#37352f]">
                          {formatRupiah(stats.estimasiTotal)}
                        </h3>
                        <p className="text-[10px] text-[#37352f]/50 mt-1">Total seluruh draf + slip resmi bulan ini.</p>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-[#0b6e99] uppercase tracking-widest bg-[#efefed] px-2 py-0.5 rounded-lg w-fit">
                        <TrendingUp className="w-3 h-3" /> Tarif: {formatRupiah(tarifPerSesi)}/sesi
                      </div>
                    </div>

                    {/* Stats Box 2: Total Belum Dibayar */}
                    <div className="bg-white p-5 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Total Belum Dibayar</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-amber-600">
                          {formatRupiah(stats.totalBelumBayar)}
                        </h3>
                        <p className="text-[10px] text-[#37352f]/50 mt-1">Slip dikunci Admin berstatus Belum Dibayar.</p>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                        <Clock className="w-3 h-3" /> Menunggu Payout
                      </div>
                    </div>

                    {/* Stats Box 3: Total Lunas */}
                    <div className="bg-white p-5 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Total Lunas</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-emerald-600">
                          {formatRupiah(stats.totalLunas)}
                        </h3>
                        <p className="text-[10px] text-[#37352f]/50 mt-1">Pembayaran yang sudah ditransfer Admin.</p>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Berhasil Dibayar
                      </div>
                    </div>
                  </div>

                  {/* Main Calculation Table */}
                  <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-[#e9e9e7]">
                      <h4 className="text-lg font-bold text-[#37352f] flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-[#0b6e99]" /> Pemantauan Estimasi Gaji Instruktur
                      </h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                        Periode: {months.find(m => m.value === selectedMonth)?.name} {selectedYear}
                      </p>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider w-16 text-center">No</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider">Nama Instruktur</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Sesi Selesai</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-right">Tarif flat</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-right">Total Gaji</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Rincian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9e9e7]">
                          {instrukturList.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-6 py-12 text-center text-sm font-semibold text-[#37352f]/40">
                                Tidak ada data instruktur mengemudi yang terdaftar.
                              </td>
                            </tr>
                          ) : (
                            instrukturList.map((inst, index) => {
                              const savedSlip = savedSlips.find(s => s.instruktur_id === inst.id);
                              const isLocked = !!savedSlip;
                              
                              const sesiCount = isLocked ? savedSlip.jumlah_sesi : getSesiSelesaiCount(inst.id);
                              const tarif = isLocked ? savedSlip.tarif_per_sesi : tarifPerSesi;
                              const totalGaji = sesiCount * tarif;
                              
                              const bankProfile = inst.instruktur?.[0];
                              const bankName = bankProfile?.nama_bank || '';
                              const bankAccount = bankProfile?.no_rekening || '';

                              return (
                                <tr key={inst.id} className="hover:bg-[#fbfbfa]/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-center text-[#37352f]/50">{index + 1}</td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="text-sm font-semibold text-[#37352f]">{inst.nama_lengkap}</p>
                                      <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-0.5">
                                        NIK: {inst.nik || '-'} {bankName && ` | ${bankName}: ${bankAccount}`}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-bold text-center">
                                    <span className="bg-[#efefed] px-2.5 py-1 rounded-lg text-[#37352f] font-mono">
                                      {sesiCount} Sesi
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm font-semibold text-right font-mono">{formatRupiah(tarif)}</td>
                                  <td className="px-6 py-4 text-sm font-bold text-right font-mono text-[#0b6e99]">{formatRupiah(totalGaji)}</td>
                                  <td className="px-6 py-4 text-center">
                                    {isLocked ? (
                                      savedSlip.status_pembayaran === 'Lunas' ? (
                                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                          <CheckCircle2 className="w-3 h-3" /> Lunas
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                          <Clock className="w-3 h-3" /> Dikunci Admin
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Belum Dikunci
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      {/* Link ke Detail Sesi Instruktur */}
                                      <button
                                        onClick={() => navigate(`/owner/instruktur/sesi?id=${inst.id}&nama=${encodeURIComponent(inst.nama_lengkap)}`)}
                                        title="Lihat Sesi Mengajar"
                                        className="p-1.5 bg-gray-50 hover:bg-gray-150 border border-gray-200 rounded-lg text-[#37352f]/60 hover:text-[#37352f] transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </button>
                                      
                                      {/* Detail Bukti Pembayaran */}
                                      {isLocked && savedSlip.status_pembayaran === 'Lunas' && savedSlip.bukti_pembayaran_url && (
                                        <button
                                          onClick={() => handleOpenPreviewModal(savedSlip, inst.nama_lengkap)}
                                          title="Lihat Bukti Transfer"
                                          className="p-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-lg text-sky-600 transition-all flex items-center justify-center cursor-pointer"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {/* Cetak Slip jika sudah dikunci */}
                                      {isLocked && (
                                        <button
                                          onClick={() => handlePrintSlip(savedSlip)}
                                          title="Cetak Slip Gaji"
                                          className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-all flex items-center justify-center cursor-pointer"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB RIWAYAT SLIP GAJI */}
              {activeTab === 'riwayat' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Search and Filters */}
                  <div className="bg-white p-5 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                      {/* Search bar */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/40" />
                        <input
                          type="text"
                          placeholder="Cari nama instruktur..."
                          value={riwayatSearch}
                          onChange={(e) => setRiwayatSearch(e.target.value)}
                          className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-[#0b6e99] transition-colors"
                        />
                      </div>
                      
                      {/* Status filter */}
                      <select
                        value={riwayatFilterStatus}
                        onChange={(e) => setRiwayatFilterStatus(e.target.value)}
                        className="bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
                      >
                        <option value="Semua">Semua Status</option>
                        <option value="Belum Dibayar">Belum Dibayar</option>
                        <option value="Lunas">Lunas</option>
                      </select>

                      {/* Month filter */}
                      <select
                        value={riwayatFilterMonth}
                        onChange={(e) => setRiwayatFilterMonth(e.target.value)}
                        className="bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
                      >
                        <option value="Semua">Semua Bulan</option>
                        {months.map(m => (
                          <option key={m.value} value={String(m.value)}>{m.name}</option>
                        ))}
                      </select>

                      {/* Year filter */}
                      <select
                        value={riwayatFilterYear}
                        onChange={(e) => setRiwayatFilterYear(e.target.value)}
                        className="bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-3 py-2 text-sm font-semibold outline-none cursor-pointer"
                      >
                        <option value="Semua">Semua Tahun</option>
                        {years.map(y => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto justify-end">
                      <button
                        onClick={handlePrintRecap}
                        className="bg-[#0b6e99] hover:bg-[#0b6e99]/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#0b6e99]/10"
                      >
                        <Printer className="w-4 h-4" /> Cetak Rekap Gaji
                      </button>
                    </div>
                  </div>

                  {/* History Table */}
                  <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider w-16 text-center">No</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Periode</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider">Nama Instruktur</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Jumlah Sesi</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-right">Tarif</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-right">Total Gaji</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Tanggal Bayar</th>
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e9e9e7]">
                          {allSlipsHistory.filter(slip => {
                            const name = slip.instruktur?.nama_lengkap || '';
                            const matchesSearch = name.toLowerCase().includes(riwayatSearch.toLowerCase());
                            const matchesStatus = riwayatFilterStatus === 'Semua' || slip.status_pembayaran === riwayatFilterStatus;
                            
                            let matchesMonth = true;
                            let matchesYear = true;
                            if (slip.bulan_tahun) {
                              const [year, month] = slip.bulan_tahun.split('-');
                              if (riwayatFilterMonth !== 'Semua') {
                                matchesMonth = month === String(riwayatFilterMonth).padStart(2, '0');
                              }
                              if (riwayatFilterYear !== 'Semua') {
                                matchesYear = year === riwayatFilterYear;
                              }
                            }
                            return matchesSearch && matchesStatus && matchesMonth && matchesYear;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="9" className="px-6 py-12 text-center text-sm font-semibold text-[#37352f]/40">
                                Tidak ada histori slip gaji yang cocok dengan filter.
                              </td>
                            </tr>
                          ) : (
                            allSlipsHistory
                              .filter(slip => {
                                const name = slip.instruktur?.nama_lengkap || '';
                                const matchesSearch = name.toLowerCase().includes(riwayatSearch.toLowerCase());
                                const matchesStatus = riwayatFilterStatus === 'Semua' || slip.status_pembayaran === riwayatFilterStatus;
                                
                                let matchesMonth = true;
                                let matchesYear = true;
                                if (slip.bulan_tahun) {
                                  const [year, month] = slip.bulan_tahun.split('-');
                                  if (riwayatFilterMonth !== 'Semua') {
                                    matchesMonth = month === String(riwayatFilterMonth).padStart(2, '0');
                                  }
                                  if (riwayatFilterYear !== 'Semua') {
                                    matchesYear = year === riwayatFilterYear;
                                  }
                                }
                                return matchesSearch && matchesStatus && matchesMonth && matchesYear;
                              })
                              .map((slip, index) => {
                                const bankProfile = slip.instruktur?.instruktur?.[0];
                                const bankName = bankProfile?.nama_bank || '';
                                const bankAccount = bankProfile?.no_rekening || '';

                                return (
                                  <tr key={slip.id} className="hover:bg-[#fbfbfa]/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-center text-[#37352f]/50">{index + 1}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-center font-mono text-[#0b6e99]">{slip.bulan_tahun}</td>
                                    <td className="px-6 py-4">
                                      <div>
                                        <p className="text-sm font-semibold text-[#37352f]">{slip.instruktur?.nama_lengkap || 'Instruktur'}</p>
                                        <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-0.5">
                                          NIK: {slip.instruktur?.nik || '-'} {bankName && ` | ${bankName}: ${bankAccount}`}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-center">
                                      <span className="bg-[#efefed] px-2 py-0.5 rounded-lg text-[#37352f] font-mono">
                                        {slip.jumlah_sesi} Sesi
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-right font-mono">{formatRupiah(slip.tarif_per_sesi)}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-right font-mono text-[#0b6e99]">{formatRupiah(slip.total_gaji)}</td>
                                    <td className="px-6 py-4 text-center">
                                      {slip.status_pembayaran === 'Lunas' ? (
                                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                          <CheckCircle2 className="w-3 h-3" /> Lunas
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                          <Clock className="w-3 h-3" /> Belum Dibayar
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-center text-[#37352f]/60 font-mono">
                                      {slip.tanggal_bayar ? new Date(slip.tanggal_bayar).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center justify-center gap-1.5">
                                        {slip.status_pembayaran === 'Lunas' && slip.bukti_pembayaran_url && (
                                          <button
                                            onClick={() => handleOpenPreviewModal(slip, slip.instruktur?.nama_lengkap || 'Instruktur')}
                                            title="Lihat Bukti Transfer"
                                            className="p-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-lg text-sky-600 transition-colors cursor-pointer"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handlePrintSlip(slip)}
                                          title="Cetak Slip Gaji Resmi"
                                          className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[#37352f]/60 hover:text-[#37352f] transition-colors cursor-pointer inline-flex items-center justify-center"
                                        >
                                          <Printer className="w-4 h-4" /> <span className="ml-1 text-xs">Cetak Slip</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      {/* MODAL PREVIEW BUKTI PEMBAYARAN */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#37352f]/40 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#e9e9e7] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div>
                <h3 className="font-bold text-sm text-[#37352f] uppercase tracking-wider">Bukti Transfer Pembayaran</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Instruktur: {previewInstructorName} | Periode: {previewPeriod}</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-1 hover:bg-[#efefed] rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 bg-gray-50 flex items-center justify-center overflow-y-auto flex-1 min-h-[300px]">
              <img
                src={previewImageUrl}
                alt="Bukti Transfer Resmi"
                className="max-h-[60vh] object-contain rounded-lg border border-[#e9e9e7] shadow-sm bg-white"
              />
            </div>
            
            <div className="px-6 py-3 border-t border-[#e9e9e7] bg-[#fbfbfa] flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="bg-[#37352f] text-white font-bold py-2 px-5 rounded-xl text-xs hover:bg-[#37352f]/90 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLE FOR MEDIA PRINT CONTROLS */}
      <style dangerouslySetInnerHTML={{__html: `
        .print-section-slip,
        .print-section-recap {
          display: none !important;
        }
        @media print {
          .print-section-slip,
          .print-section-recap {
            display: none !important;
          }
          body.print-mode-slip .print-section-slip {
            display: block !important;
          }
          body.print-mode-recap .print-section-recap {
            display: block !important;
          }
        }
      `}} />

      {/* PRINT-ONLY SECTION (SINGLE SLIP) */}
      <div id="print-slip-container" className="print-section-slip bg-white text-black p-8 font-sans w-full max-w-[21cm] min-h-[14.8cm] border border-black/10 mx-auto text-xs">
        {/* Header Slip */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={logoTribakti} alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <div className="text-xl font-bold tracking-tight uppercase text-black">
                LPK Tri<span className="text-[#0b6e99]">Bakti</span>
              </div>
              <div className="text-[9px] text-gray-500 font-semibold">
                Jasa Kursus Mengemudi Profesional & Berizin Resmi
              </div>
              <div className="text-[9px] text-gray-500 font-medium mt-0.5">
                Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Kota Payakumbuh, 26218
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Slip Gaji Instruktur</h2>
            <p className="text-[10px] font-mono text-gray-500 slip-id"></p>
          </div>
        </div>

        {/* Rincian Instruktur & Periode */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-24 font-bold text-gray-600">Instruktur</span>
              <span className="px-1">:</span>
              <span className="font-semibold text-black slip-nama"></span>
            </div>
            <div className="flex">
              <span className="w-24 font-bold text-gray-600">NIK / Username</span>
              <span className="px-1">:</span>
              <span className="font-semibold text-black slip-nik"></span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex">
              <span className="w-24 font-bold text-gray-600">Periode Bulan</span>
              <span className="px-1">:</span>
              <span className="font-bold text-[#0b6e99] slip-periode"></span>
            </div>
            <div className="flex">
              <span className="w-24 font-bold text-gray-600">Status Bayar</span>
              <span className="px-1">:</span>
              <span className="font-bold uppercase tracking-wider text-black slip-status"></span>
            </div>
          </div>
        </div>

        {/* Rincian Perhitungan Kompensasi */}
        <table className="w-full text-left border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-3 py-2 border-r border-gray-300 font-bold w-12 text-center">No</th>
              <th className="px-3 py-2 border-r border-gray-300 font-bold">Rincian Kompensasi / Uraian</th>
              <th className="px-3 py-2 border-r border-gray-300 font-bold text-center w-24">Jumlah Sesi</th>
              <th className="px-3 py-2 border-r border-gray-300 font-bold text-right w-36">Tarif per Sesi</th>
              <th className="px-3 py-2 font-bold text-right w-40">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="px-3 py-3 border-r border-gray-300 text-center font-mono">1</td>
              <td className="px-3 py-3 border-r border-gray-300 font-medium">
                Kompensasi Sesi Mengajar Praktik / Sesi Selesai (Flat Rate)
              </td>
              <td className="px-3 py-3 border-r border-gray-300 text-center font-bold font-mono slip-jumlah-sesi">
              </td>
              <td className="px-3 py-3 border-r border-gray-300 text-right font-mono slip-tarif">
              </td>
              <td className="px-3 py-3 text-right font-bold font-mono slip-total-gaji">
              </td>
            </tr>
            {/* Grand Total */}
            <tr className="bg-gray-50 font-bold border-t-2 border-black">
              <td colSpan="3" className="px-3 py-3 border-r border-gray-300 text-right uppercase tracking-wider text-[10px]">
                Total Gaji Diterima
              </td>
              <td colSpan="2" className="px-3 py-3 text-right text-sm font-extrabold font-mono text-[#0b6e99] slip-total-gaji-received">
              </td>
            </tr>
          </tbody>
        </table>

        {/* Keterangan Tambahan */}
        <div className="mb-8 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="font-bold text-gray-600 block mb-1">Catatan Keuangan:</span>
          <p className="text-gray-700 italic slip-catatan"></p>
        </div>

        {/* Area Tanda Tangan */}
        <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-dashed border-gray-300">
          <div>
            <p className="text-gray-500 font-semibold mb-12">Penerima (Instruktur)</p>
            <div className="border-b border-black w-40 mx-auto"></div>
            <p className="font-bold text-black mt-1 slip-penerima"></p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold mb-12">Mengetahui (Owner LPK)</p>
            <div className="border-b border-black w-40 mx-auto"></div>
            <p className="font-bold text-black mt-1">Tri Bakti Owner</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[8px] text-gray-400 font-medium">
          Dokumen ini dicetak secara sah melalui sistem informasi LPK Tri Bakti dan merupakan bukti pengeluaran internal resmi.
        </div>
      </div>

      {/* RECAP PRINT-ONLY SECTION */}
      <div className="print-section-recap bg-white text-black p-8 font-sans w-full max-w-[21cm] min-h-[29.7cm] border border-black/10 mx-auto text-xs">
        {/* Header Kop */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={logoTribakti} alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <div className="text-xl font-bold tracking-tight uppercase text-black">
                LPK Tri<span className="text-[#0b6e99]">Bakti</span>
              </div>
              <div className="text-[9px] text-gray-500 font-semibold">
                Jasa Kursus Mengemudi Profesional & Berizin Resmi
              </div>
              <div className="text-[9px] text-gray-500 font-medium mt-0.5">
                Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Kota Payakumbuh, 26218
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Rekap Gaji Instruktur</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Periode Laporan</span>
            <p className="font-bold text-black mt-0.5">
              {riwayatFilterMonth !== 'Semua' ? months.find(m => m.value === Number(riwayatFilterMonth))?.name : 'Semua Bulan'}{' '}
              {riwayatFilterYear !== 'Semua' ? riwayatFilterYear : 'Semua Tahun'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Status & Dicetak Oleh</span>
            <p className="font-bold text-black mt-0.5">
              {riwayatFilterStatus === 'Semua' ? 'Semua Status' : `Status: ${riwayatFilterStatus}`} | {savedUser?.nama_lengkap || 'Owner'}
            </p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
              <th className="px-3 py-2 border-r border-gray-300 w-10 text-center">No</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Periode</th>
              <th className="px-3 py-2 border-r border-gray-300">Nama Instruktur</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Jumlah Sesi</th>
              <th className="px-3 py-2 border-r border-gray-300 text-right">Tarif per Sesi</th>
              <th className="px-3 py-2 border-r border-gray-300 text-right">Total Gaji</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Status</th>
              <th className="px-3 py-2 text-center">Tanggal Bayar</th>
            </tr>
          </thead>
          <tbody>
            {printRecapSlips.map((slip, idx) => (
              <tr key={slip.id || idx} className="border-b border-gray-300 text-xs">
                <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">{slip.bulan_tahun}</td>
                <td className="px-3 py-2 border-r border-gray-300 font-semibold">{slip.instruktur?.nama_lengkap || 'Instruktur'}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">{slip.jumlah_sesi} Sesi</td>
                <td className="px-3 py-2 border-r border-gray-300 text-right font-mono">{formatRupiah(slip.tarif_per_sesi)}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-right font-mono font-bold text-[#0b6e99]">{formatRupiah(slip.total_gaji)}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center uppercase tracking-wider text-[9px] font-bold">{slip.status_pembayaran}</td>
                <td className="px-3 py-2 text-center font-mono">
                  {slip.tanggal_bayar ? new Date(slip.tanggal_bayar).toLocaleDateString('id-ID') : '-'}
                </td>
              </tr>
            ))}
            {/* Grand Total */}
            <tr className="bg-gray-50 font-bold border-t-2 border-black">
              <td colSpan="3" className="px-3 py-2.5 border-r border-gray-300 text-right uppercase tracking-wider text-[9px]">
                Total Keseluruhan
              </td>
              <td className="px-3 py-2.5 border-r border-gray-300 text-center font-mono">
                {printRecapSlips.reduce((sum, s) => sum + s.jumlah_sesi, 0)} Sesi
              </td>
              <td className="px-3 py-2.5 border-r border-gray-300"></td>
              <td colSpan="3" className="px-3 py-2.5 text-left text-sm font-extrabold font-mono text-[#0b6e99]">
                {formatRupiah(printRecapSlips.reduce((sum, s) => sum + s.total_gaji, 0))}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Area Tanda Tangan */}
        <div className="grid grid-cols-2 gap-8 text-center pt-8 border-t border-dashed border-gray-300 mt-12">
          <div>
            <p className="text-gray-500 font-semibold mb-16">Dibuat oleh (Bendahara)</p>
            <div className="border-b border-black w-48 mx-auto"></div>
            <p className="font-bold text-black mt-1">Administrator LPK</p>
          </div>
          <div>
            <p className="text-gray-500 font-semibold mb-16">Mengetahui (Owner LPK)</p>
            <div className="border-b border-black w-48 mx-auto"></div>
            <p className="font-bold text-black mt-1">Tri Bakti Owner</p>
          </div>
        </div>

        <div className="mt-12 text-center text-[8px] text-gray-400 font-medium">
          Dokumen ini dicetak secara sah melalui sistem informasi LPK Tri Bakti dan merupakan bukti pengeluaran internal resmi.
        </div>
      </div>
    </div>
  );
}
