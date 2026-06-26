import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import AdminTabSwitcher from '../../components/AdminTabSwitcher';
import Footer from '../siswa/Footer';
import logoTribakti from '../../assets/logo_tribaktii.png';
import {
  FileText,
  Search,
  TrendingUp,
  Activity,
  ShieldCheck,
  Award,
  Calendar,
  ChevronRight,
  Printer
} from 'lucide-react';

export default function AdminLaporanUjian() {
  const navigate = useNavigate();
  const [riwayatUjian, setRiwayatUjian] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [tipeFilter, setTipeFilter] = useState('Semua');

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchLaporanUjian();
  }, []);

  const fetchLaporanUjian = async () => {
    setLoading(true);
    // Mengambil data dengan kolom yang sesuai dengan tabel Anda termasuk jenis_ujian
    const { data, error } = await supabase
      .from('riwayat_ujian_sim')
      .select(`
        id, 
        skor, 
        status, 
        created_at,
        jenis_ujian,
        akun_pengguna(nama_lengkap)
      `)
      .order('created_at', { ascending: false }); // Mengurutkan berdasarkan created_at

    if (error) {
      console.error("Error:", error);
      alert("Gagal memuat laporan ujian: " + error.message);
    } else {
      setRiwayatUjian(data || []);
    }
    setLoading(false);
  };

  const filteredData = riwayatUjian.filter(ujian => {
    const matchesSearch = (ujian.akun_pengguna?.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase());

    const statusUpper = (ujian.status || '').toUpperCase();
    const matchesStatus = statusFilter === 'Semua' || statusUpper === statusFilter;

    const tipeUjian = ujian.jenis_ujian === 'motorik' ? 'Motorik' : 'Materi';
    const matchesTipe = tipeFilter === 'Semua' || tipeUjian === tipeFilter;

    return matchesSearch && matchesStatus && matchesTipe;
  });

  const statsData = riwayatUjian.filter(ujian => {
    const tipeUjian = ujian.jenis_ujian === 'motorik' ? 'Motorik' : 'Materi';
    return tipeFilter === 'Semua' || tipeUjian === tipeFilter;
  });

  const handlePrintUjian = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk dicetak");
      return;
    }
    window.print();
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <div className="print:hidden">
        <AdminSidebar activeMenu="laporan-ujian" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Laporan Ujian</span>
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
              <Activity className="w-3 h-3 text-[#0b6e99]" />
              Monitoring Akademik
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Laporan <span className="text-[#37352f]/40">Ujian SIM.</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Pantau hasil ujian teori SIM siswa secara real-time untuk mengukur efektivitas materi pembelajaran yang diberikan.
              </p>
              <div className="bg-white px-5 py-3 rounded-2xl border border-[#e9e9e7] flex items-center gap-4 shrink-0 justify-between sm:justify-start w-full md:w-auto shadow-sm">
                <div className="text-right border-r border-[#e9e9e7] pr-4">
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 leading-none mb-1">Total Ujian</p>
                  <p className="text-sm font-bold text-[#37352f] leading-none">{statsData.length} Peserta</p>
                </div>
                <div className="w-10 h-10 bg-[#0b6e99]/10 text-[#0b6e99] rounded-xl flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <AdminTabSwitcher group="laporan" activeTab="ujian" />

          {/* Search Bar and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 items-stretch sm:items-center justify-between">
            <div className="w-full md:w-96 relative group">
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#e9e9e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b6e99]/20 focus:border-[#0b6e99] transition-all text-sm"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors">
                <Search className="w-4 h-4" />
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#e9e9e7] w-full sm:w-auto justify-between sm:justify-start">
                <Activity className="w-4 h-4 text-[#37352f]/40" />
                <select
                  value={tipeFilter}
                  onChange={(e) => setTipeFilter(e.target.value)}
                  className="text-xs font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
                >
                  <option value="Semua">Semua Tipe</option>
                  <option value="Materi">Materi (Teori)</option>
                  <option value="Motorik">Motorik (Praktik)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#e9e9e7] w-full sm:w-auto justify-between sm:justify-start">
                <Award className="w-4 h-4 text-[#37352f]/40" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="LULUS">Lulus</option>
                  <option value="TIDAK LULUS">Tidak Lulus</option>
                </select>
              </div>

              <button
                onClick={handlePrintUjian}
                className="flex items-center gap-2 bg-[#0b6e99] hover:bg-[#085a80] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#0b6e99]/10 w-full sm:w-auto justify-center"
              >
                <Printer className="w-4 h-4" />
                Cetak Laporan
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Identitas Siswa</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Tipe Ujian</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Pencapaian Skor</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Status Kelulusan</th>
                    <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-right">Waktu Ujian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9e9e7]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Memproses Laporan...</p>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((ujian) => (
                      <tr key={ujian.id} className="hover:bg-[#fbfbfa] transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#efefed] rounded-xl flex items-center justify-center text-[#37352f]/40 hover:bg-[#0b6e99] hover:text-white transition-all border border-[#e9e9e7]">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="font-bold text-[#37352f] text-base md:text-lg tracking-tight hover:text-[#0b6e99] transition-colors">
                              {ujian.akun_pengguna?.nama_lengkap || 'User Dihapus'}
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${ujian.jenis_ujian === 'motorik' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {ujian.jenis_ujian === 'motorik' ? 'Motorik' : 'Materi'}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex flex-col items-center justify-center bg-[#efefed] px-6 py-2 rounded-2xl border border-[#e9e9e7]">
                            <span className="text-2xl font-bold text-[#37352f] leading-none">{ujian.skor}</span>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Poin</span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${(ujian.status || '').toUpperCase() === 'LULUS'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                            {ujian.status}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-xs font-bold text-[#37352f]/40">
                            <Calendar className="w-3.5 h-3.5 text-[#37352f]/30" />
                            {ujian.created_at
                              ? new Date(ujian.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-20 text-center text-[#37352f]/40 font-medium italic">
                        Tidak ada riwayat ujian yang ditemukan.
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
                Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Kota Payakiph, 26218
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Hasil Ujian Siswa</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-500 uppercase text-[9px] tracking-wider">Filter Kriteria</p>
            <p className="font-bold text-black mt-0.5">Tipe: {tipeFilter} | Status: {statusFilter}</p>
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
              <th className="px-3 py-2 border-r border-gray-300">Nama Lengkap Siswa</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Tipe Ujian</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Skor</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Status Kelulusan</th>
              <th className="px-3 py-2 text-center">Tanggal Ujian</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((ujian, idx) => (
              <tr key={ujian.id || idx} className="border-b border-gray-300 text-xs">
                <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                <td className="px-3 py-2 border-r border-gray-300 font-semibold">{ujian.akun_pengguna?.nama_lengkap || 'User Dihapus'}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center">{ujian.jenis_ujian === 'motorik' ? 'Motorik' : 'Materi'}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center font-mono font-bold">{ujian.skor}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center uppercase tracking-wider text-[9px] font-bold">{ujian.status}</td>
                <td className="px-3 py-2 text-center font-mono">
                  {ujian.created_at ? new Date(ujian.created_at).toLocaleDateString('id-ID') : '-'}
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
