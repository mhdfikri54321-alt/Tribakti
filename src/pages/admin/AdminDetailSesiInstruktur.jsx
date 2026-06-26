import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import Footer from '../siswa/Footer';
import logoTribakti from '../../assets/logo_tribaktii.png';
import { 
  ChevronRight, 
  ArrowLeft, 
  BookOpen, 
  User, 
  Calendar, 
  Activity, 
  CheckCircle2,
  Clock,
  Briefcase,
  Printer
} from 'lucide-react';

export default function AdminDetailSesiInstruktur() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const instrukturId = searchParams.get('id');
  const namaInstrukturParam = searchParams.get('nama') || 'Instruktur';

  const [sesiList, setSesiList] = useState([]);
  const [instrukturInfo, setInstrukturInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBulan, setSelectedBulan] = useState('Semua');

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (instrukturId) {
      fetchInstrukturData();
    } else {
      setLoading(false);
    }
  }, [instrukturId]);

  const fetchInstrukturData = async () => {
    setLoading(true);
    try {
      // 1. Fetch info instruktur
      const { data: instData, error: instErr } = await supabase
        .from('akun_pengguna')
        .select('username, nik, nama_lengkap')
        .eq('id', instrukturId)
        .single();
      
      if (!instErr && instData) {
        setInstrukturInfo(instData);
      }

      // 2. Fetch jadwal mengajar
      const { data, error } = await supabase
        .from('jadwal_latihan')
        .select(`
          id,
          pertemuan_ke,
          status,
          tanggal_waktu,
          siswa:akun_pengguna!jadwal_latihan_akun_id_fkey(nama_lengkap),
          kurikulum(materi)
        `)
        .eq('instruktur_id', instrukturId)
        .order('tanggal_waktu', { ascending: false });

      if (error) throw error;
      setSesiList(data || []);
    } catch (err) {
      console.error("Error fetching instructor teaching sessions:", err.message);
      alert("Gagal memuat detail sesi mengajar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Nama instruktur yang ditampilkan (prioritaskan hasil fetch, fallback ke query param)
  const namaInstruktur = instrukturInfo?.nama_lengkap || namaInstrukturParam;

  // Filter bulanan
  const getAvailableMonths = () => {
    const monthsSet = new Set();
    sesiList.forEach(sesi => {
      if (sesi.tanggal_waktu) {
        const m = new Date(sesi.tanggal_waktu).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        monthsSet.add(m);
      }
    });
    return ['Semua', ...Array.from(monthsSet)];
  };

  const displayedSesiList = sesiList.filter(sesi => {
    if (selectedBulan === 'Semua') return true;
    if (!sesi.tanggal_waktu) return false;
    const m = new Date(sesi.tanggal_waktu).toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    return m === selectedBulan;
  });

  // Hitung statistik mengajar berdasarkan data terfilter
  const totalSesi = displayedSesiList.length;
  const sesiSelesai = displayedSesiList.filter(s => s.status === 'Selesai').length;
  const sesiBelum = totalSesi - sesiSelesai;
  
  // Dapatkan jumlah unik siswa yang diajar berdasarkan data terfilter
  const uniqueStudents = new Set(displayedSesiList.map(s => s.siswa?.nama_lengkap).filter(Boolean));
  const totalSiswaDiajar = uniqueStudents.size;



  return (
    <>
      {/* Tampilan Layar Utama */}
      <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans print:hidden">
        <AdminSidebar activeMenu="instruktur" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#37352f]/60 cursor-pointer hover:text-[#0b6e99]" onClick={() => navigate('/admin/instruktur')}>Manajemen Instruktur</span>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Detail Sesi Mengajar</span>
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
          {/* Header & Back Action */}
          <div className="mb-8 md:mb-12">
            <button 
              onClick={() => navigate('/admin/instruktur')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#37352f]/50 hover:text-[#37352f] transition-colors uppercase tracking-wider mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Instruktur
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3">
                  <Briefcase className="w-3 h-3 text-[#0b6e99]" />
                  Detail Sesi Instruktur
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 leading-tight">
                  Sesi Mengajar <span className="text-[#37352f]/40">{namaInstruktur}</span>
                </h2>
                <p className="text-[#37352f]/60 text-sm font-medium leading-relaxed">
                  Rincian data log mengajar instruktur, kurikulum yang diajarkan, siswa pendamping, dan riwayat presensi.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto self-end md:self-center">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#e9e9e7]">
                  <Calendar className="w-4 h-4 text-[#0b6e99]" />
                  <select
                    value={selectedBulan}
                    onChange={(e) => setSelectedBulan(e.target.value)}
                    className="text-xs font-bold text-[#37352f] outline-none bg-transparent cursor-pointer py-1"
                  >
                    {getAvailableMonths().map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-[#37352f] hover:bg-[#2c2a25] text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-[#37352f]/10 cursor-pointer justify-center"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Laporan
                </button>
              </div>
            </div>
          </div>



          {/* Sesi List Section */}
          <div className="bg-white rounded-2xl border border-[#e9e9e7] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#e9e9e7] bg-[#fbfbfa] flex justify-between items-center">
              <h4 className="text-sm font-bold uppercase tracking-widest text-[#37352f]/60">Daftar Log Mengajar</h4>
              <span className="bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-full text-[10px] font-bold">
                {displayedSesiList.length} Entri Mengajar
              </span>
            </div>

            <div className="p-6 md:p-8">
              {loading ? (
                <div className="py-24 text-center">
                  <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4 mx-auto"></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Mengumpulkan data sesi...</p>
                </div>
              ) : displayedSesiList.length > 0 ? (
                <div className="space-y-4">
                  {displayedSesiList.map((sesi) => (
                    <div 
                      key={sesi.id} 
                      className="bg-white border border-[#e9e9e7] p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#0b6e99]/25 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex gap-4 items-center min-w-0">
                        <div className="w-12 h-12 bg-[#efefed] text-[#0b6e99] rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-[#e9e9e7]/55">
                          {sesi.pertemuan_ke}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base text-[#37352f] tracking-tight truncate">
                            {sesi.kurikulum?.materi || 'Sesi Materi Belajar'}
                          </p>
                          <p className="text-xs font-semibold text-[#37352f]/50 mt-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#37352f]/30" />
                            Siswa: <span className="text-[#37352f]">{sesi.siswa?.nama_lengkap || 'User Dihapus'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end shrink-0 border-t border-[#efefed] md:border-none pt-4 md:pt-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#37352f]/30" />
                          <div>
                            <p className="text-[8px] font-bold text-[#37352f]/40 uppercase tracking-widest leading-none mb-0.5">Tanggal Sesi</p>
                            <p className="text-xs font-bold text-[#37352f]/70">
                              {sesi.tanggal_waktu 
                                ? new Date(sesi.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : '-'
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${
                              sesi.status === 'Selesai' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {sesi.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-sm text-[#37352f]/40 font-medium italic">
                  Instruktur belum memiliki riwayat sesi mengajar.
                </div>
              )}
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>

    {/* Tampilan Cetak (Hanya Muncul saat Cetak / Print Mode) */}
    <div className="hidden print:block w-full text-[#37352f] font-sans p-8 bg-white min-h-screen relative">
      {/* Header Laporan */}
      <div className="flex items-center justify-between border-b-2 border-[#37352f] pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white border border-[#e9e9e7] rounded-xl flex items-center justify-center p-2 shrink-0">
            <img src={logoTribakti} alt="Logo LPK" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#37352f] leading-none mb-1">LPK TRI BAKTI</h2>
            <p className="text-xs text-[#37352f]/60 font-bold uppercase tracking-wider">Driving School & Education</p>
            <p className="text-[10px] text-[#37352f]/50 mt-1 max-w-sm">Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Kota Payakumbuh</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-[#0b6e99] leading-none mb-1">LAPORAN JADWAL MENGAJAR</h1>
          <p className="text-[10px] font-bold text-[#37352f]/50 uppercase tracking-widest">LOG MENGAJAR INSTRUKTUR</p>
          <p className="text-xs font-semibold text-[#37352f] mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Informasi Instruktur & Ringkasan */}
      <div className="grid grid-cols-2 gap-6 mb-6 bg-[#efefed]/25 p-4 rounded-xl border border-[#e9e9e7]">
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="w-36 font-medium text-[#37352f]/60">Nama Instruktur</span>
            <span className="font-bold">: {namaInstruktur}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-medium text-[#37352f]/60">NIK</span>
            <span>: {instrukturInfo?.nik || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-medium text-[#37352f]/60">Username</span>
            <span>: {instrukturInfo?.username || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-medium text-[#37352f]/60">Periode Laporan</span>
            <span className="font-semibold">: {selectedBulan}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="w-40 font-medium text-[#37352f]/60">Total Sesi Mengajar</span>
            <span className="font-bold">: {totalSesi} Sesi</span>
          </div>
          <div className="flex">
            <span className="w-40 font-medium text-[#37352f]/60">Sesi Selesai</span>
            <span className="font-semibold text-emerald-600">: {sesiSelesai} Sesi</span>
          </div>
          <div className="flex">
            <span className="w-40 font-medium text-[#37352f]/60">Jumlah Siswa Diajar</span>
            <span className="font-bold text-[#0b6e99]">: {totalSiswaDiajar} Siswa</span>
          </div>
        </div>
      </div>

      {/* Tabel Log Mengajar */}
      <table className="w-full text-left border-collapse mb-8 text-sm">
        <thead>
          <tr className="bg-[#fbfbfa] border-b border-[#e9e9e7]">
            <th className="p-3 border border-[#e9e9e7] font-bold text-xs uppercase tracking-wider text-[#37352f]/60 text-center w-16">Pertemuan</th>
            <th className="p-3 border border-[#e9e9e7] font-bold text-xs uppercase tracking-wider text-[#37352f]/60">Materi Latihan</th>
            <th className="p-3 border border-[#e9e9e7] font-bold text-xs uppercase tracking-wider text-[#37352f]/60">Nama Siswa</th>
            <th className="p-3 border border-[#e9e9e7] font-bold text-xs uppercase tracking-wider text-[#37352f]/60 text-center w-40">Tanggal & Waktu</th>
            <th className="p-3 border border-[#e9e9e7] font-bold text-xs uppercase tracking-wider text-[#37352f]/60 text-center w-28">Status</th>
          </tr>
        </thead>
        <tbody>
          {displayedSesiList.map((sesi) => (
            <tr key={sesi.id} className="border-b border-[#e9e9e7]">
              <td className="p-3 border border-[#e9e9e7] text-center font-semibold">{sesi.pertemuan_ke}</td>
              <td className="p-3 border border-[#e9e9e7] font-medium">{sesi.kurikulum?.materi || 'Materi Belajar'}</td>
              <td className="p-3 border border-[#e9e9e7]">{sesi.siswa?.nama_lengkap || 'User Dihapus'}</td>
              <td className="p-3 border border-[#e9e9e7] text-center">
                {sesi.tanggal_waktu 
                  ? new Date(sesi.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '-'
                }
              </td>
              <td className="p-3 border border-[#e9e9e7] text-center">
                <span className={`font-bold ${sesi.status === 'Selesai' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {sesi.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tanda Tangan */}
      <div className="flex justify-end mt-12 text-center">
        <div>
          <p className="text-sm mb-16">
            Payakumbuh, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="border-b border-[#37352f]/40 w-48 mx-auto mb-1 font-bold text-sm">
            {savedUser?.nama_lengkap || 'Administrator'}
          </div>
          <p className="text-xs text-[#37352f]/60 font-bold uppercase tracking-wider">LPK TRI BAKTI</p>
        </div>
      </div>

      {/* Watermark / Logo background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none -z-10 select-none">
        <img src={logoTribakti} alt="watermark" className="w-[400px] h-[400px]" />
      </div>
    </div>
  </>
  );
}
