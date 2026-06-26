import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OwnerSidebar from './OwnerSidebar';
import Footer from '../siswa/Footer';
import logoTribakti from '../../assets/logo_tribaktii.png';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  UserPlus,
  Calendar,
  Download,
  Filter,
  Users,
  User,
  PieChart as PieIcon,
  ChevronRight,
  Printer
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function OwnerLaporanBisnis() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dataPemasukan, setDataPemasukan] = useState([]);
  const [dataPaket, setDataPaket] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [rawDataPengeluaran, setRawDataPengeluaran] = useState([]);
  const [rawDataOperasional, setRawDataOperasional] = useState([]);
  const [financialSummary, setFinancialSummary] = useState([]);
  const [filterType, setFilterType] = useState('bulan'); // 'bulan' atau 'range'
  const [filterBulan, setFilterBulan] = useState('Semua');
  const [cardBulan, setCardBulan] = useState('Semua');
  const [paketBulan, setPaketBulan] = useState('Semua');
  const [historiBulan, setHistoriBulan] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('bulanan'); // 'bulanan' atau 'harian'
  const [ringkasan, setRingkasan] = useState({
    totalPendapatan: 0,
    totalPendaftar: 0,
    rataRataBulanan: 0,
    lakiLaki: 0,
    perempuan: 0
  });

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const COLORS = ['#0b6e99', '#37352f'];
  const PAKET_COLORS = ['#0b6e99', '#37352f', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  const formatBulanTahunIndo = (bulanTahunStr) => {
    if (!bulanTahunStr || !bulanTahunStr.includes('-')) return '';
    const [year, month] = bulanTahunStr.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIndex = parseInt(month, 10) - 1;
    return `${monthNames[mIndex]} ${year}`;
  };

  const getAvailableMonthsCombined = () => {
    const monthsSet = new Set();
    rawData.forEach(item => {
      const m = new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      monthsSet.add(m);
    });
    rawDataPengeluaran.forEach(item => {
      const m = formatBulanTahunIndo(item.bulan_tahun);
      if (m) monthsSet.add(m);
    });
    rawDataOperasional.forEach(item => {
      const m = new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      monthsSet.add(m);
    });
    return ['Semua', ...Array.from(monthsSet)];
  };

  const availableMonths = getAvailableMonthsCombined();

  const getFinancialTrendData = () => {
    const allMonths = new Set();
    rawData.forEach(item => {
      if (item.status === 'Berhasil') {
        const monthLabel = new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        allMonths.add(monthLabel);
      }
    });
    rawDataPengeluaran.forEach(item => {
      const monthLabel = formatBulanTahunIndo(item.bulan_tahun);
      if (monthLabel) allMonths.add(monthLabel);
    });
    rawDataOperasional.forEach(item => {
      const monthLabel = new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      allMonths.add(monthLabel);
    });

    const monthArray = Array.from(allMonths).sort((a, b) => {
      const parseMonthLabel = (label) => {
        const parts = label.split(' ');
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const mIndex = monthNames.indexOf(parts[0]);
        return new Date(parts[1], mIndex);
      };
      return parseMonthLabel(a) - parseMonthLabel(b);
    });

    return monthArray.map(month => {
      const pendaftaranInMonth = rawData.filter(item =>
        item.status === 'Berhasil' &&
        new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === month
      );
      const pemasukan = pendaftaranInMonth.reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0);

      const gajiInMonth = rawDataPengeluaran.filter(item =>
        formatBulanTahunIndo(item.bulan_tahun) === month
      );
      const pengeluaranGaji = gajiInMonth.reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0);

      const operasionalInMonth = rawDataOperasional.filter(item =>
        new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === month
      );
      const pengeluaranOperasional = operasionalInMonth.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

      return {
        month,
        pemasukan,
        pengeluaran: pengeluaranGaji + pengeluaranOperasional,
        laba: pemasukan - (pengeluaranGaji + pengeluaranOperasional)
      };
    });
  };

  const financialTrendData = getFinancialTrendData();

  useEffect(() => {
    fetchLaporanData();
  }, []);

  useEffect(() => {
    calculateDerivedData();
  }, [rawData, rawDataPengeluaran, rawDataOperasional, filterBulan, filterType, startDate, endDate, viewMode, paketBulan]);

  const getFilteredData = () => {
    if (filterType === 'bulan') {
      if (filterBulan === 'Semua') return rawData;
      return rawData.filter(item =>
        new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === filterBulan
      );
    } else {
      let filtered = [...rawData];
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(item => new Date(item.created_at) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(item => new Date(item.created_at) <= end);
      }
      return filtered;
    }
  };

  const filteredData = getFilteredData();
  const displayedHistoriData = rawData.filter(item => {
    if (historiBulan === 'Semua') return true;
    const monthLabel = new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    return monthLabel === historiBulan;
  });

  const calculateDerivedData = () => {
    const filtered = getFilteredData();
    const groupedMap = {};
    const paketMap = {};
    let totalUang = 0;
    let successTransactionsCount = 0;

    const sortedData = [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    sortedData.forEach(item => {
      const paket = item.paket_pilihan || 'Belum Pilih Paket';
      const itemMonth = new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      const matchesPaketBulan = paketBulan === 'Semua' || itemMonth === paketBulan;

      if (matchesPaketBulan) {
        if (!paketMap[paket]) {
          paketMap[paket] = { name: paket, value: 0, revenue: 0 };
        }
        paketMap[paket].value += 1;
      }

      if (item.status === 'Berhasil') {
        const nominal = Number(item.total_bayar) || 0;
        if (matchesPaketBulan && paketMap[paket]) {
          paketMap[paket].revenue += nominal;
        }
        totalUang += nominal;
        successTransactionsCount += 1;

        const date = new Date(item.created_at);
        const key = viewMode === 'bulanan'
          ? date.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
          : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        if (!groupedMap[key]) {
          groupedMap[key] = { label: key, total: 0, count: 0 };
        }
        groupedMap[key].total += nominal;
        groupedMap[key].count += 1;
      }
    });

    const dataPemasukanArray = Object.values(groupedMap);

    setDataPemasukan(dataPemasukanArray);
    setDataPaket(Object.values(paketMap).sort((a, b) => b.value - a.value));

    const totalPeriode = dataPemasukanArray.length || 1;
    const rataRata = totalUang / totalPeriode;

    setRingkasan({
      totalPendapatan: totalUang,
      totalPendaftar: successTransactionsCount,
      rataRataBulanan: rataRata,
      lakiLaki: 0,
      perempuan: 0
    });

    // Hitung Ringkasan Finansial Gabungan (Pemasukan vs Pengeluaran Gaji & Ops) per Bulan untuk Tabel Arus Kas
    const monthsSet = new Set();
    rawData.forEach(item => {
      if (item.status === 'Berhasil') {
        const m = new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        monthsSet.add(m);
      }
    });
    rawDataPengeluaran.forEach(item => {
      const m = formatBulanTahunIndo(item.bulan_tahun);
      if (m) monthsSet.add(m);
    });
    rawDataOperasional.forEach(item => {
      const m = new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      monthsSet.add(m);
    });

    const monthList = Array.from(monthsSet).sort((a, b) => {
      const parseMonthLabel = (label) => {
        const parts = label.split(' ');
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const mIndex = monthNames.indexOf(parts[0]);
        return new Date(parts[1], mIndex);
      };
      return parseMonthLabel(b) - parseMonthLabel(a); // Descending (terbaru di atas)
    });

    const summaryData = monthList.map(month => {
      const pendaftaranInMonth = rawData.filter(item =>
        item.status === 'Berhasil' &&
        new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === month
      );
      const pemasukan = pendaftaranInMonth.reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0);
      const pendaftarCount = pendaftaranInMonth.length;

      const gajiInMonth = rawDataPengeluaran.filter(item =>
        formatBulanTahunIndo(item.bulan_tahun) === month
      );
      const pengeluaran = gajiInMonth.reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0);

      const operasionalInMonth = rawDataOperasional.filter(item =>
        new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === month
      );
      const pengeluaranOperasional = operasionalInMonth.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

      return {
        label: month,
        pemasukan,
        pengeluaran,
        pengeluaranOperasional,
        laba: pemasukan - (pengeluaran + pengeluaranOperasional),
        pendaftarCount
      };
    });

    setFinancialSummary(summaryData);
  };

  const fetchLaporanData = async () => {
    setLoading(true);
    try {
      // 1. Ambil Data Pemasukan
      const { data: pendaftaranData, error: pendaftaranError } = await supabase
        .from('pendaftaran')
        .select('id, created_at, nama_lengkap, no_whatsapp, paket_pilihan, total_bayar, status, jenis_kelamin')
        .order('created_at', { ascending: false });

      if (pendaftaranError) throw pendaftaranError;
      setRawData(pendaftaranData || []);

      // 2. Ambil Data Pengeluaran (Slip Gaji Instruktur)
      const { data: gajiData, error: gajiError } = await supabase
        .from('slip_gaji_instruktur')
        .select('id, created_at, bulan_tahun, total_gaji, status_pembayaran, tanggal_bayar')
        .order('bulan_tahun', { ascending: false });

      if (gajiError) {
        console.error("Gagal mengambil data pengeluaran:", gajiError.message);
      } else {
        setRawDataPengeluaran(gajiData || []);
      }

      // 3. Ambil Data Pengeluaran Operasional
      const { data: operasionalData, error: operasionalError } = await supabase
        .from('pengeluaran_operasional')
        .select('id, tanggal, kategori, nominal, keterangan, bukti_url, created_at')
        .order('tanggal', { ascending: false });

      if (operasionalError) {
        console.error("Gagal mengambil data operasional:", operasionalError.message);
      } else {
        setRawDataOperasional(operasionalData || []);
      }
    } catch (err) {
      console.error("Laporan Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintKeuangan = () => {
    const excelPendaftaranAll = cardBulan === 'Semua'
      ? rawData
      : rawData.filter(item => new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan);

    const excelOperasional = cardBulan === 'Semua'
      ? rawDataOperasional
      : rawDataOperasional.filter(item => new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan);

    if (excelPendaftaranAll.length === 0 && excelOperasional.length === 0) {
      return alert("Tidak ada data untuk periode ini");
    }

    document.body.classList.add('print-mode-keuangan');
    const cleanup = () => {
      document.body.classList.remove('print-mode-keuangan');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handlePrintPaket = () => {
    if (dataPaket.length === 0) return alert("Tidak ada data paket untuk dicetak");
    document.body.classList.add('print-mode-paket');
    const cleanup = () => {
      document.body.classList.remove('print-mode-paket');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const handlePrintHistori = () => {
    if (displayedHistoriData.length === 0) return alert("Tidak ada data histori untuk dicetak");
    document.body.classList.add('print-mode-histori');
    const cleanup = () => {
      document.body.classList.remove('print-mode-histori');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const printKeuanganPemasukan = cardBulan === 'Semua'
    ? rawData.filter(item => item.status === 'Berhasil').reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0)
    : rawData.filter(item => item.status === 'Berhasil' && new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan).reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0);

  const printKeuanganGaji = cardBulan === 'Semua'
    ? rawDataPengeluaran.reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0)
    : rawDataPengeluaran.filter(item => formatBulanTahunIndo(item.bulan_tahun) === cardBulan).reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0);

  const printKeuanganOperasional = cardBulan === 'Semua'
    ? rawDataOperasional.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)
    : rawDataOperasional.filter(item => new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan).reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  const printKeuanganOperasionalList = cardBulan === 'Semua'
    ? rawDataOperasional
    : rawDataOperasional.filter(item => new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan);

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <div className="print:hidden">
        <OwnerSidebar activeMenu="laporan" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Laporan Bisnis</span>
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
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <BarChart3 className="w-3 h-3 text-[#0b6e99]" />
              Business Report
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Laporan Bisnis <span className="text-[#37352f]/40">TriBakti.</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <p className="text-[#37352f]/60 text-sm md:text-base max-w-2xl leading-relaxed font-medium">Laporan mendalam performa finansial dan pertumbuhan siswa.</p>
          </div>

          {/* Filter Bar removed */}

          {/* Stats Summary Card & Filter */}
          <div className="bg-white p-6 rounded-2xl border border-[#e9e9e7] shadow-sm mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h4 className="text-sm font-bold text-[#37352f]/40 uppercase tracking-widest">Periode Laporan Keuangan</h4>
                <p className="text-xs text-[#37352f]/60 font-semibold mt-1">Pilih periode untuk menyaring data pemasukan, pengeluaran, dan laba bersih.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <div className="flex items-center gap-1.5 bg-[#efefed] px-3 py-1.5 rounded-xl border border-[#e9e9e7]">
                  <Calendar className="w-4 h-4 text-[#0b6e99]" />
                  <select
                    value={cardBulan}
                    onChange={(e) => setCardBulan(e.target.value)}
                    className="text-xs font-bold text-[#37352f] outline-none bg-transparent cursor-pointer py-0.5"
                  >
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handlePrintKeuangan}
                  className="flex items-center gap-2 bg-[#efefed] hover:bg-[#0b6e99] text-[#37352f]/60 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-[#e9e9e7] shadow-sm"
                  title="Cetak Laporan Keuangan"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Laporan
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Pemasukan */}
              <div className="bg-emerald-50/20 border border-emerald-100 p-6 rounded-2xl hover:border-emerald-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/50">Total Pemasukan (Kotor)</p>
                    <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono">
                    Rp {
                      (cardBulan === 'Semua'
                        ? rawData.filter(item => item.status === 'Berhasil').reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0)
                        : rawData.filter(item => item.status === 'Berhasil' && new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan).reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0)
                      ).toLocaleString('id-ID')
                    }
                  </h3>
                </div>
                <p className="text-[10px] text-emerald-600/70 font-semibold mt-4">Total pendaftaran siswa terverifikasi</p>
              </div>

              {/* Card 2: Pengeluaran */}
              <div className="bg-amber-50/20 border border-amber-100 p-6 rounded-2xl hover:border-amber-200 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/50">Total Pengeluaran</p>
                    <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 font-mono">
                    Rp {
                      (() => {
                        const gaji = cardBulan === 'Semua'
                          ? rawDataPengeluaran.reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0)
                          : rawDataPengeluaran.filter(item => formatBulanTahunIndo(item.bulan_tahun) === cardBulan).reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0);

                        const operasional = cardBulan === 'Semua'
                          ? rawDataOperasional.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)
                          : rawDataOperasional.filter(item => new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan).reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

                        return (gaji + operasional).toLocaleString('id-ID');
                      })()
                    }
                  </h3>
                </div>
                <div className="mt-4 pt-2 border-t border-amber-100/50 flex justify-between text-[9px] text-amber-700/80 font-bold uppercase tracking-tight">
                  <span>Gaji: Rp {
                    (cardBulan === 'Semua'
                      ? rawDataPengeluaran.reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0)
                      : rawDataPengeluaran.filter(item => formatBulanTahunIndo(item.bulan_tahun) === cardBulan).reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0)
                    ).toLocaleString('id-ID')
                  }</span>
                  <span>Ops: Rp {
                    (cardBulan === 'Semua'
                      ? rawDataOperasional.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)
                      : rawDataOperasional.filter(item => new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan).reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)
                    ).toLocaleString('id-ID')
                  }</span>
                </div>
              </div>

              {/* Card 3: Laba Bersih */}
              {(() => {
                const totalPemasukan = cardBulan === 'Semua'
                  ? rawData.filter(item => item.status === 'Berhasil').reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0)
                  : rawData.filter(item => item.status === 'Berhasil' && new Date(item.created_at).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan).reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0);

                const totalGaji = cardBulan === 'Semua'
                  ? rawDataPengeluaran.reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0)
                  : rawDataPengeluaran.filter(item => formatBulanTahunIndo(item.bulan_tahun) === cardBulan).reduce((sum, item) => sum + (Number(item.total_gaji) || 0), 0);

                const totalOps = cardBulan === 'Semua'
                  ? rawDataOperasional.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0)
                  : rawDataOperasional.filter(item => new Date(item.tanggal).toLocaleString('id-ID', { month: 'long', year: 'numeric' }) === cardBulan).reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

                const labaBersih = totalPemasukan - (totalGaji + totalOps);
                const isProfit = labaBersih >= 0;

                return (
                  <div className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${isProfit
                      ? 'bg-sky-50/20 border-sky-100 hover:border-sky-200'
                      : 'bg-rose-50/20 border-rose-100 hover:border-rose-200'
                    }`}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/50">Estimasi Laba Bersih</p>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isProfit ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                          {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                      </div>
                      <h3 className={`text-xl sm:text-2xl font-extrabold font-mono ${isProfit ? 'text-sky-600' : 'text-rose-600'
                        }`}>
                        Rp {labaBersih.toLocaleString('id-ID')}
                      </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest w-fit">
                      {isProfit ? (
                        <span className="bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md">Surplus Keuangan</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">Defisit Keuangan</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Tren Finansial Bulanan Chart */}
          <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-sm mb-10 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#e9e9e7] flex justify-between items-center">
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-[#37352f] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0b6e99]" /> Tren Keuangan Bulanan
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                  Perbandingan Pemasukan Pendaftaran, Pengeluaran Gaji Instruktur, dan Laba Bersih
                </p>
              </div>
            </div>
            <div className="p-5 sm:p-8 h-[350px] w-full">
              {financialTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialTrendData}>
                    <defs>
                      <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0b6e99" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0b6e99" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" />
                    <XAxis dataKey="month" stroke="#37352f" fontSize={10} tickLine={false} />
                    <YAxis stroke="#37352f" fontSize={10} tickLine={false} tickFormatter={(val) => `Rp ${val.toLocaleString('id-ID')}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e9e9e7', backgroundColor: '#ffffff', fontSize: '12px' }}
                      formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    <Area type="monotone" name="Pemasukan Kotor" dataKey="pemasukan" stroke="#10b981" fillOpacity={1} fill="url(#colorPemasukan)" strokeWidth={2.5} />
                    <Area type="monotone" name="Total Pengeluaran" dataKey="pengeluaran" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPengeluaran)" strokeWidth={2.5} />
                    <Area type="monotone" name="Laba Bersih" dataKey="laba" stroke="#0b6e99" fillOpacity={1} fill="url(#colorLaba)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#37352f]/40 font-medium italic">
                  Belum ada data finansial yang memadai untuk grafik.
                </div>
              )}
            </div>
          </div>

          {/* Laporan Distribusi Paket Kursus */}
          <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-sm mb-10 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#e9e9e7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-[#37352f] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0b6e99]" /> Distribusi Paket Kursus
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                  Analisis popularitas dan kontribusi pendapatan masing-masing paket kursus
                </p>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto no-print">
                <div className="flex items-center gap-1.5 bg-[#efefed] px-2.5 py-1.5 rounded-xl border border-[#e9e9e7]">
                  <select
                    value={paketBulan}
                    onChange={(e) => setPaketBulan(e.target.value)}
                    className="text-[10px] font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
                  >
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handlePrintPaket}
                  className="flex items-center gap-2 bg-[#efefed] hover:bg-[#0b6e99] text-[#37352f]/60 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-[#e9e9e7] shadow-sm"
                  title="Cetak Laporan Distribusi Paket"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Laporan
                </button>
              </div>
            </div>
            <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center">
              <div className="lg:col-span-5 h-[280px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPaket}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dataPaket.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PAKET_COLORS[index % PAKET_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e9e9e7', backgroundColor: '#ffffff' }}
                      formatter={(value, name, props) => [
                        `${value} Pendaftar (Rp ${props.payload.revenue.toLocaleString('id-ID')})`,
                        name
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dataPaket.map((item, idx) => (
                    <div key={item.name} className="p-4 rounded-2xl border border-[#e9e9e7] bg-[#fbfbfa] flex flex-col justify-between hover:border-[#0b6e99]/20 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: PAKET_COLORS[idx % PAKET_COLORS.length] }}
                        />
                        <span className="text-xs font-bold text-[#37352f] truncate">{item.name}</span>
                      </div>
                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-[#e9e9e7]/50">
                        <div>
                          <p className="text-[9px] font-bold text-[#37352f]/40 uppercase tracking-wider leading-none mb-0.5">Jumlah Siswa</p>
                          <p className="text-sm font-extrabold text-[#37352f]">{item.value} Pendaftar</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-[#37352f]/40 uppercase tracking-wider leading-none mb-0.5">Total Pendapatan</p>
                          <p className="text-sm font-extrabold text-[#0b6e99]">Rp {item.revenue.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {dataPaket.length === 0 && (
                    <p className="col-span-2 text-center text-xs text-[#37352f]/40 font-medium italic py-8">Belum ada data paket.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Laporan Arus Kas Bulanan */}
          <div className="bg-white rounded-2xl border border-[#e9e9e7] overflow-hidden shadow-sm mb-10">
            <div className="p-5 sm:p-6 border-b border-[#e9e9e7] flex justify-between items-center">
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-[#37352f]">
                  Laporan Arus Kas Bulanan
                </h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                  Akumulasi Pemasukan Kotor, Pengeluaran Gaji Instruktur, dan Estimasi Laba Bersih per Periode
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Bulan</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Jumlah Pendaftar</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Pemasukan Kotor</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Pengeluaran Gaji</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Pengeluaran Operasional</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Laba Bersih</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {financialSummary.length > 0 ? (
                    financialSummary.map((item, idx) => (
                      <tr key={idx} className="text-sm hover:bg-[#fbfbfa] transition-colors">
                        <td className="px-8 py-4">
                          <button
                            onClick={() => navigate(`/owner/laporan/detail?periode=${encodeURIComponent(item.label)}&type=bulanan`)}
                            className="font-bold text-[#0b6e99] hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
                          >
                            {item.label}
                          </button>
                        </td>
                        <td className="px-8 py-4 text-center font-semibold text-[#37352f]/70">{item.pendaftarCount} Siswa</td>
                        <td className="px-8 py-4 text-right font-bold text-emerald-600">Rp {item.pemasukan.toLocaleString('id-ID')}</td>
                        <td className="px-8 py-4 text-right font-bold text-amber-600">Rp {item.pengeluaran.toLocaleString('id-ID')}</td>
                        <td className="px-8 py-4 text-right font-bold text-rose-500">Rp {item.pengeluaranOperasional.toLocaleString('id-ID')}</td>
                        <td className={`px-8 py-4 text-right font-extrabold ${item.laba >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                          Rp {item.laba.toLocaleString('id-ID')}
                        </td>
                        <td className="px-8 py-4 text-center">
                          <button
                            onClick={() => navigate(`/owner/laporan/detail?periode=${encodeURIComponent(item.label)}&type=bulanan`)}
                            className="inline-flex items-center gap-1 bg-[#0b6e99]/5 hover:bg-[#0b6e99] text-[#0b6e99] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-[#0b6e99]/20 cursor-pointer shadow-sm"
                          >
                            Rincian Siswa
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7" className="px-8 py-10 text-center opacity-50 italic">Belum ada data finansial.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="bg-white rounded-2xl border border-[#e9e9e7] overflow-hidden shadow-sm">
            <div className="p-5 sm:p-6 border-b border-[#e9e9e7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-[#37352f]">Histori Transaksi</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Daftar Lengkap Catatan Histori Pendaftaran</p>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto no-print">
                <div className="flex items-center gap-1.5 bg-[#efefed] px-2.5 py-1.5 rounded-xl border border-[#e9e9e7]">
                  <select
                    value={historiBulan}
                    onChange={(e) => setHistoriBulan(e.target.value)}
                    className="text-[10px] font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
                  >
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handlePrintHistori}
                  className="flex items-center gap-2 bg-[#efefed] hover:bg-[#0b6e99] text-[#37352f]/60 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-[#e9e9e7] shadow-sm"
                  title="Cetak Histori Transaksi"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Histori
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Tanggal</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Siswa</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Paket</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Nominal</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr><td colSpan="5" className="px-8 py-10 text-center opacity-50">Memuat data...</td></tr>
                  ) : displayedHistoriData.length > 0 ? (
                    displayedHistoriData.map((item) => (
                      <tr key={item.id} className="text-sm hover:bg-[#fbfbfa] transition-colors">
                        <td className="px-8 py-4 font-medium text-[#37352f]/60">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="px-8 py-4 font-bold text-[#37352f]">{item.nama_lengkap}</td>
                        <td className="px-8 py-4"><span className="px-3 py-1 bg-[#efefed] rounded-md text-[10px] font-bold border border-[#e9e9e7]">{item.paket_pilihan}</span></td>
                        <td className="px-8 py-4 text-right font-bold text-[#37352f]">Rp {(item.total_bayar || 0).toLocaleString('id-ID')}</td>
                        <td className="px-8 py-4 text-center">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-bold border ${item.status === 'Berhasil' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="px-8 py-10 text-center opacity-50 italic">Tidak ada data ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* STYLE FOR MEDIA PRINT CONTROLS */}
      <style dangerouslySetInnerHTML={{__html: `
        .print-section-keuangan,
        .print-section-paket,
        .print-section-histori {
          display: none !important;
        }
        @media print {
          .print-section-keuangan,
          .print-section-paket,
          .print-section-histori {
            display: none !important;
          }
          body.print-mode-keuangan .print-section-keuangan {
            display: block !important;
          }
          body.print-mode-paket .print-section-paket {
            display: block !important;
          }
          body.print-mode-histori .print-section-histori {
            display: block !important;
          }
        }
      `}} />

      {/* PRINT-ONLY KEUANGAN */}
      <div className="print-section-keuangan bg-white text-black p-8 font-sans w-full max-w-[21cm] min-h-[29.7cm] border border-black/10 mx-auto text-xs">
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
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Keuangan Eksekutif</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Periode Laporan</span>
            <p className="font-bold text-black mt-0.5">{cardBulan}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Dicetak Oleh</span>
            <p className="font-bold text-black mt-0.5">{savedUser?.nama_lengkap || 'Owner'}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Ringkasan */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border border-gray-300 p-3 rounded-lg bg-gray-50/50">
              <p className="text-[9px] uppercase font-bold text-gray-500">Total Pemasukan (Kotor)</p>
              <p className="text-base font-bold text-emerald-600 font-mono mt-1">Rp {printKeuanganPemasukan.toLocaleString('id-ID')}</p>
            </div>
            <div className="border border-gray-300 p-3 rounded-lg bg-gray-50/50">
              <p className="text-[9px] uppercase font-bold text-gray-500">Total Pengeluaran</p>
              <p className="text-base font-bold text-amber-600 font-mono mt-1">Rp {(printKeuanganGaji + printKeuanganOperasional).toLocaleString('id-ID')}</p>
              <p className="text-[8px] text-gray-400 mt-1">Gaji: Rp {printKeuanganGaji.toLocaleString('id-ID')} | Ops: Rp {printKeuanganOperasional.toLocaleString('id-ID')}</p>
            </div>
            <div className="border border-gray-300 p-3 rounded-lg bg-gray-50/50">
              <p className="text-[9px] uppercase font-bold text-gray-500">Estimasi Laba Bersih</p>
              <p className={`text-base font-bold font-mono mt-1 ${(printKeuanganPemasukan - (printKeuanganGaji + printKeuanganOperasional)) >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                Rp {(printKeuanganPemasukan - (printKeuanganGaji + printKeuanganOperasional)).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Arus Kas */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-black">Arus Kas Bulanan</h3>
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
                  <th className="px-3 py-2 border-r border-gray-300">Bulan</th>
                  <th className="px-3 py-2 border-r border-gray-300 text-center">Jumlah Pendaftar</th>
                  <th className="px-3 py-2 border-r border-gray-300 text-right">Pemasukan Kotor</th>
                  <th className="px-3 py-2 border-r border-gray-300 text-right">Pengeluaran Gaji</th>
                  <th className="px-3 py-2 border-r border-gray-300 text-right">Pengeluaran Ops</th>
                  <th className="px-3 py-2 text-right">Laba Bersih</th>
                </tr>
              </thead>
              <tbody>
                {financialSummary.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-300 text-xs">
                    <td className="px-3 py-2 border-r border-gray-300 font-semibold">{item.label}</td>
                    <td className="px-3 py-2 border-r border-gray-300 text-center">{item.pendaftarCount} Siswa</td>
                    <td className="px-3 py-2 border-r border-gray-300 text-right font-mono text-emerald-600">Rp {item.pemasukan.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2 border-r border-gray-300 text-right font-mono text-amber-600">Rp {item.pengeluaran.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-2 border-r border-gray-300 text-right font-mono text-rose-500">Rp {item.pengeluaranOperasional.toLocaleString('id-ID')}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${(item.laba >= 0) ? 'text-sky-600' : 'text-rose-600'}`}>Rp {item.laba.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rincian Ops */}
          <div className="page-break-before">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 mt-4 text-black">Detail Pengeluaran Operasional</h3>
            <table className="w-full text-left border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
                  <th className="px-3 py-2 border-r border-gray-300 text-center w-10">No</th>
                  <th className="px-3 py-2 border-r border-gray-300 text-center">Tanggal</th>
                  <th className="px-3 py-2 border-r border-gray-300">Kategori</th>
                  <th className="px-3 py-2 border-r border-gray-300 text-right">Nominal</th>
                  <th className="px-3 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {printKeuanganOperasionalList.length > 0 ? (
                  printKeuanganOperasionalList.map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-gray-300 text-xs">
                      <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                      <td className="px-3 py-2 border-r border-gray-300 text-center">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="px-3 py-2 border-r border-gray-300 font-semibold">{item.kategori}</td>
                      <td className="px-3 py-2 border-r border-gray-300 text-right font-mono text-rose-500">Rp {Number(item.nominal).toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2">{item.keterangan || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 py-4 text-center text-gray-400 italic">Tidak ada detail pengeluaran operasional.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-48">
            <p className="text-gray-500 mb-16 text-[10px]">Mengetahui,<br />Pimpinan LPK TriBakti</p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold text-black mt-1">Rifo Raihan</p>
            <p className="text-[9px] text-gray-500">Direktur Utama</p>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY PAKET */}
      <div className="print-section-paket bg-white text-black p-8 font-sans w-full max-w-[21cm] min-h-[29.7cm] border border-black/10 mx-auto text-xs">
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
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Distribusi Paket Kursus</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Periode Laporan</span>
            <p className="font-bold text-black mt-0.5">{paketBulan}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Dicetak Oleh</span>
            <p className="font-bold text-black mt-0.5">{savedUser?.nama_lengkap || 'Owner'}</p>
          </div>
        </div>

        <div>
          <table className="w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
                <th className="px-3 py-2 border-r border-gray-300 text-center w-12">No</th>
                <th className="px-3 py-2 border-r border-gray-300">Nama Paket Kursus</th>
                <th className="px-3 py-2 border-r border-gray-300 text-center">Jumlah Siswa</th>
                <th className="px-3 py-2 text-right">Total Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {dataPaket.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-300 text-xs">
                  <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-gray-300 font-semibold">{item.name}</td>
                  <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">{item.value} Siswa</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-[#0b6e99]">Rp {item.revenue.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Section */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-48">
            <p className="text-gray-500 mb-16 text-[10px]">Mengetahui,<br />Pimpinan LPK TriBakti</p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold text-black mt-1">Rifo Raihan</p>
            <p className="text-[9px] text-gray-500">Direktur Utama</p>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY HISTORI */}
      <div className="print-section-histori bg-white text-black p-8 font-sans w-full max-w-[21cm] min-h-[29.7cm] border border-black/10 mx-auto text-xs">
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
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Histori Transaksi Pendaftaran</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Periode Laporan</span>
            <p className="font-bold text-black mt-0.5">{historiBulan}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Dicetak Oleh</span>
            <p className="font-bold text-black mt-0.5">{savedUser?.nama_lengkap || 'Owner'}</p>
          </div>
        </div>

        <div>
          <table className="w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
                <th className="px-3 py-2 border-r border-gray-300 text-center w-12">No</th>
                <th className="px-3 py-2 border-r border-gray-300 text-center">Tanggal</th>
                <th className="px-3 py-2 border-r border-gray-300">Nama Siswa</th>
                <th className="px-3 py-2 border-r border-gray-300">Paket Kursus</th>
                <th className="px-3 py-2 border-r border-gray-300 text-right">Nominal</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedHistoriData.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-gray-300 text-xs">
                  <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="px-3 py-2 border-r border-gray-300 font-semibold">{item.nama_lengkap}</td>
                  <td className="px-3 py-2 border-r border-gray-300">{item.paket_pilihan}</td>
                  <td className="px-3 py-2 border-r border-gray-300 text-right font-mono font-bold text-gray-700">Rp {Number(item.total_bayar).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2 text-center uppercase tracking-wider text-[9px] font-bold">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Section */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-48">
            <p className="text-gray-500 mb-16 text-[10px]">Mengetahui,<br />Pimpinan LPK TriBakti</p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold text-black mt-1">Rifo Raihan</p>
            <p className="text-[9px] text-gray-500">Direktur Utama</p>
          </div>
        </div>
      </div>
    </div>
  );
}
