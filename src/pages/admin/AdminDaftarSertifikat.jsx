import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import Swal from 'sweetalert2';
import * as htmlToImage from 'html-to-image';
import logoTribakti from '../../assets/logo_tribaktii.png';
import {
  Award,
  Search,
  Eye,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  ChevronRight,
  Printer
} from 'lucide-react';

export default function AdminDaftarSertifikat() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('daftar'); // 'daftar' atau 'penerbitan'
  const [sertifikat, setSertifikat] = useState([]);
  const [antrean, setAntrean] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [issuing, setIssuing] = useState(false);

  // State untuk data siswa yang sedang diproses (untuk rendering hidden)
  const [processingSiswa, setProcessingSiswa] = useState(null);
  const hiddenCertRef = useRef(null);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (activeTab === 'daftar') fetchSertifikat();
    else fetchAntrean();
  }, [activeTab]);

  const fetchSertifikat = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sertifikat_digital')
      .select(`
        *,
        akun_pengguna(nama_lengkap)
      `)
      .order('tanggal_terbit', { ascending: false });

    if (error) alert("Gagal memuat data sertifikat: " + error.message);
    else setSertifikat(data || []);
    setLoading(false);
  };

  const fetchAntrean = async () => {
    setLoading(true);
    try {
      // 1. Ambil pendaftaran yang sudah berhasil (paket aktif)
      const { data: pendaftar, error: errP } = await supabase
        .from('pendaftaran')
        .select('akun_id, nama_lengkap, paket_pilihan')
        .eq('status', 'Berhasil');

      if (errP) throw errP;

      // 2. Ambil semua sertifikat yang sudah terbit untuk filter
      const { data: terbit } = await supabase.from('sertifikat_digital').select('akun_id');
      const sudahTerbitIds = terbit?.map(s => s.akun_id) || [];

      const hasilAntrean = [];

      for (const p of pendaftar) {
        // Skip jika sudah punya sertifikat
        if (sudahTerbitIds.includes(p.akun_id)) continue;

        // Cek status sesi latihan
        const { data: sesi, error: errS } = await supabase
          .from('jadwal_latihan')
          .select('status, nilai')
          .eq('akun_id', p.akun_id);

        if (errS) continue;

        // Ambil jumlah sesi terdaftar dari akun_pengguna
        const { data: userAcc } = await supabase
          .from('akun_pengguna')
          .select('jumlah_sesi')
          .eq('id', p.akun_id)
          .single();

        let expectedSesi = userAcc?.jumlah_sesi || 0;
        // Fallback berdasarkan paket_pilihan jika jumlah_sesi di akun_pengguna bernilai 0 atau null
        if (!expectedSesi && p.paket_pilihan) {
          const lowerPaket = p.paket_pilihan.toLowerCase();
          if (lowerPaket.includes('plus')) expectedSesi = 11;
          else if (lowerPaket.includes('basic')) expectedSesi = 10;
          else if (lowerPaket.includes('terampil')) expectedSesi = 6;
          else if (lowerPaket.includes('mahir')) expectedSesi = 4;
        }

        const totalSesi = sesi?.length || 0;
        const sesiSelesai = sesi?.filter(s => s.status === 'Selesai').length || 0;

        const isFinished = sesiSelesai > 0 && (expectedSesi > 0 ? sesiSelesai >= expectedSesi : totalSesi === sesiSelesai);

        if (isFinished) {
          // Hitung rata-rata nilai dari setiap sesi latihan
          const totalNilai = sesi.reduce((sum, s) => sum + (Number(s.nilai) || 0), 0);
          const rataRataNilai = Math.round(totalNilai / totalSesi);

          hasilAntrean.push({
            ...p,
            total_sesi: sesiSelesai,
            skor_ujian: rataRataNilai // Sekarang menggunakan rata-rata nilai sesi latihan
          });
        }
      }

      setAntrean(hasilAntrean);
    } catch (err) {
      alert("Gagal memuat antrean: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTerbitkan = async (siswa) => {
    const result = await Swal.fire({
      title: 'Terbitkan Sertifikat?',
      text: `Anda akan menerbitkan sertifikat untuk ${siswa.nama_lengkap}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0b6e99',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Terbitkan!',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      color: '#37352f',
      customClass: {
        popup: 'rounded-2xl border border-[#e9e9e7]',
        confirmButton: 'rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-widest',
        cancelButton: 'rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-widest'
      }
    });

    if (!result.isConfirmed) return;

    setIssuing(true);
    setProcessingSiswa(siswa); // Memicu render hidden certificate

    // Tunggu sebentar agar React selesai merender elemen hidden
    setTimeout(async () => {
      try {
        if (!hiddenCertRef.current) throw new Error("Gagal menginisialisasi render sertifikat.");

        // Pastikan font sudah termuat
        await document.fonts.ready;

        // 1. Render sertifikat menjadi Data URL
        const dataUrl = await htmlToImage.toPng(hiddenCertRef.current, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          skipFonts: true, // Lewati font eksternal untuk menghindari NetworkError/CORS
          fontEmbedCSS: '', // Kosongkan CSS font eksternal
        });

        if (!dataUrl) throw new Error("Gagal menghasilkan gambar sertifikat.");

        // Konversi Data URL ke Blob secara manual (lebih aman dari CORS daripada fetch)
        const base64Data = dataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, { type: 'image/png' });

        // Konversi Blob ke File (Sangat penting untuk kompatibilitas browser/CORS)
        const certFile = new File([blob], `cert_${siswa.akun_id}.png`, { type: 'image/png' });

        const akunIdStr = (siswa.akun_id || '').toString();
        const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const nomorSertif = `TB-${akunIdStr.slice(-4)}-${new Date().getFullYear()}${suffix}`;

        // 2. Upload ke Supabase Storage
        const fileName = `c_${nomorSertif}.png`;
        const filePath = `${siswa.akun_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sertifikat-files')
          .upload(filePath, certFile, {
            upsert: true
          });

        if (uploadError) {
          console.error("Storage Error Details:", uploadError);
          if (uploadError.message?.includes('bucket')) {
            throw new Error("Bucket 'sertifikat-files' tidak ditemukan. Pastikan sudah ada di Storage.");
          }
          // Jika masih error CORS, kita asumsikan kegagalan browser
          throw new Error("Browser memblokir pengunggahan file (CORS). Cobalah buka aplikasi di tab INCOGNITO atau matikan ekstensi AdBlocker.");
        }

        // 3. Dapatkan Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('sertifikat-files')
          .getPublicUrl(filePath);

        // 4. Insert ke tabel sertifikat_digital
        const { error: dbError } = await supabase
          .from('sertifikat_digital')
          .insert([{
            akun_id: siswa.akun_id,
            nomor_sertifikat: nomorSertif,
            tanggal_terbit: new Date().toISOString(),
            skor_ujian: siswa.skor_ujian,
            url_gambar: publicUrl
          }]);

        if (dbError) throw dbError;

        await Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: 'Sertifikat telah diterbitkan dan disimpan ke cloud.',
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
          color: '#37352f',
          customClass: { popup: 'rounded-2xl border border-[#e9e9e7]' }
        });

        fetchAntrean();
      } catch (err) {
        console.error("Error issuing certificate:", err);
        let errorMsg = err.message;
        if (errorMsg.includes('fetch')) {
          errorMsg = "Gagal mengambil aset sertifikat (Font/Gambar). Pastikan koneksi internet stabil atau coba lagi.";
        }

        Swal.fire({
          icon: 'error',
          title: 'Gagal Menerbitkan',
          text: errorMsg,
          confirmButtonColor: '#0b6e99',
          background: '#ffffff',
          color: '#37352f',
          customClass: { popup: 'rounded-2xl border border-[#e9e9e7]' }
        });
      } finally {
        setIssuing(false);
        setProcessingSiswa(null);
      }
    }, 1000); // Tambah waktu tunggu menjadi 1 detik agar render lebih stabil
  };

  const filteredData = activeTab === 'daftar'
    ? sertifikat.filter(s =>
      s.nomor_sertifikat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.akun_pengguna?.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : antrean.filter(a =>
      a.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handlePrintSertifikat = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data sertifikat untuk dicetak");
      return;
    }
    window.print();
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <div className="print:hidden">
        <AdminSidebar activeMenu="sertifikat-admin" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">E-Sertifikat</span>
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
          {/* Hero Section */}
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <TrendingUp className="w-3 h-3 text-[#0b6e99]" />
              Verifikasi Kelulusan
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              E-Sertifikat <span className="text-[#37352f]/40">Digital.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Pantau seluruh sertifikat yang telah diterbitkan secara otomatis oleh sistem atau lakukan penerbitan manual untuk siswa tertentu.
              </p>
              <div className="bg-white border border-[#e9e9e7] px-5 py-3 rounded-2xl flex items-center gap-4 shrink-0 justify-between sm:justify-start w-full md:w-auto shadow-sm">
                <div className="text-right border-r border-[#e9e9e7] pr-4">
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Total Terbit</p>
                  <p className="text-sm font-bold text-[#37352f] leading-none">{sertifikat.length} Lembar</p>
                </div>
                <div className="w-10 h-10 bg-[#0b6e99]/10 text-[#0b6e99] rounded-xl flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <AdminTabSwitcher group="laporan" activeTab="sertifikat" />

          {/* Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full">
            <button
              onClick={() => setActiveTab('daftar')}
              className={`px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all w-full sm:w-auto justify-center flex items-center gap-2 ${activeTab === 'daftar' ? 'bg-[#37352f] text-white' : 'bg-white text-[#37352f]/40 border border-[#e9e9e7] hover:border-[#0b6e99]/30'}`}
            >
              <Award className="w-4 h-4" /> Daftar Sertifikat
            </button>
            <button
              onClick={() => setActiveTab('penerbitan')}
              className={`px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all w-full sm:w-auto justify-center flex items-center gap-2 relative ${activeTab === 'penerbitan' ? 'bg-[#37352f] text-white' : 'bg-white text-[#37352f]/40 border border-[#e9e9e7] hover:border-[#0b6e99]/30'}`}
            >
              <Plus className="w-4 h-4" /> Antrean Penerbitan
              {antrean.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center border-2 border-white">
                  {antrean.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar & Cetak */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between items-stretch sm:items-center">
            <div className="w-full md:w-96 relative group">
              <input
                type="text"
                placeholder={activeTab === 'daftar' ? "Cari nomor atau nama siswa..." : "Cari nama siswa..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#e9e9e7] rounded-xl pl-12 pr-4 py-4 text-sm font-semibold text-[#37352f] outline-none focus:border-[#0b6e99]/30 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors w-5 h-5" />
            </div>

            {activeTab === 'daftar' && (
              <button
                onClick={handlePrintSertifikat}
                className="flex items-center gap-2 bg-[#efefed] hover:bg-[#0b6e99] text-[#37352f]/60 hover:text-white px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border border-[#e9e9e7] shadow-sm justify-center sm:w-auto w-full"
                title="Cetak Laporan Daftar Sertifikat"
              >
                <Printer className="w-4 h-4" /> Cetak Daftar
              </button>
            )}
          </div>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa]">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">
                      {activeTab === 'daftar' ? 'Nama Penerima' : 'Nama Siswa'}
                    </th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">
                      {activeTab === 'daftar' ? 'Identitas Sertifikat' : 'Progres Latihan'}
                    </th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">
                      {activeTab === 'daftar' ? 'Nilai Akhir' : 'Rata-rata Nilai'}
                    </th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Menarik Data...</p>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((s) => (
                      <tr key={s.id || s.akun_id} className="hover:bg-[#fbfbfa] transition-colors group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#efefed] rounded-xl flex items-center justify-center text-[#37352f]/40 group-hover:bg-[#0b6e99] group-hover:text-white transition-all border border-[#e9e9e7]">
                              {activeTab === 'daftar' ? <ShieldCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="font-semibold text-[#37352f] text-base md:text-lg tracking-tight group-hover:text-[#0b6e99] transition-colors">
                              {activeTab === 'daftar' ? s.akun_pengguna?.nama_lengkap : s.nama_lengkap}
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          {activeTab === 'daftar' ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-[#0b6e99] bg-[#0b6e99]/10 px-3 py-1 rounded-lg w-fit border border-[#0b6e99]/20">
                                <FileText className="w-3 h-3" />
                                {s.nomor_sertifikat}
                              </div>
                              <div className="text-[10px] font-bold text-[#37352f]/40 px-3 uppercase tracking-widest">
                                Terbit: {new Date(s.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg w-fit border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3" />
                                {s.total_sesi} Sesi Selesai
                              </div>
                              <div className="text-[10px] font-bold text-[#37352f]/40 px-3 uppercase tracking-widest">
                                Paket: {s.paket_pilihan}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          <div className={`text-xl font-bold text-center ${s.skor_ujian ? 'text-[#37352f]' : 'text-[#37352f]/20'}`}>
                            {s.skor_ujian || '---'}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex justify-center gap-3">
                            {activeTab === 'daftar' ? (
                              <button
                                onClick={() => s.url_gambar ? window.open(s.url_gambar, '_blank') : alert('Gambar sertifikat tidak ditemukan di cloud.')}
                                className="p-3 bg-[#efefed] hover:bg-[#37352f] text-[#37352f]/40 hover:text-white rounded-xl transition-all border border-[#e9e9e7]"
                                title="Lihat Sertifikat Cloud"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTerbitkan(s)}
                                disabled={issuing}
                                className="px-5 py-2.5 bg-[#0b6e99] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-[#0b6e99]/90 transition-all disabled:opacity-50"
                              >
                                {issuing ? 'Proses...' : 'Terbitkan'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-20 text-center text-[#37352f]/40 font-medium">
                        {activeTab === 'daftar' ? 'Belum ada sertifikat yang diterbitkan.' : 'Tidak ada siswa dalam antrean penerbitan.'}
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

      {/* Hidden Certificate Renderer for Auto-Upload */}
      {processingSiswa && (
        <div className="fixed -left-[2000px] top-0 no-print" style={{ zIndex: -100 }}>
          <div
            ref={hiddenCertRef}
            className="bg-white border-8 border-[#37352f] p-1 w-[1000px] h-[707px] relative overflow-hidden"
          >
            <div className="border-2 border-[#37352f]/10 h-full w-full p-12 flex flex-col items-center text-center relative z-10">

              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -z-10 rotate-12">
                <Award className="w-[500px] h-[500px]" />
              </div>

              <div className="mb-10 flex flex-col items-center">
                <img src={logoTribakti} alt="Logo TriBakti" className="w-16 h-16 object-contain mb-2 scale-[1.5]" />
                <div className="text-3xl font-bold tracking-tight text-[#37352f] mb-1">
                  TRI<span className="text-[#0b6e99]">BAKTI</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#37352f]/40">Driving School & Education</p>
              </div>

              <div className="mb-12">
                <h3 className="text-5xl font-serif italic text-[#37352f] mb-2">Certificate</h3>
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#0b6e99]">of Completion</p>
              </div>

              <div className="space-y-6 mb-12">
                <p className="text-sm font-medium text-[#37352f]/60 uppercase tracking-widest">Diberikan Kepada:</p>
                <h4 className="text-4xl font-bold text-[#37352f] border-b-2 border-[#37352f] px-12 pb-2 inline-block">
                  {processingSiswa.nama_lengkap}
                </h4>
                <p className="text-sm font-medium text-[#37352f]/70 max-w-lg leading-relaxed">
                  Atas keberhasilannya dalam menyelesaikan seluruh rangkaian materi teori & praktik mengemudi serta dinyatakan lulus pada platform digital <b>LPK TriBakti</b>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-20 mt-auto w-full max-w-2xl">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Paket Pelatihan</p>
                  <p className="text-sm font-bold text-[#37352f]">{processingSiswa.paket_pilihan}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Tanggal Terbit</p>
                  <p className="text-sm font-bold text-[#37352f]">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="mt-16 flex flex-col items-center">
                <div className="w-32 h-32 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl flex items-center justify-center mb-4 overflow-hidden grayscale">
                  <div className="p-4 opacity-20">
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
                      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 3h3v2h-3v-2zm-3 0h2v3h-2v-3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-[#37352f]/30">
                  ID Sertifikat: TB-{processingSiswa.akun_id.toString().slice(-4)}-{new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PRINT-ONLY SECTION */}
      <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-[21cm] min-h-[29.7cm] border border-black/10 mx-auto text-xs">
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
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Daftar Sertifikat Digital</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-500 uppercase text-[9px] tracking-wider">Kriteria Pencarian</p>
            <p className="font-bold text-black mt-0.5">{searchTerm ? `Pencarian: "${searchTerm}"` : 'Semua Data'}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-500 uppercase text-[9px] tracking-wider">Dicetak Oleh</p>
            <p className="font-bold text-black mt-0.5">{savedUser?.nama_lengkap || 'Administrator'}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
              <th className="px-3 py-2 border-r border-gray-300 text-center w-10">No</th>
              <th className="px-3 py-2 border-r border-gray-300">Nama Penerima</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Nomor Sertifikat</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Nilai Akhir</th>
              <th className="px-3 py-2 text-center">Tanggal Terbit</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((s, idx) => (
              <tr key={s.id || idx} className="border-b border-gray-300 text-xs">
                <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                <td className="px-3 py-2 border-r border-gray-300 font-semibold">{s.akun_pengguna?.nama_lengkap}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">{s.nomor_sertifikat}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center font-bold">{s.skor_ujian || '---'}</td>
                <td className="px-3 py-2 text-center font-mono">
                  {s.tanggal_terbit ? new Date(s.tanggal_terbit).toLocaleDateString('id-ID') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signature Section */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-48">
            <p className="text-gray-500 mb-16 text-[10px]">Mengetahui,<br />Pimpinan LPK TriBakti</p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold text-black mt-1">Rivo Raihan</p>
            <p className="text-[9px] text-gray-500">Direktur Utama</p>
          </div>
        </div>
      </div>
    </div>
  );
}
