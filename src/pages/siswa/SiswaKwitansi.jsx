import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import logoTribakti from '../../assets/logo_tribaktii.png';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function SiswaKwitansi() {
  const navigate = useNavigate();
  const [siswaInfo, setSiswaInfo] = useState(null);
  const [paketInfo, setPaketInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const kwitansiRef = useRef(null);
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const akunId = savedUser?.id;

  useEffect(() => {
    if (akunId) {
      fetchKwitansiData();
    } else {
      navigate('/login');
    }
  }, [akunId]);

  const fetchKwitansiData = async () => {
    setLoading(true);
    try {
      // 1. Ambil pendaftaran milik siswa yang aktif
      const { data: siswaData, error: errSiswa } = await supabase
        .from('pendaftaran')
        .select('*')
        .eq('akun_id', akunId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errSiswa) throw errSiswa;
      if (!siswaData) {
        throw new Error("Pendaftaran tidak ditemukan.");
      }
      setSiswaInfo(siswaData);

      // 2. Ambil harga paket dari packages
      const { data: packages, error: errPack } = await supabase
        .from('packages')
        .select('*');
      
      if (!errPack && packages) {
        const matchingPaket = packages.find(p => p.name === siswaData.paket_pilihan || p.nama === siswaData.paket_pilihan);
        setPaketInfo(matchingPaket);
      }
    } catch (err) {
      console.error("Gagal memuat data kwitansi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const harga = paketInfo?.price || paketInfo?.harga || 0;

  function terbilang(nilai) {
    const bilangan = [
      '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 
      'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
    ];
    let temp = '';
    if (nilai < 12) {
      temp = bilangan[Math.floor(nilai)];
    } else if (nilai < 20) {
      temp = terbilang(nilai - 10) + ' Belas';
    } else if (nilai < 100) {
      temp = terbilang(nilai / 10) + ' Puluh ' + terbilang(nilai % 10);
    } else if (nilai < 200) {
      temp = ' Seratus ' + terbilang(nilai - 100);
    } else if (nilai < 1000) {
      temp = terbilang(nilai / 100) + ' Ratus ' + terbilang(nilai % 100);
    } else if (nilai < 2000) {
      temp = ' Seribu ' + terbilang(nilai - 1000);
    } else if (nilai < 1000000) {
      temp = terbilang(nilai / 1000) + ' Ribu ' + terbilang(nilai % 1000);
    } else if (nilai < 1000000000) {
      temp = terbilang(nilai / 1000000) + ' Juta ' + terbilang(nilai % 1000000);
    }
    return temp.replace(/\s+/g, ' ').trim();
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!kwitansiRef.current) return;
    setDownloading(true);
    try {
      await document.fonts.ready;
      
      const width = kwitansiRef.current.offsetWidth;
      const height = kwitansiRef.current.offsetHeight;

      const dataUrl = await htmlToImage.toPng(kwitansiRef.current, {
        width: width,
        height: height,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`Kwitansi-TriBakti-${siswaInfo?.nama_lengkap || 'Siswa'}.pdf`);
    } catch (err) {
      console.error("Gagal mengunduh PDF:", err);
      alert("Gagal mengunduh kwitansi sebagai PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfa] text-[#37352f]">
        <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#37352f]/50">Menyiapkan Kwitansi...</p>
      </div>
    );
  }

  if (!siswaInfo) {
    return (
      <div className="p-8 text-center text-rose-500 font-bold bg-[#fbfbfa] min-h-screen flex flex-col items-center justify-center">
        <p className="mb-4">Data pendaftaran/pembayaran belum disetujui atau tidak ditemukan.</p>
        <button onClick={() => navigate('/dashboard')} className="bg-[#37352f] text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all">Kembali ke Dashboard</button>
      </div>
    );
  }

  return (
    <div className="bg-[#efefed] min-h-screen p-4 md:p-12 flex flex-col items-center font-sans print:bg-white print:p-0">
      {/* Tombol Aksi (Sembunyi saat cetak) */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 print:hidden">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-bold text-[#37352f]/60 hover:text-[#37352f] transition-all uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="flex gap-3">
          <button 
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 bg-white border border-[#e9e9e7] text-[#37352f] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-[#efefed] cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-[#37352f]/20 border-t-[#37352f] rounded-full animate-spin"></div>
            ) : <Download className="w-4 h-4" />}
            Unduh PDF
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-[#0b6e99] hover:bg-[#085a80] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0b6e99]/15 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Cetak Kwitansi
          </button>
        </div>
      </div>

      {/* Tampilan Kwitansi (Style Cetak) */}
      <div ref={kwitansiRef} className="w-full max-w-3xl bg-white border border-[#e9e9e7] shadow-lg rounded-2xl p-8 md:p-12 relative overflow-hidden print:shadow-none print:border-none print:p-0">
        
        {/* Header Kwitansi */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-[#37352f] pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white border border-[#e9e9e7] rounded-xl flex items-center justify-center p-2 shrink-0">
              <img src={logoTribakti} alt="Logo LPK" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-[#37352f] leading-none mb-1">LPK TRI BAKTI</h2>
              <p className="text-[10px] text-[#37352f]/60 font-bold uppercase tracking-wider">Driving School & Education</p>
              <p className="text-[9px] text-[#37352f]/50 mt-1 max-w-xs">Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Kota Payakumbuh</p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-serif italic font-bold text-[#0b6e99] leading-none mb-1">Receipt</h1>
            <p className="text-xs font-bold text-[#37352f]/50 uppercase tracking-widest">BUKTI PEMBAYARAN RESMI</p>
            <p className="text-xs font-bold text-[#37352f] mt-1">No. {`KWT-${String(siswaInfo.id).substring(0, 8).toUpperCase()}`}</p>
          </div>
        </div>

        {/* Content Table / Kwitansi Details */}
        <div className="space-y-6 text-[#37352f]">
          <div className="grid grid-cols-3 gap-2 border-b border-[#efefed] pb-3">
            <span className="text-xs font-bold text-[#37352f]/40 uppercase tracking-wider">Telah Diterima Dari</span>
            <span className="col-span-2 font-bold text-base text-[#37352f]">{siswaInfo.nama_lengkap}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-[#efefed] pb-3">
            <span className="text-xs font-bold text-[#37352f]/40 uppercase tracking-wider">NIK / No. Identitas</span>
            <span className="col-span-2 text-sm font-semibold">{siswaInfo.nik || '-'}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-[#efefed] pb-3">
            <span className="text-xs font-bold text-[#37352f]/40 uppercase tracking-wider">Untuk Pembayaran</span>
            <span className="col-span-2 text-sm font-semibold">Registrasi & Pelatihan Mengemudi ({siswaInfo.paket_pilihan})</span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-[#efefed] pb-3">
            <span className="text-xs font-bold text-[#37352f]/40 uppercase tracking-wider">Uang Sejumlah</span>
            <span className="col-span-2 text-sm font-serif italic bg-[#fbfbfa] p-3 rounded-lg border border-[#e9e9e7] font-semibold text-[#0b6e99]">
              "{terbilang(harga)} Rupiah"
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-b border-[#efefed] pb-3 items-center">
            <span className="text-xs font-bold text-[#37352f]/40 uppercase tracking-wider">Status Pembayaran</span>
            <span className="col-span-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                Lunas / Paid
              </span>
            </span>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-12 gap-8">
          <div className="bg-[#efefed]/50 px-6 py-4 rounded-xl border border-[#e9e9e7]">
            <p className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-wider mb-1">Jumlah Pembayaran</p>
            <h3 className="text-2xl font-black text-[#0b6e99]">Rp {harga.toLocaleString('id-ID')}</h3>
          </div>

          <div className="text-center w-full sm:w-auto shrink-0 pr-8">
            <p className="text-xs font-medium text-[#37352f]/60 mb-16">
              Payakumbuh, {new Date(siswaInfo.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="border-b border-[#37352f]/40 w-44 mx-auto mb-1 font-bold text-[#37352f]">
              Administrator
            </div>
            <p className="text-[10px] font-bold text-[#37352f]/40 uppercase tracking-wider">LPK TRI BAKTI</p>
          </div>
        </div>

        {/* Watermark / Logo background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none -z-10 select-none">
          <img src={logoTribakti} alt="watermark" className="w-[450px] h-[450px]" />
        </div>
      </div>
    </div>
  );
}
