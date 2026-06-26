import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from '../siswa/Footer';
import Swal from 'sweetalert2';
import { 
  ChevronRight, 
  Wallet, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Printer, 
  X, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileText,
  HelpCircle
} from 'lucide-react';

export default function RiwayatGaji() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user'));
  const instrukturId = savedUser?.id;
  const namaInstruktur = savedUser?.nama_lengkap || savedUser?.username || 'Instruktur';

  // State
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMonthData, setLoadingMonthData] = useState(true);
  const [allSlips, setAllSlips] = useState([]);
  
  // Selected Month/Year details
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  
  // Data for selected Month/Year
  const [activeSlip, setActiveSlip] = useState(null);
  const [monthlySessions, setMonthlySessions] = useState([]);
  const [activeRate, setActiveRate] = useState(50000);

  // Modals
  const [selectedSlipForModal, setSelectedSlipForModal] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');

  // Months lists
  const listMonths = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  // Years list (current year - 2 to current year + 1)
  const listYears = [];
  const startYear = today.getFullYear() - 2;
  for (let i = 0; i < 4; i++) {
    listYears.push(startYear + i);
  }

  useEffect(() => {
    if (!instrukturId) {
      navigate('/login');
      return;
    }
    fetchAllSlipsHistory();
  }, [instrukturId]);

  useEffect(() => {
    if (instrukturId) {
      fetchSelectedMonthData();
    }
  }, [instrukturId, selectedMonth, selectedYear]);

  // Load all salary slips (for the history section at the bottom)
  const fetchAllSlipsHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('slip_gaji_instruktur')
        .select('*')
        .eq('instruktur_id', instrukturId)
        .order('bulan_tahun', { ascending: false });

      if (error) throw error;
      setAllSlips(data || []);
    } catch (err) {
      console.error("Gagal memuat seluruh riwayat slip:", err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load calculations or slip details for the chosen month and year
  const fetchSelectedMonthData = async () => {
    setLoadingMonthData(true);
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    
    try {
      // 1. Check if an official locked slip exists
      const { data: slipData, error: slipError } = await supabase
        .from('slip_gaji_instruktur')
        .select('*')
        .eq('instruktur_id', instrukturId)
        .eq('bulan_tahun', monthStr)
        .maybeSingle();

      if (slipError) throw slipError;

      if (slipData) {
        // Locked Slip exists
        setActiveSlip(slipData);
        setMonthlySessions([]);
      } else {
        // No official slip yet, fetch dynamic sessions & config rate
        setActiveSlip(null);

        // Fetch default session tariff
        const { data: configData, error: configError } = await supabase
          .from('pengaturan_gaji')
          .select('tarif_per_sesi')
          .eq('id', 1)
          .maybeSingle();

        const rate = (!configError && configData) ? configData.tarif_per_sesi : 50000;
        setActiveRate(rate);

        // Fetch completed sessions in this specific month
        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
        const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).toISOString();

        const { data: sessionsData, error: sessionsError } = await supabase
          .from('jadwal_latihan')
          .select(`
            id, 
            tanggal_waktu, 
            status, 
            akun_pengguna!akun_id(nama_lengkap), 
            kurikulum(materi)
          `)
          .eq('instruktur_id', instrukturId)
          .eq('status', 'Selesai')
          .gte('tanggal_waktu', startOfMonth)
          .lte('tanggal_waktu', endOfMonth)
          .order('tanggal_waktu', { ascending: true });

        if (sessionsError) throw sessionsError;
        setMonthlySessions(sessionsData || []);
      }
    } catch (err) {
      console.error("Gagal memuat detail gaji bulanan:", err.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat rincian bulan terpilih: ' + err.message,
        confirmButtonColor: '#0b6e99'
      });
    } finally {
      setLoadingMonthData(false);
    }
  };

  // Helper formatting functions
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

  const getMonthName = (monthNum) => {
    const namaBulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return namaBulan[monthNum - 1];
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  const formatTanggal = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const handleOpenSlipModal = (slip) => {
    setSelectedSlipForModal(slip);
    setShowSlipModal(true);
  };

  const handleOpenDraftSlipModal = () => {
    const draftSlip = {
      isDraft: true,
      bulan_tahun: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
      jumlah_sesi: monthlySessions.length,
      tarif_per_sesi: activeRate,
      total_gaji: monthlySessions.length * activeRate,
      status_pembayaran: 'Estimasi Berjalan',
      catatan: 'Ini adalah slip proyeksi berjalan. Total gaji masih bersifat estimasi sampai dikunci oleh Admin.'
    };
    setSelectedSlipForModal(draftSlip);
    setShowSlipModal(true);
  };

  const handleOpenReceipt = (url, period) => {
    if (!url) return;
    setReceiptUrl(url);
    setSelectedSlipForModal({ ...selectedSlipForModal, bulan_tahun: period });
    setShowReceiptModal(true);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  // Calculations for chosen view
  const currentTotalGaji = activeSlip ? activeSlip.total_gaji : monthlySessions.length * activeRate;
  const currentTotalSesi = activeSlip ? activeSlip.jumlah_sesi : monthlySessions.length;
  const currentRate = activeSlip ? activeSlip.tarif_per_sesi : activeRate;
  const currentStatus = activeSlip ? activeSlip.status_pembayaran : 'Estimasi Berjalan';

  // Overall Statistics calculated from locked slips
  const allTimeLunas = allSlips
    .filter(s => s.status_pembayaran === 'Lunas')
    .reduce((sum, s) => sum + s.total_gaji, 0);

  const allTimePending = allSlips
    .filter(s => s.status_pembayaran === 'Belum Dibayar')
    .reduce((sum, s) => sum + s.total_gaji, 0);

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      {/* Printable CSS override */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide main dashboard shell layout and controls */
          aside,
          header,
          footer,
          main,
          .no-print {
            display: none !important;
          }

          /* Reset layout for print wrapper */
          .print-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            z-index: 9999 !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Force modal content to fill the printed page cleanly */
          .print-modal-content {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #print-area {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            display: block !important;
          }

          @page {
            margin: 1.5cm;
          }
        }
      `}} />

      <Sidebar role="instruktur" activeMenu="gaji" />

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        
        {/* Header Panel */}
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Riwayat Gaji</span>
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          
          {/* Header Title */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Wallet className="w-3 h-3 text-[#0b6e99]" />
              Detail Honor & Slip Gaji Bulanan
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Cek Gaji <span className="text-[#0b6e99]">Per Bulan</span>
            </h2>
            <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
              Pilih bulan tertentu untuk melihat total honor, jumlah sesi mengajar yang diselesaikan, status pembayaran, serta cetak bukti slip gaji Anda.
            </p>
          </div>


          {/* Month & Year Selection Box */}
          <div className="bg-white border border-[#e9e9e7] p-6 rounded-2xl mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-base font-bold text-[#37352f]">Pilih Bulan & Tahun</h3>
              <p className="text-xs text-[#37352f]/50 mt-1">Lihat detail pendapatan resmi atau draf estimasi berjalan.</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              {/* Dropdown Bulan */}
              <div className="flex-1 md:w-48">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-3 text-xs font-bold text-[#37352f] outline-none focus:border-[#0b6e99]/30 transition-all cursor-pointer"
                >
                  {listMonths.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown Tahun */}
              <div className="flex-1 md:w-36">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-3 text-xs font-bold text-[#37352f] outline-none focus:border-[#0b6e99]/30 transition-all cursor-pointer"
                >
                  {listYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Month Details Box */}
          <div className="bg-white border border-[#e9e9e7] rounded-3xl overflow-hidden shadow-sm mb-12">
            
            {/* Header Box */}
            <div className="p-6 border-b border-[#e9e9e7] bg-[#fbfbfa] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#37352f] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0b6e99]" />
                  Rincian Periode: {getMonthName(selectedMonth)} {selectedYear}
                </h3>
                <p className="text-[10px] text-[#37352f]/40 font-bold uppercase tracking-widest mt-1">
                  Status Gaji: {currentStatus}
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase border flex items-center gap-1.5 ${
                  currentStatus === 'Lunas'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : currentStatus === 'Belum Dibayar'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-sky-50 text-[#0b6e99] border-sky-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    currentStatus === 'Lunas' ? 'bg-emerald-600' : currentStatus === 'Belum Dibayar' ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                  {currentStatus}
                </span>
              </div>
            </div>

            {/* Loading or Data Block */}
            {loadingMonthData ? (
              <div className="p-24 text-center">
                <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Memuat rincian bulan...</p>
              </div>
            ) : (
              <div className="p-6 md:p-8">
                
                {/* Stats row for selected month */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  
                  <div className="bg-[#fbfbfa] border border-[#e9e9e7] p-5 rounded-2xl">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 block mb-1">Sesi Mengajar Selesai</span>
                    <span className="text-2xl font-bold text-[#37352f]">{currentTotalSesi} Sesi</span>
                  </div>

                  <div className="bg-[#fbfbfa] border border-[#e9e9e7] p-5 rounded-2xl">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 block mb-1">Tarif Per Sesi</span>
                    <span className="text-2xl font-bold text-[#37352f]">{formatRupiah(currentRate)}</span>
                  </div>

                  <div className="bg-[#fbfbfa] border border-[#e9e9e7] p-5 rounded-2xl">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 block mb-1">
                      {activeSlip ? 'Total Gaji Resmi' : 'Estimasi Total Gaji'}
                    </span>
                    <span className="text-2xl font-bold text-[#0b6e99]">{formatRupiah(currentTotalGaji)}</span>
                  </div>

                </div>

                {/* Sub-body for Locked Slip vs Draft */}
                {activeSlip ? (
                  // Case 1: Locked official slip exists
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl gap-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-bold text-emerald-800 text-sm">Gaji Telah Dikunci & Diproses Admin</h4>
                          <p className="text-xs text-[#37352f]/70 mt-1 leading-relaxed">
                            {activeSlip.status_pembayaran === 'Lunas' 
                              ? `Pembayaran telah ditransfer pada ${formatTanggal(activeSlip.tanggal_bayar)}.`
                              : 'Slip gaji resmi telah diterbitkan dan menunggu antrean pembayaran dari admin.'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleOpenSlipModal(activeSlip)}
                          className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#37352f] hover:bg-[#0b6e99] text-white font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat Slip
                        </button>
                        {activeSlip.bukti_pembayaran_url && (
                          <button
                            onClick={() => handleOpenReceipt(activeSlip.bukti_pembayaran_url, activeSlip.bulan_tahun)}
                            className="flex-1 sm:flex-initial px-4 py-2.5 border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center transition-all"
                          >
                            Bukti Transfer
                          </button>
                        )}
                      </div>
                    </div>

                    {activeSlip.catatan && (
                      <div className="p-4 bg-[#efefed] border border-[#e9e9e7] rounded-xl text-xs">
                        <span className="font-bold text-[#37352f]/70 block mb-1">Catatan Admin:</span>
                        <p className="italic text-[#37352f]/80">"{activeSlip.catatan}"</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Case 2: No official slip, show draft estimation and Completed Sessions Audit list
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-sky-50/50 border border-sky-100 rounded-xl text-xs text-sky-900">
                      <AlertCircle className="w-4 h-4 text-[#0b6e99] mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold block">Status: Estimasi Periode Berjalan</span>
                        <p className="text-[#37352f]/70 leading-relaxed mt-1">
                          Periode ini belum dikunci oleh Admin. Anda dapat melihat estimasi total pendapatan Anda berdasarkan sesi latihan berstatus **"Selesai"** yang Anda ajar pada bulan ini.
                        </p>
                        <button
                          onClick={handleOpenDraftSlipModal}
                          className="mt-3 px-3 py-1.5 bg-[#0b6e99] text-white hover:bg-[#0b6e99]/90 font-bold rounded-lg text-[9px] uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Eye className="w-3 h-3" /> Proyeksi Slip Gaji
                        </button>
                      </div>
                    </div>

                    {/* Sessions list */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#37352f]/70 mb-3">
                        Rincian Sesi Mengajar Selesai ({monthlySessions.length} Pertemuan)
                      </h4>
                      
                      {monthlySessions.length > 0 ? (
                        <div className="border border-[#e9e9e7] rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7] sticky top-0">
                                <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/50 text-[9px]">Tanggal / Waktu</th>
                                <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/50 text-[9px]">Siswa</th>
                                <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/50 text-[9px]">Materi Latihan</th>
                                <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/50 text-[9px] text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e9e9e7]">
                              {monthlySessions.map((sesi) => (
                                <tr key={sesi.id} className="hover:bg-[#fbfbfa]/50 transition-colors">
                                  <td className="p-4 font-semibold text-[#37352f]">
                                    {formatTanggal(sesi.tanggal_waktu)}
                                  </td>
                                  <td className="p-4 font-bold text-[#37352f]">
                                    {sesi.akun_pengguna?.nama_lengkap || '-'}
                                  </td>
                                  <td className="p-4 text-[#37352f]/70">
                                    {sesi.kurikulum?.materi || 'Materi Belajar'}
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-bold uppercase tracking-widest rounded">
                                      {sesi.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-[#fbfbfa] border border-dashed border-[#e9e9e7] rounded-2xl">
                          <HelpCircle className="w-8 h-8 text-[#37352f]/20 mx-auto mb-2" />
                          <p className="text-xs text-[#37352f]/40 font-bold uppercase tracking-wider">Tidak ada sesi mengajar selesai</p>
                          <p className="text-[11px] text-[#37352f]/50 mt-0.5">Semua sesi mengajar berstatus "Selesai" pada periode bulan ini akan tampil di sini.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            )}
          </div>

          {/* Locked History Table (bottom) */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#37352f] mb-2">Semua Arsip Slip Gaji Resmi</h3>
            <p className="text-xs text-[#37352f]/50 mb-4">Arsip seluruh slip gaji bulanan yang telah dikunci oleh administrator keuangan.</p>
            
            <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden shadow-sm">
              {loadingHistory ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-3 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-3 mx-auto"></div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40">Memuat arsip...</p>
                </div>
              ) : allSlips.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                        <th className="p-5 font-bold uppercase tracking-wider text-[#37352f]/40 text-[9px]">Bulan Periode</th>
                        <th className="p-5 font-bold uppercase tracking-wider text-[#37352f]/40 text-[9px]">Sesi Diajar</th>
                        <th className="p-5 font-bold uppercase tracking-wider text-[#37352f]/40 text-[9px]">Tarif / Sesi</th>
                        <th className="p-5 font-bold uppercase tracking-wider text-[#37352f]/40 text-[9px]">Total Honor</th>
                        <th className="p-5 font-bold uppercase tracking-wider text-[#37352f]/40 text-[9px]">Status Bayar</th>
                        <th className="p-5 font-bold uppercase tracking-wider text-[#37352f]/40 text-[9px] text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9e9e7]">
                      {allSlips.map((slip) => (
                        <tr key={slip.id} className="hover:bg-[#fbfbfa]/50 transition-colors">
                          <td className="p-5 font-bold text-[#37352f]">
                            {formatBulanTahun(slip.bulan_tahun)}
                          </td>
                          <td className="p-5 font-semibold text-[#37352f]">
                            {slip.jumlah_sesi} Sesi
                          </td>
                          <td className="p-5 text-[#37352f]/60 font-semibold">
                            {formatRupiah(slip.tarif_per_sesi)}
                          </td>
                          <td className="p-5 font-bold text-[#37352f]">
                            {formatRupiah(slip.total_gaji)}
                          </td>
                          <td className="p-5">
                            <span className={`px-2 py-1 rounded text-[8px] font-bold tracking-widest uppercase border ${
                              slip.status_pembayaran === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {slip.status_pembayaran}
                            </span>
                          </td>
                          <td className="p-5 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleOpenSlipModal(slip)}
                                className="px-3.5 py-1.5 bg-[#37352f] hover:bg-[#0b6e99] text-white font-bold rounded-lg text-[9px] uppercase tracking-widest flex items-center gap-1 transition-all"
                              >
                                <Eye className="w-3 h-3" /> Rincian
                              </button>
                              {slip.bukti_pembayaran_url && (
                                <button
                                  onClick={() => handleOpenReceipt(slip.bukti_pembayaran_url, slip.bulan_tahun)}
                                  className="px-3.5 py-1.5 border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 font-bold rounded-lg text-[9px] uppercase tracking-widest transition-all"
                                >
                                  Bukti
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-xs text-[#37352f]/40 font-bold uppercase tracking-wider">Belum ada slip resmi yang diterbitkan admin.</p>
                </div>
              )}
            </div>
          </div>

        </main>
        
        <Footer />
      </div>

      {/* ================= MODAL DETAIL SLIP GAJI ================= */}
      {showSlipModal && selectedSlipForModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print-modal-wrapper">
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#37352f]/20 backdrop-blur-[2px] no-print" onClick={() => setShowSlipModal(false)}></div>
          
          {/* Content */}
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden print-modal-content">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e9e9e7] bg-[#fbfbfa] flex justify-between items-center no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b6e99]/10 text-[#0b6e99] flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#37352f]">
                    {selectedSlipForModal.isDraft ? 'Proyeksi Slip Gaji (Estimasi)' : 'Detail Slip Gaji Resmi'}
                  </h3>
                  <p className="text-[10px] text-[#37352f]/40 font-bold uppercase tracking-wider mt-0.5">
                    Periode {formatBulanTahun(selectedSlipForModal.bulan_tahun)}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSlipModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#efefed] text-[#37352f]/40 hover:text-[#37352f] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Printable Body */}
            <div className="p-8 flex-1 overflow-y-auto space-y-6" id="print-area">
              
              {/* Slip Kop */}
              <div className="flex justify-between items-start border-b-2 border-dashed border-[#e9e9e7] pb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#37352f]">TRIBAKTI</h2>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#0b6e99]">KURSUS MENGEMUDI</p>
                  <p className="text-[10px] text-[#37352f]/50 mt-1">Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Kota Payakumbuh, 26218</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 block mb-1">Status Dokumen</span>
                  <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-bold tracking-widest uppercase border ${
                    selectedSlipForModal.status_pembayaran === 'Lunas' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : selectedSlipForModal.status_pembayaran === 'Belum Dibayar'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-sky-50 text-[#0b6e99] border-sky-100'
                  }`}>
                    {selectedSlipForModal.status_pembayaran}
                  </span>
                </div>
              </div>

              {/* Slip Metadata */}
              <div className="grid grid-cols-2 gap-6 text-xs bg-[#fbfbfa] p-4 rounded-xl border border-[#e9e9e7]">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[#37352f]/40 font-bold uppercase tracking-wider text-[9px]">Penerima Gaji:</span>
                    <p className="font-bold text-[#37352f] text-sm mt-0.5">{namaInstruktur}</p>
                  </div>
                  <div>
                    <span className="text-[#37352f]/40 font-bold uppercase tracking-wider text-[9px]">ID Instruktur:</span>
                    <p className="font-semibold text-[#37352f]">USR-{instrukturId}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-right sm:text-left">
                  <div>
                    <span className="text-[#37352f]/40 font-bold uppercase tracking-wider text-[9px]">Periode Penggajian:</span>
                    <p className="font-bold text-[#37352f] text-sm mt-0.5">{formatBulanTahun(selectedSlipForModal.bulan_tahun)}</p>
                  </div>
                  <div>
                    <span className="text-[#37352f]/40 font-bold uppercase tracking-wider text-[9px]">Tanggal Kalkulasi:</span>
                    <p className="font-semibold text-[#37352f]">
                      {selectedSlipForModal.created_at ? formatTanggal(selectedSlipForModal.created_at) : formatTanggal(new Date().toISOString())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rincian Section */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3">Rincian Honor Pengajaran</h4>
                <div className="border border-[#e9e9e7] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                        <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/60 text-[9px]">Deskripsi Komponen</th>
                        <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/60 text-[9px] text-center">Volume / Sesi</th>
                        <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/60 text-[9px] text-right">Tarif / Satuan</th>
                        <th className="p-4 font-bold uppercase tracking-wider text-[#37352f]/60 text-[9px] text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9e9e7]">
                      <tr>
                        <td className="p-4 font-semibold text-[#37352f]">
                          Honor Latihan Mengemudi
                          <span className="block text-[9px] text-[#37352f]/40 font-normal mt-0.5">Sesi mengajar yang diselesaikan instruktur</span>
                        </td>
                        <td className="p-4 text-center font-bold text-[#37352f]">
                          {selectedSlipForModal.jumlah_sesi} Sesi
                        </td>
                        <td className="p-4 text-right font-semibold text-[#37352f]/70">
                          {formatRupiah(selectedSlipForModal.tarif_per_sesi)}
                        </td>
                        <td className="p-4 text-right font-bold text-[#37352f]">
                          {formatRupiah(selectedSlipForModal.total_gaji)}
                        </td>
                      </tr>
                      {/* Total Bar */}
                      <tr className="bg-[#fbfbfa] font-bold">
                        <td colSpan="3" className="p-4 text-right text-sm uppercase tracking-wider text-[#37352f]/60">
                          {selectedSlipForModal.isDraft ? 'Estimasi Gaji Bersih:' : 'Total Gaji Bersih Diterima:'}
                        </td>
                        <td className="p-4 text-right text-base text-[#0b6e99]">{formatRupiah(selectedSlipForModal.total_gaji)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              {selectedSlipForModal.catatan && (
                <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl">
                  <h5 className="text-[9px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1">Catatan Tambahan:</h5>
                  <p className="text-xs text-[#37352f]/80 leading-relaxed italic">"{selectedSlipForModal.catatan}"</p>
                </div>
              )}

              {/* Status Bukti Transfer Info */}
              {selectedSlipForModal.status_pembayaran === 'Lunas' ? (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#37352f]/60 font-semibold">Tanggal Pembayaran:</span>
                    <span className="font-bold text-emerald-800">{formatTanggal(selectedSlipForModal.tanggal_bayar)}</span>
                  </div>
                </div>
              ) : selectedSlipForModal.status_pembayaran === 'Belum Dibayar' ? (
                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Pembayaran Menunggu Antrean</span>
                    <span className="text-[#37352f]/70 leading-relaxed text-[11px]">Slip ini telah dikalkulasikan secara resmi oleh Admin. Status akan segera diperbarui menjadi Lunas setelah dana ditransfer.</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl flex items-start gap-2.5 text-xs text-sky-800">
                  <AlertCircle className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Estimasi Belum Dikunci</span>
                    <span className="text-[#37352f]/70 leading-relaxed text-[11px]">Data ini bersifat proyeksi real-time. Slip resmi belum diterbitkan oleh Admin.</span>
                  </div>
                </div>
              )}

              {/* Tanda Tangan */}
              <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs mt-8">
                <div className="space-y-16">
                  <p className="text-[#37352f]/40 uppercase tracking-widest font-bold text-[9px]">Penerima (Instruktur)</p>
                  <div>
                    <p className="font-bold text-[#37352f] underline">{namaInstruktur}</p>
                    <p className="text-[10px] text-[#37352f]/40 mt-0.5">Tanggal: ....................</p>
                  </div>
                </div>
                <div className="space-y-16 text-center">
                  <p className="text-[#37352f]/40 uppercase tracking-widest font-bold text-[9px]">Management TriBakti</p>
                  <div>
                    <p className="font-bold text-[#37352f] underline">Direktur Keuangan</p>
                    <p className="text-[10px] text-[#37352f]/40 mt-0.5">TriBakti Driving School</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="p-6 bg-[#fbfbfa] border-t border-[#e9e9e7] flex justify-end gap-3 no-print">
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-5 py-2.5 bg-[#efefed] hover:bg-[#e4e4e7] text-[#37352f] font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintSlip}
                className="px-5 py-2.5 bg-[#0b6e99] hover:bg-[#0b6e99]/90 text-white font-bold rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm shadow-[#0b6e99]/10"
              >
                <Printer className="w-4 h-4" /> Cetak Slip Gaji
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL PREVIEW BUKTI TRANSFER ================= */}
      {showReceiptModal && receiptUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 no-print">
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#37352f]/45 backdrop-blur-[4px]" onClick={() => setShowReceiptModal(false)}></div>
          
          {/* Content */}
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-[#e9e9e7] bg-[#fbfbfa] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-[#37352f]">Bukti Pembayaran Transfer</h3>
                {selectedSlipForModal && (
                  <p className="text-[9px] text-[#0b6e99] font-bold uppercase tracking-widest mt-0.5">
                    Periode {formatBulanTahun(selectedSlipForModal.bulan_tahun)}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#efefed] text-[#37352f]/40 hover:text-[#37352f] flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Body */}
            <div className="p-6 bg-[#fbfbfa] flex items-center justify-center min-h-[300px]">
              <img 
                src={receiptUrl} 
                alt="Bukti Transfer Pembayaran" 
                className="max-h-[60vh] max-w-full object-contain rounded-lg border border-[#e9e9e7] shadow-sm bg-white"
                onError={(e) => {
                  e.target.src = "https://placehold.co/600x400?text=Gambar+Bukti+Pembayaran+Tidak+Dapat+Dimuat";
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#fbfbfa] border-t border-[#e9e9e7] flex justify-between items-center text-xs">
              <span className="text-[#37352f]/50 font-semibold">Tipe: Gambar Lampiran (.png / .jpg)</span>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2.5 bg-[#37352f] hover:bg-[#0b6e99] text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all"
              >
                Tutup Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
