import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import Footer from '../siswa/Footer';
import logoTribakti from '../../assets/logo_tribakti.png';
import Swal from 'sweetalert2';
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
  Settings,
  RefreshCw,
  FileText,
  Trash2,
  Save,
  Search,
  ExternalLink,
  Upload,
  Eye,
  X,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminGajiInstruktur() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  // State Utama
  const [activeTab, setActiveTab] = useState('proses'); // 'proses', 'riwayat', 'pengaturan'
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  
  // Konfigurasi Tarif
  const [tarifPerSesi, setTarifPerSesi] = useState(50000);
  const [savingConfig, setSavingConfig] = useState(false);

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
  const [savedSlips, setSavedSlips] = useState([]); // slip dari database untuk bulan terpilih
  const [allSlipsHistory, setAllSlipsHistory] = useState([]); // semua slip untuk tab riwayat

  // Active slip for printing is now managed synchronously without state to avoid iOS print blocking

  // Modal Upload Bukti Transfer
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSlipForPayment, setSelectedSlipForPayment] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [uploadingPayment, setUploadingPayment] = useState(false);

  // Modal Preview Gambar Bukti Pembayaran
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewInstructorName, setPreviewInstructorName] = useState('');
  const [previewPeriod, setPreviewPeriod] = useState('');

  // List Tahun & Bulan untuk Dropdown
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
        // Tabel tidak ditemukan
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

      // Muat Instruktur beserta profil bank dari tabel instruktur
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

  // Simpan/Perbarui Konfigurasi Tarif
  const handleSaveTarif = async () => {
    setSavingConfig(true);
    try {
      const { error } = await supabase
        .from('pengaturan_gaji')
        .upsert({ id: 1, tarif_per_sesi: tarifPerSesi, updated_at: new Date().toISOString() });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan',
        text: `Tarif flat per sesi telah diperbarui menjadi ${formatRupiah(tarifPerSesi)}`,
        confirmButtonColor: '#0b6e99'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message,
        confirmButtonColor: '#0b6e99'
      });
    } finally {
      setSavingConfig(false);
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

  // Simpan slip gaji satu per satu
  const handleLockSlip = async (instruktur, sesiCount) => {
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const totalGaji = sesiCount * tarifPerSesi;

    try {
      const { error } = await supabase
        .from('slip_gaji_instruktur')
        .insert({
          instruktur_id: instruktur.id,
          bulan_tahun: monthStr,
          jumlah_sesi: sesiCount,
          tarif_per_sesi: tarifPerSesi,
          total_gaji: totalGaji,
          status_pembayaran: 'Belum Dibayar',
          catatan: `Diproses otomatis oleh Admin pada ${new Date().toLocaleDateString('id-ID')}`
        });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Slip Gaji Dikunci',
        text: `Slip gaji untuk ${instruktur.nama_lengkap} periode ${monthStr} berhasil disimpan.`,
        confirmButtonColor: '#0b6e99',
        timer: 1500
      });

      fetchProcessPeriodData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message,
        confirmButtonColor: '#0b6e99'
      });
    }
  };

  // Kunci semua draf slip gaji sekaligus untuk bulan terpilih
  const handleLockAllSlips = async () => {
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const drafts = instrukturList.filter(inst => {
      const hasSlip = savedSlips.some(s => s.instruktur_id === inst.id);
      return !hasSlip;
    });

    if (drafts.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Info',
        text: 'Semua slip gaji untuk bulan ini sudah dikunci.',
        confirmButtonColor: '#0b6e99'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Kunci Semua Slip Gaji?',
      text: `Apakah Anda yakin ingin mengunci dan menyimpan ${drafts.length} slip gaji draf untuk periode ${monthStr}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kunci Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0b6e99',
      cancelButtonColor: '#efefed',
      customClass: {
        confirmButton: 'text-white font-semibold py-2 px-4 rounded-lg cursor-pointer mx-1',
        cancelButton: 'text-[#37352f] font-semibold py-2 px-4 rounded-lg cursor-pointer mx-1'
      },
      buttonsStyling: false
    });

    if (!confirm.isConfirmed) return;

    try {
      const inserts = drafts.map(inst => {
        const sesiCount = getSesiSelesaiCount(inst.id);
        return {
          instruktur_id: inst.id,
          bulan_tahun: monthStr,
          jumlah_sesi: sesiCount,
          tarif_per_sesi: tarifPerSesi,
          total_gaji: sesiCount * tarifPerSesi,
          status_pembayaran: 'Belum Dibayar',
          catatan: `Diproses massal otomatis oleh Admin pada ${new Date().toLocaleDateString('id-ID')}`
        };
      });

      const { error } = await supabase.from('slip_gaji_instruktur').insert(inserts);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: `Berhasil mengunci ${inserts.length} slip gaji untuk periode ${monthStr}.`,
        confirmButtonColor: '#0b6e99'
      });

      fetchProcessPeriodData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message,
        confirmButtonColor: '#0b6e99'
      });
    }
  };

  // Buka Modal Upload Bukti Transfer Gaji
  const handleOpenPaymentModal = (slip, namaInstruktur, bankName, bankAccount) => {
    setSelectedSlipForPayment({ ...slip, namaInstruktur, bankName, bankAccount });
    setPaymentFile(null);
    setPaymentPreviewUrl('');
    setPaymentNote(slip.catatan || '');
    setShowPaymentModal(true);
  };

  // Pilih File Gambar Bukti Transfer
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi Tipe File (hanya gambar)
    if (!file.type.startsWith('image/')) {
      Swal.fire('Format Salah', 'Silakan pilih file gambar bukti transfer (JPG, PNG, WEBP).', 'error');
      return;
    }

    // Validasi Ukuran File (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('File Terlalu Besar', 'Maksimal ukuran file bukti transfer adalah 5MB.', 'error');
      return;
    }

    setPaymentFile(file);
    setPaymentPreviewUrl(URL.createObjectURL(file));
  };

  // Upload Bukti ke Storage & Tandai Slip Lunas
  const handleUploadAndSubmitPayment = async () => {
    if (!paymentFile) {
      Swal.fire('Unggah Bukti', 'Silakan pilih gambar bukti transfer pembayaran terlebih dahulu.', 'warning');
      return;
    }

    setUploadingPayment(true);
    try {
      const fileExt = paymentFile.name.split('.').pop();
      const filePath = `slip_${selectedSlipForPayment.id}_${Date.now()}.${fileExt}`;

      // 1. Upload ke Storage Bucket 'bukti-gaji'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bukti-gaji')
        .upload(filePath, paymentFile);

      if (uploadError) throw uploadError;

      // 2. Ambil Public URL Gambar
      const { data: urlData } = supabase.storage
        .from('bukti-gaji')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;

      // 3. Update Database Slip Gaji
      const { error: dbError } = await supabase
        .from('slip_gaji_instruktur')
        .update({
          status_pembayaran: 'Lunas',
          tanggal_bayar: new Date().toISOString(),
          bukti_pembayaran_url: publicUrl,
          catatan: paymentNote || `Dibayar oleh Admin pada ${new Date().toLocaleDateString('id-ID')}`
        })
        .eq('id', selectedSlipForPayment.id);

      if (dbError) throw dbError;

      Swal.fire({
        icon: 'success',
        title: 'Pembayaran Disimpan',
        text: `Slip gaji ${selectedSlipForPayment.namaInstruktur} berhasil ditandai Lunas dengan bukti transfer.`,
        confirmButtonColor: '#0b6e99'
      });

      // Reset & Refresh
      setShowPaymentModal(false);
      if (activeTab === 'riwayat') {
        fetchAllSlipsHistory();
      }
      fetchProcessPeriodData();
    } catch (err) {
      console.error("Payment error:", err);
      Swal.fire('Gagal Menyimpan', err.message || 'Terjadi kesalahan pengunggahan file', 'error');
    } finally {
      setUploadingPayment(false);
    }
  };

  // Buka Modal Preview Gambar Bukti Pembayaran
  const handleOpenPreviewModal = (slip, namaInstruktur) => {
    setPreviewImageUrl(slip.bukti_pembayaran_url);
    setPreviewInstructorName(namaInstruktur);
    setPreviewPeriod(slip.bulan_tahun);
    setShowPreviewModal(true);
  };

  // Hapus Slip Gaji (Buka Kunci)
  const handleDeleteSlip = async (slipId, namaInstruktur, bulanTahun) => {
    const confirm = await Swal.fire({
      title: 'Buka Kunci Slip Gaji?',
      text: `Menghapus slip gaji ${namaInstruktur} (${bulanTahun}) akan mengembalikannya menjadi draf agar dapat dikalkulasi ulang oleh Admin. Anda yakin?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Slip',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#efefed',
      customClass: {
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer mx-1',
        cancelButton: 'bg-[#efefed] hover:bg-[#e4e4e7] text-[#37352f] font-semibold py-2 px-4 rounded-lg cursor-pointer mx-1'
      },
      buttonsStyling: false
    });

    if (!confirm.isConfirmed) return;

    try {
      const { data: slipData } = await supabase
        .from('slip_gaji_instruktur')
        .select('bukti_pembayaran_url')
        .eq('id', slipId)
        .single();

      if (slipData?.bukti_pembayaran_url) {
        const fileUrl = slipData.bukti_pembayaran_url;
        const parts = fileUrl.split('/');
        const fileName = parts[parts.length - 1];
        if (fileName) {
          await supabase.storage.from('bukti-gaji').remove([fileName]);
        }
      }

      const { error } = await supabase.from('slip_gaji_instruktur').delete().eq('id', slipId);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Slip Gaji Dihapus',
        text: 'Slip gaji berhasil dihapus dan dikembalikan ke draf.',
        confirmButtonColor: '#0b6e99',
        timer: 1500
      });

      if (activeTab === 'riwayat') {
        fetchAllSlipsHistory();
      }
      fetchProcessPeriodData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.message,
        confirmButtonColor: '#0b6e99'
      });
    }
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
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Ada Data',
        text: 'Tidak ada data slip gaji untuk dicetak.',
        confirmButtonColor: '#0b6e99'
      });
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
    const totalSesi = activeSlips.reduce((sum, s) => sum + s.jumlah_sesi, 0) + 
      instrukturList.filter(inst => !savedSlips.some(s => s.instruktur_id === inst.id)).reduce((sum, inst) => sum + getSesiSelesaiCount(inst.id), 0);

    return {
      estimasiTotal: lunasSum + belumBayarSum + draftSlipsSum,
      totalResmi: lunasSum + belumBayarSum,
      totalLunas: lunasSum,
      totalBelumBayar: belumBayarSum,
      totalSesi
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

  // Tampilan ketika tabel belum dikonfigurasi di Supabase (Admin Setup Mode)
  if (!tableExists) {
    return (
      <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
        <AdminSidebar activeMenu="gaji" />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-medium text-[#37352f]/60">Menu Admin</h1>
              <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
              <span className="text-sm font-semibold">Perhitungan Gaji</span>
            </div>
          </header>
          
          <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-[#e9e9e7] p-8 shadow-sm text-center">
              <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tabel Gaji Belum Dikonfigurasi</h2>
              <p className="text-sm text-[#37352f]/60 mb-6 max-w-lg mx-auto">
                Fitur perhitungan gaji memerlukan tabel tambahan di Supabase Anda. 
                Silakan jalankan script SQL berikut di **SQL Editor** di dashboard Supabase Anda untuk mengaktifkan modul ini.
              </p>
              
              <div className="bg-[#efefed] text-left p-4 rounded-xl font-mono text-xs overflow-x-auto border border-[#e9e9e7] max-h-72 mb-6">
                <pre>{`-- 1. Buat tabel pengaturan_gaji
CREATE TABLE IF NOT EXISTS public.pengaturan_gaji (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    tarif_per_sesi INTEGER NOT NULL DEFAULT 50000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Masukkan nilai default
INSERT INTO public.pengaturan_gaji (id, tarif_per_sesi)
VALUES (1, 50000)
ON CONFLICT (id) DO NOTHING;

-- 2. Buat tabel slip_gaji_instruktur
CREATE TABLE IF NOT EXISTS public.slip_gaji_instruktur (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    instruktur_id BIGINT NOT NULL REFERENCES public.akun_pengguna(id) ON DELETE CASCADE,
    bulan_tahun VARCHAR(7) NOT NULL,
    jumlah_sesi INTEGER NOT NULL DEFAULT 0,
    tarif_per_sesi INTEGER NOT NULL DEFAULT 0,
    total_gaji INTEGER NOT NULL DEFAULT 0,
    status_pembayaran VARCHAR(20) NOT NULL DEFAULT 'Belum Dibayar',
    tanggal_bayar TIMESTAMP WITH TIME ZONE,
    bukti_pembayaran_url TEXT,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (instruktur_id, bulan_tahun)
);`}</pre>
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

  // Tampilan Utama Panel Admin Gaji
  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar activeMenu="gaji" />

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        {/* Header Panel */}
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu Admin</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Perhitungan Gaji</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Administrator'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Administrator</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'A').charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          {/* Header Title */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3">
              <Wallet className="w-3 h-3 text-[#0b6e99]" /> Pengelolaan Keuangan & Payroll
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
              Gaji & <span className="text-[#37352f]/40">Kompensasi Instruktur.</span>
            </h2>
            <p className="text-[#37352f]/60 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
              Kelola tarif flat mengajar, proses draf gaji berdasarkan sesi latihan selesai, kunci slip bulanan, tandai pelunasan dengan bukti transfer, dan cetak rekap/slip gaji.
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
              <RefreshCw className="w-4 h-4" /> Proses Gaji Bulanan
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
            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'pengaturan'
                  ? 'bg-white text-[#37352f] shadow-sm'
                  : 'text-[#37352f]/50 hover:text-[#37352f]'
              }`}
            >
              <Settings className="w-4 h-4" /> Pengaturan Tarif
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 text-[#0b6e99] animate-spin mb-4" />
              <p className="text-sm font-semibold text-[#37352f]/60">Memuat Data Payroll...</p>
            </div>
          ) : (
            <>
              {/* TAB PROSES GAJI BULANAN */}
              {activeTab === 'proses' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Period Filter & Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Period Selector */}
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
                        * Data dihitung berdasarkan total sesi latihan dengan status **Selesai**.
                      </div>
                    </div>

                    {/* Stats Box 1 */}
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

                    {/* Stats Box 2 */}
                    <div className="bg-white p-5 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Total Belum Dibayar</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-amber-600">
                          {formatRupiah(stats.totalBelumBayar)}
                        </h3>
                        <p className="text-[10px] text-[#37352f]/50 mt-1">Slip terkunci yang berstatus Belum Dibayar.</p>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                        <Clock className="w-3 h-3" /> Menunggu Payout
                      </div>
                    </div>

                    {/* Stats Box 3 */}
                    <div className="bg-white p-5 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Total Lunas</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-emerald-600">
                          {formatRupiah(stats.totalLunas)}
                        </h3>
                        <p className="text-[10px] text-[#37352f]/50 mt-1">Pembayaran yang sudah selesai ditransfer.</p>
                      </div>
                      <div className="mt-4 flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Berhasil Dibayar
                      </div>
                    </div>
                  </div>

                  {/* Main Calculation Table */}
                  <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-[#e9e9e7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-[#37352f] flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-[#0b6e99]" /> Perhitungan Sesi & Estimasi Gaji
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                          Periode: {months.find(m => m.value === selectedMonth)?.name} {selectedYear}
                        </p>
                      </div>
                      <button
                        onClick={handleLockAllSlips}
                        className="bg-[#0b6e99] hover:bg-[#0b6e99]/90 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#0b6e99]/10"
                      >
                        <Save className="w-4 h-4" /> Kunci Semua Slip
                      </button>
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
                            <th className="px-6 py-4 text-xs font-bold text-[#37352f]/50 uppercase tracking-wider text-center">Tindakan</th>
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
                                          <Clock className="w-3 h-3" /> Dikunci (Unpaid)
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Draf
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      {/* Link ke Detail Sesi Instruktur */}
                                      <button
                                        onClick={() => navigate(`/admin/instruktur/sesi?id=${inst.id}&nama=${encodeURIComponent(inst.nama_lengkap)}`)}
                                        title="Lihat Rincian Sesi Latihan"
                                        className="p-1.5 bg-gray-50 hover:bg-gray-150 border border-gray-200 rounded-lg text-[#37352f]/60 hover:text-[#37352f] transition-all flex items-center justify-center cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Tombol Kunci Slip */}
                                      {!isLocked ? (
                                        <button
                                          onClick={() => handleLockSlip(inst, sesiCount)}
                                          title="Kunci & Simpan Slip Gaji"
                                          className="p-1.5 bg-[#0b6e99]/5 hover:bg-[#0b6e99]/10 border border-[#0b6e99]/20 rounded-lg text-[#0b6e99] font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                                        >
                                          Kunci
                                        </button>
                                      ) : (
                                        <>
                                          {savedSlip.status_pembayaran === 'Belum Dibayar' && (
                                            <button
                                              onClick={() => handleOpenPaymentModal(savedSlip, inst.nama_lengkap, bankName, bankAccount)}
                                              title="Bayar Gaji (Upload Bukti)"
                                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-600 font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                                            >
                                              Bayar
                                            </button>
                                          )}
                                          {savedSlip.status_pembayaran === 'Lunas' && savedSlip.bukti_pembayaran_url && (
                                            <button
                                              onClick={() => handleOpenPreviewModal(savedSlip, inst.nama_lengkap)}
                                              title="Lihat Bukti Transfer"
                                              className="p-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-lg text-sky-600 transition-all flex items-center justify-center cursor-pointer"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handlePrintSlip(savedSlip)}
                                            title="Cetak Slip Gaji"
                                            className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition-all flex items-center justify-center cursor-pointer"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSlip(savedSlip.id, inst.nama_lengkap, `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`)}
                                            title="Buka Kunci (Hapus Slip)"
                                            className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-red-500 transition-all flex items-center justify-center cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
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
                                        {slip.status_pembayaran === 'Belum Dibayar' && (
                                          <button
                                            onClick={() => handleOpenPaymentModal(slip, slip.instruktur?.nama_lengkap || 'Instruktur', bankName, bankAccount)}
                                            title="Tandai Sudah Dibayar (Upload Bukti)"
                                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg text-emerald-600 font-bold text-xs transition-colors cursor-pointer"
                                          >
                                            Bayar
                                          </button>
                                        )}
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
                                          className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[#37352f]/60 hover:text-[#37352f] transition-colors cursor-pointer"
                                        >
                                          <Printer className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSlip(slip.id, slip.instruktur?.nama_lengkap || 'Instruktur', slip.bulan_tahun)}
                                          title="Hapus Slip (Buka Kunci)"
                                          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-red-500 transition-colors cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
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

              {/* TAB PENGATURAN TARIF */}
              {activeTab === 'pengaturan' && (
                <div className="max-w-2xl animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-[#e9e9e7] shadow-sm p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e9e9e7]">
                      <Settings className="w-6 h-6 text-[#0b6e99]" />
                      <div>
                        <h4 className="text-lg font-bold text-[#37352f]">Konfigurasi Tarif Gaji Instruktur</h4>
                        <p className="text-xs text-[#37352f]/50">Tetapkan tarif kompensasi tetap per sesi yang berstatus selesai.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#37352f]/60 block mb-2">
                          Tarif Per Sesi Selesai (Rupiah)
                        </label>
                        <div className="relative max-w-sm">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#37352f]/40 font-mono">Rp</span>
                          <input
                            type="number"
                            value={tarifPerSesi}
                            onChange={(e) => setTarifPerSesi(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="Tarif kompensasi..."
                            className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl pl-12 pr-4 py-3 text-base font-bold font-mono text-[#0b6e99] outline-none focus:border-[#0b6e99] transition-colors"
                          />
                        </div>
                        <p className="text-[11px] text-[#37352f]/40 font-medium mt-2 leading-relaxed">
                          * Tarif ini akan menjadi basis draf perhitungan gaji bulanan. 
                          Mengubah tarif ini **tidak** akan memengaruhi data slip gaji historis yang sudah dikunci (disimpan) oleh Admin sebelumnya.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#e9e9e7]/50">
                        <button
                          onClick={handleSaveTarif}
                          disabled={savingConfig}
                          className="bg-[#0b6e99] hover:bg-[#0b6e99]/90 disabled:bg-[#0b6e99]/40 text-white font-bold py-3 px-6 rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-[#0b6e99]/10"
                        >
                          {savingConfig ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" /> Simpan Konfigurasi
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      {/* MODAL UPLOAD BUKTI PEMBAYARAN */}
      {showPaymentModal && selectedSlipForPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#37352f]/40 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#e9e9e7] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div>
                <h3 className="font-bold text-sm text-[#37352f] uppercase tracking-wider">Input Bukti Pembayaran</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Instruktur: {selectedSlipForPayment.namaInstruktur}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-[#efefed] rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Slip Info */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[#37352f]/60 font-semibold uppercase text-[9px] tracking-wider">Total Gaji Dibayarkan</p>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatRupiah(selectedSlipForPayment.total_gaji)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#37352f]/60 font-semibold uppercase text-[9px] tracking-wider">Periode Slip</p>
                  <p className="text-sm font-bold text-gray-700 mt-0.5 font-mono">{selectedSlipForPayment.bulan_tahun}</p>
                </div>
              </div>

              {/* Bank Account Info */}
              <div className="bg-[#0b6e99]/5 border border-[#0b6e99]/10 rounded-xl p-4 flex items-center gap-3 text-xs">
                <Wallet className="w-5 h-5 text-[#0b6e99] shrink-0" />
                <div>
                  <p className="text-[#37352f]/60 font-semibold uppercase text-[9px] tracking-wider">Rekening Tujuan Transfer</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {selectedSlipForPayment.bankName && selectedSlipForPayment.bankAccount ? (
                      <span className="font-mono text-[#0b6e99]">{selectedSlipForPayment.bankName} - {selectedSlipForPayment.bankAccount}</span>
                    ) : (
                      <span className="text-gray-400 italic font-medium">Belum diisi di profil pengajar</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Upload Drag-Drop Area */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#37352f]/60 block mb-2">Unggah Foto Bukti Transfer</label>
                <div className="border-2 border-dashed border-[#e9e9e7] rounded-xl p-6 text-center hover:border-[#0b6e99]/40 transition-colors relative bg-[#fbfbfa] flex flex-col items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  {paymentPreviewUrl ? (
                    <div className="space-y-3 z-20">
                      <img src={paymentPreviewUrl} alt="Preview" className="max-h-40 object-contain rounded-lg border border-[#e9e9e7] mx-auto shadow-sm" />
                      <p className="text-xs text-[#0b6e99] font-bold flex items-center justify-center gap-1">
                        <ImageIcon className="w-4 h-4" /> {paymentFile.name} ({(paymentFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold">Klik atau seret file lain untuk mengganti</p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-[#37352f]">Pilih file gambar bukti transfer</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Mendukung JPG, PNG, WEBP (Maks. 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan Transaksi */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#37352f]/60 block mb-2">Catatan Transaksi / Keterangan (Opsional)</label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Contoh: Transfer Bank Mandiri ke Rek. BCA Instruktur..."
                  className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#0b6e99] transition-colors resize-none h-20"
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e9e9e7] bg-[#fbfbfa] flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={uploadingPayment}
                className="bg-[#efefed] hover:bg-[#e4e4e7] disabled:opacity-50 text-[#37352f] font-semibold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleUploadAndSubmitPayment}
                disabled={uploadingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                {uploadingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Simpan Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {riwayatFilterStatus === 'Semua' ? 'Semua Status' : `Status: ${riwayatFilterStatus}`} | {savedUser?.nama_lengkap || 'Administrator'}
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
