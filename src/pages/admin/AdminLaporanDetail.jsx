import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import Footer from '../siswa/Footer';
import logoTribakti from '../../assets/logo_tribaktii.png';
import {
  ArrowLeft,
  Printer,
  Calendar,
  Wallet,
  TrendingUp,
  ChevronRight,
  BarChart3
} from 'lucide-react';

export default function AdminLaporanDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periode = searchParams.get('periode') || '';
  const type = searchParams.get('type') || 'bulanan'; // 'bulanan' atau 'harian'

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalPemasukan: 0,
    totalTransaksi: 0,
    rataRataTransaksi: 0
  });

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (periode) {
      fetchDetailData();
    }
  }, [periode, type]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendaftaran')
        .select('id, created_at, nama_lengkap, no_whatsapp, paket_pilihan, total_bayar, status')
        .eq('status', 'Berhasil')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter data di client berdasarkan periode (mendukung format bulan panjang & pendek)
      const filtered = (data || []).filter(item => {
        const date = new Date(item.created_at);
        const labelLong = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        const labelShort = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' });

        const dayLabelLong = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const dayLabelShort = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        if (type === 'bulanan') {
          return labelLong === periode || labelShort === periode;
        } else {
          return dayLabelLong === periode || dayLabelShort === periode;
        }
      });

      setTransactions(filtered);

      const total = filtered.reduce((sum, item) => sum + (Number(item.total_bayar) || 0), 0);
      const count = filtered.length;
      const avg = count > 0 ? total / count : 0;

      setStats({
        totalPemasukan: total,
        totalTransaksi: count,
        rataRataTransaksi: avg
      });

    } catch (err) {
      console.error("Fetch Detail Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintDetail = () => {
    if (transactions.length === 0) return alert("Tidak ada data transaksi untuk dicetak");
    window.print();
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <div className="print:hidden">
        <AdminSidebar activeMenu="laporan" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <button onClick={() => navigate('/admin/laporan')} className="text-sm font-medium text-[#37352f]/60 hover:text-[#37352f] hover:underline bg-transparent border-none p-0 cursor-pointer">Laporan</button>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Detail Pemasukan</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Admin'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Admin</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'A').charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-[#37352f]/60 hover:text-[#37352f] bg-[#efefed] hover:bg-[#e4e4e2] px-3.5 py-2 rounded-xl transition-all cursor-pointer w-fit border border-[#e9e9e7] mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>

          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Calendar className="w-3 h-3 text-[#0b6e99]" />
              Detail Pemasukan
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Periode: <span className="text-[#0b6e99]">{periode}</span>
            </h2>
            <p className="text-[#37352f]/60 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
              Rincian seluruh transaksi pendaftaran dengan status pembayaran berhasil untuk periode ini.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Total Pemasukan */}
            <div className="bg-white p-6 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2">Total Pemasukan</p>
                <h3 className="text-2xl font-bold text-[#37352f]">
                  Rp {stats.totalPemasukan.toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                <Wallet className="w-3.5 h-3.5" /> Nominal Akumulasi
              </div>
            </div>

            {/* Total Transaksi */}
            <div className="bg-white p-6 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2">Jumlah Transaksi</p>
                <h3 className="text-2xl font-bold text-[#37352f]">
                  {stats.totalTransaksi} Transaksi
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-[#0b6e99] bg-[#efefed] px-2.5 py-1 rounded-lg w-fit">
                <BarChart3 className="w-3.5 h-3.5" /> Sukses Berhasil
              </div>
            </div>

            {/* Rata-rata Transaksi */}
            <div className="bg-white p-6 rounded-2xl border border-[#e9e9e7] shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2">Rata-rata Transaksi</p>
                <h3 className="text-2xl font-bold text-[#37352f]">
                  Rp {Math.round(stats.rataRataTransaksi).toLocaleString('id-ID')}
                </h3>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
                <TrendingUp className="w-3.5 h-3.5" /> Rata-rata per Transaksi
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-2xl border border-[#e9e9e7] overflow-hidden shadow-sm">
            <div className="p-5 sm:p-6 border-b border-[#e9e9e7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h4 className="text-lg sm:text-xl font-bold text-[#37352f]">Daftar Transaksi Pemasukan</h4>
              <button
                onClick={handlePrintDetail}
                className="flex items-center gap-2 bg-[#0b6e99] hover:bg-[#085577] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                title="Cetak Laporan"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Laporan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center w-16">No</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Tanggal & Waktu</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Nama Siswa</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">No WhatsApp</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Paket Pilihan</th>
                    <th className="px-6 py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Total Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-[#37352f]/40 font-medium text-xs md:text-sm">Memuat data transaksi...</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-[#37352f]/40 font-medium text-xs md:text-sm italic">Tidak ada transaksi ditemukan pada periode ini.</td>
                    </tr>
                  ) : (
                    transactions.map((item, index) => (
                      <tr key={item.id} className="hover:bg-[#fbfbfa] transition-colors text-sm">
                        <td className="px-6 py-5 text-center font-bold text-[#37352f]/40">{index + 1}</td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#37352f]">
                              {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-[9px] md:text-[10px] font-medium text-[#37352f]/40 uppercase tracking-tighter">
                              {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0b6e99]/5 flex items-center justify-center text-[#0b6e99] font-bold text-xs border border-[#0b6e99]/20 shrink-0">
                              {item.nama_lengkap?.charAt(0)}
                            </div>
                            <span className="font-bold text-[#37352f]">{item.nama_lengkap}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-semibold text-[#37352f]/70">{item.no_whatsapp}</td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] md:text-xs font-semibold text-[#37352f] bg-[#efefed] px-2.5 py-1 rounded-md border border-[#e9e9e7]">
                            {item.paket_pilihan}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-extrabold text-[#0b6e99]">
                          Rp {Number(item.total_bayar || 0).toLocaleString('id-ID')}
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
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Detail Transaksi Pemasukan</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Periode Laporan</span>
            <p className="font-bold text-black mt-0.5">{periode}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 font-semibold uppercase text-[9px] tracking-wider">Dicetak Oleh</span>
            <p className="font-bold text-black mt-0.5">{savedUser?.nama_lengkap || 'Administrator'}</p>
          </div>
        </div>

        {/* Render Table */}
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
              <th className="px-3 py-2 border-r border-gray-300 text-center w-12">No</th>
              <th className="px-3 py-2 border-r border-gray-300">Tanggal & Waktu</th>
              <th className="px-3 py-2 border-r border-gray-300">Nama Siswa</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">No WhatsApp</th>
              <th className="px-3 py-2 border-r border-gray-300">Paket Pilihan</th>
              <th className="px-3 py-2 text-right">Total Bayar</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item, idx) => {
              const date = new Date(item.created_at);
              const formattedDate = `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
              return (
                <tr key={item.id || idx} className="border-b border-gray-300 text-xs">
                  <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 border-r border-gray-300">{formattedDate}</td>
                  <td className="px-3 py-2 border-r border-gray-300 font-semibold">{item.nama_lengkap}</td>
                  <td className="px-3 py-2 border-r border-gray-300 text-center">{item.no_whatsapp}</td>
                  <td className="px-3 py-2 border-r border-gray-300">{item.paket_pilihan}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-[#0b6e99]">Rp {Number(item.total_bayar || 0).toLocaleString('id-ID')}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-50 font-bold border-b border-gray-300 text-xs">
              <td colSpan="5" className="px-3 py-2 border-r border-gray-300 text-right">Total Pemasukan:</td>
              <td className="px-3 py-2 text-right font-mono text-[#0b6e99]">Rp {stats.totalPemasukan.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature Section */}
        <div className="mt-12 flex justify-end">
          <div className="text-center w-48">
            <p className="text-gray-500 mb-16 text-[10px]">Mengetahui,<br />Pimpinan LPK TriBakti</p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold text-black mt-1">Rivo Raihan, M.Pd.</p>
            <p className="text-[9px] text-gray-500">Direktur Utama</p>
          </div>
        </div>
      </div>
    </div>
  );
}
