import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import * as htmlToImage from 'html-to-image';
import logoTribakti from '../../assets/logo_tribaktii.png';
import Sidebar from './Sidebar';
import AdminSidebar from '../admin/AdminSidebar';
import Footer from './Footer';
import { 
  Award, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  Calendar,
  Lock
} from 'lucide-react';

export default function Sertifikat() {
  const navigate = useNavigate();
  const { id } = useParams(); // Ambil ID dari URL jika dalam mode preview admin
  const certRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [certData, setCertData] = useState(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = savedUser?.role === 'admin';
  const targetAkunId = id || savedUser?.id;

  useEffect(() => {
    if (!targetAkunId) { navigate('/login'); return; }
    fetchData();
  }, [targetAkunId, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil info pendaftaran
      const { data: dataSiswa } = await supabase
        .from('pendaftaran')
        .select('nama_lengkap, paket_pilihan, status')
        .eq('akun_id', targetAkunId)
        .single();
      
      if (dataSiswa) setStudentInfo(dataSiswa);

      // 2. Ambil data sertifikat jika sudah ada
      const { data: dataCert } = await supabase
        .from('sertifikat_digital')
        .select('*')
        .eq('akun_id', targetAkunId)
        .maybeSingle(); // Gunakan maybeSingle agar tidak error 406 jika kosong
      
      if (dataCert) {
        setCertData(dataCert);
      }

      // 3. Cek apakah semua sesi sudah selesai
      const { data: sessions } = await supabase
        .from('jadwal_latihan')
        .select('status')
        .eq('akun_id', targetAkunId);
      
      const totalSesi = sessions?.length || 0;
      const selesaiSesi = sessions?.filter(s => s.status === 'Selesai').length || 0;

      // Ambil jumlah sesi terdaftar dari akun_pengguna
      const { data: userAcc } = await supabase
        .from('akun_pengguna')
        .select('jumlah_sesi')
        .eq('id', targetAkunId)
        .single();

      let expectedSesi = parseInt(userAcc?.jumlah_sesi) || 0;
      // Fallback berdasarkan paket_pilihan jika jumlah_sesi di akun_pengguna bernilai 0 atau null
      if (!expectedSesi && dataSiswa?.paket_pilihan) {
        const lowerPaket = dataSiswa.paket_pilihan.toLowerCase();
        if (lowerPaket.includes('plus')) expectedSesi = 11;
        else if (lowerPaket.includes('basic')) expectedSesi = 10;
        else if (lowerPaket.includes('terampil')) expectedSesi = 6;
        else if (lowerPaket.includes('mahir')) expectedSesi = 4;
      }
      
      if (selesaiSesi > 0 && (expectedSesi > 0 ? selesaiSesi >= expectedSesi : totalSesi === selesaiSesi)) {
        setSessionsCompleted(true);
      }

    } catch (err) {
      console.error("Gagal memuat data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!certRef.current) return;
    
    setDownloading(true);
    try {
      await document.fonts.ready;
      
      // Ambil dimensi asli elemen
      const width = certRef.current.offsetWidth;
      const height = certRef.current.offsetHeight;

      const dataUrl = await htmlToImage.toPng(certRef.current, {
        width: width,
        height: height,
        style: {
          transform: 'scale(1)', // Pastikan tidak ada transformasi CSS saat capture
          margin: '0',           // Hapus margin agar pas di canvas
          left: '0',
          top: '0',
        },
        pixelRatio: 3,           // Tingkatkan kualitas ke 3x untuk hasil sangat tajam
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `Sertifikat-TriBakti-${studentInfo?.nama_lengkap || 'Siswa'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh gambar:", err);
      alert("Gagal mengunduh sertifikat sebagai gambar. Silakan gunakan tombol 'Cetak Sertifikat' dan simpan sebagai PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleUploadToDatabase = async () => {
    if (!certRef.current || !certData) return;
    
    setSyncing(true);
    try {
      await document.fonts.ready;
      
      // 1. Konversi ke Blob (bukan PNG URL) agar bisa diupload
      const blob = await htmlToImage.toBlob(certRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const fileName = `cert_${certData.nomor_sertifikat}.png`;
      const filePath = `${targetAkunId}/${fileName}`;

      // 2. Upload ke Supabase Storage (Bucket: sertifikat-files)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sertifikat-files')
        .upload(filePath, blob, {
          upsert: true // Ganti jika sudah ada
        });

      if (uploadError) throw uploadError;

      // 3. Dapatkan Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sertifikat-files')
        .getPublicUrl(filePath);

      // 4. Update tabel sertifikat_digital
      const { error: dbError } = await supabase
        .from('sertifikat_digital')
        .update({ url_gambar: publicUrl })
        .eq('akun_id', targetAkunId);

      if (dbError) throw dbError;

      alert("Sertifikat berhasil disimpan ke database! ☁️");
      fetchData(); // Muat ulang data
    } catch (err) {
      console.error("Gagal menyimpan ke database:", err);
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfa] text-[#37352f]/20">
        <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest">Memeriksa kelulusan...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans print:block print:bg-white">
      {/* Printable CSS override */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          
          body, html, #root, .min-h-screen {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }

          /* Sembunyikan kontrol layout utama, sidebar, header, footer */
          aside,
          header,
          footer,
          button,
          .no-print {
            display: none !important;
          }

          /* Reset pembungkus cetak agar sertifikat terlihat dan memenuhi halaman */
          .cert-print-wrapper {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            width: 100vw !important;
            height: 100vh !important;
            overflow: visible !important;
          }

          .cert-print-el {
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100% !important;
            max-height: 100% !important;
            margin: 0 !important;
            border: 8px solid #37352f !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      {isAdmin ? (
        <AdminSidebar activeMenu="sertifikat-admin" />
      ) : (
        <Sidebar role="siswa" activeMenu="sertifikat" />
      )}

      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10 no-print">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">{isAdmin ? 'Admin Panel' : 'Akademik'}</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">{isAdmin ? 'Preview Sertifikat' : 'E-Sertifikat'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{isAdmin ? savedUser.nama_lengkap : (studentInfo?.nama_lengkap || 'Siswa')}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">{isAdmin ? 'Administrator' : 'Portal Siswa'}</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {isAdmin ? savedUser.nama_lengkap?.charAt(0) : (studentInfo?.nama_lengkap?.charAt(0) || 'S')}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12 print:block print:p-0 print:overflow-visible">
          {!isAdmin && !(studentInfo?.status === 'Aktif' || studentInfo?.status === 'Berhasil') ? (
            <div className="bg-white border border-amber-100 rounded-2xl p-10 text-center shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#37352f]">Akses Terkunci 🔒</h3>
              <p className="text-sm text-[#37352f]/60 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                Anda harus menyelesaikan pendaftaran dan pembayaran paket terlebih dahulu sebelum dapat mengakses sertifikat.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-[#37352f] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
              >
                Cek Status Pendaftaran
              </button>
            </div>
          ) : (
            <>
              {!certData ? (
            <div className="max-w-2xl mx-auto text-center py-12 md:py-20 no-print">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#efefed] rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-8 text-[#37352f]/20">
                <Lock className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight text-[#37352f] mb-3 md:mb-4">Sertifikat Belum Tersedia</h2>
              
              {isAdmin ? (
                 <p className="text-sm md:text-lg text-[#37352f]/60 font-medium">
                   Sertifikat untuk siswa ini belum diterbitkan. Silakan kembali ke menu Antrean Penerbitan.
                 </p>
              ) : sessionsCompleted ? (
                <div className="space-y-4 md:space-y-6">
                  <p className="text-sm md:text-lg text-[#37352f]/60 font-medium">
                    Selamat! Anda telah menyelesaikan seluruh sesi latihan. Saat ini sertifikat Anda sedang dalam proses verifikasi dan penerbitan oleh Admin TriBakti.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2 rounded-full text-[9px] md:text-[10px] font-black tracking-widest uppercase border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> Menunggu Penerbitan Admin
                  </div>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  <p className="text-sm md:text-lg text-[#37352f]/60 font-medium">
                    Sertifikat akan diterbitkan secara otomatis setelah Anda menyelesaikan seluruh rangkaian sesi latihan sesuai paket yang dipilih.
                  </p>
                  <button 
                    onClick={() => navigate('/jadwal')} 
                    className="w-full sm:w-auto bg-[#37352f] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all shadow-lg shadow-[#37352f]/10"
                  >
                    Cek Progres Latihan
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-8 md:mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 no-print">
                <div className="flex-1">
                  <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 md:mb-4">{isAdmin ? `Preview Sertifikat: ${studentInfo?.nama_lengkap}` : 'Pencapaian Anda 🏆'}</h2>
                  <p className="text-sm md:text-lg text-[#37352f]/70 leading-relaxed max-w-2xl">
                    {isAdmin 
                      ? "Berikut adalah tampilan sertifikat digital yang akan diterima oleh siswa. Anda dapat mengunduh atau mencetaknya untuk arsip."
                      : "Selamat atas kelulusan Anda dalam rangkaian pelatihan mengemudi. Gunakan sertifikat ini sebagai bukti kompetensi dasar Anda."
                    }
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <button 
                    onClick={handleDownloadImage}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 bg-white border border-[#e9e9e7] text-[#37352f] px-6 py-2.5 md:px-8 md:py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-[#efefed] transition-all shadow-sm disabled:opacity-50 w-full sm:w-auto"
                  >
                    {downloading ? (
                      <div className="w-4 h-4 border-2 border-[#37352f]/20 border-t-[#37352f] rounded-full animate-spin"></div>
                    ) : <Download className="w-4 h-4" />} 
                    Simpan Gambar
                  </button>

                  {isAdmin && !certData.url_gambar && (
                    <button 
                      onClick={handleUploadToDatabase}
                      disabled={syncing}
                      className="flex items-center justify-center gap-2 bg-[#0b6e99] text-white px-6 py-2.5 md:px-8 md:py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-900 transition-all shadow-xl shadow-[#0b6e99]/10 disabled:opacity-50 w-full sm:w-auto"
                    >
                      {syncing ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : <Award className="w-4 h-4" />} 
                      Simpan ke Cloud
                    </button>
                  )}

                  {isAdmin && (
                    <button 
                      onClick={handlePrint}
                      className="flex items-center justify-center gap-2 bg-[#37352f] text-white px-6 py-2.5 md:px-8 md:py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-[#0b6e99] transition-all shadow-xl shadow-[#37352f]/10 w-full sm:w-auto"
                    >
                      <FileText className="w-4 h-4" /> Cetak Sertifikat
                    </button>
                  )}
                </div>
              </div>

              {/* TAMPILAN SERTIFIKAT - NOTION STYLE PREMIUM */}
              <div className="overflow-x-auto pb-8 border border-[#e9e9e7]/50 rounded-2xl p-4 bg-white/50 backdrop-blur-sm cert-print-wrapper">
                <div className="block xl:hidden text-center mb-3 print:hidden">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 bg-[#efefed] px-3 py-1 rounded-full">
                    👈 Geser horizontal untuk melihat pratinjau sertifikat penuh 👉
                  </span>
                </div>
                <div 
                  ref={certRef} 
                  className="bg-white border-8 border-[#37352f] p-1 shadow-2xl mx-auto w-[1000px] h-[707px] relative overflow-hidden cert-print-el aspect-[1.414/1]"
                >
                  <div className="border-2 border-[#37352f]/10 absolute inset-1.5 p-12 flex flex-col items-center text-center z-10">
                  
                  {/* Watermark Background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -z-10 rotate-12">
                    <Award className="w-[500px] h-[500px]" />
                  </div>

                  <div className="mb-10 flex flex-col items-center">
                    <img src={logoTribakti} alt="Logo TriBakti" className="w-16 h-16 object-contain mb-2 scale-[1.5]" />
                    <div className="text-3xl font-black tracking-tighter text-[#37352f] mb-1">
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
                      {studentInfo?.nama_lengkap || 'Nama Siswa'}
                    </h4>
                    <p className="text-sm font-medium text-[#37352f]/70 max-w-lg leading-relaxed">
                      Atas keberhasilannya dalam menyelesaikan seluruh rangkaian materi teori & praktik mengemudi serta dinyatakan lulus pada platform digital <b>LPK TriBakti</b>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-20 mt-auto w-full max-w-2xl">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Paket Pelatihan</p>
                      <p className="text-sm font-bold text-[#37352f]">{studentInfo?.paket_pilihan || '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Tanggal Terbit</p>
                      <p className="text-sm font-bold text-[#37352f]">{new Date(certData.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="mt-16 flex flex-col items-center">
                    <div className="w-32 h-32 bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl flex items-center justify-center mb-4 overflow-hidden grayscale">
                       {/* Simulasi QR Code / Seal */}
                       <div className="p-4 opacity-20">
                          <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
                            <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v2h-3v-2zm-3 2h2v3h-2v-3zm3 3h3v2h-3v-2zm-3 0h2v3h-2v-3z" />
                          </svg>
                       </div>
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#37352f]/30">ID Sertifikat: {certData.nomor_sertifikat}</p>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
            </>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
