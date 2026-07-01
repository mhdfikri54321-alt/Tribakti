import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../../supabaseClient'; 
import Sidebar from './Sidebar'; 
import Footer from './Footer'; 
import Swal from 'sweetalert2'; 
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const MASTER_SEMUA_JAM = [ 
  { id: 1, value: '08:00', label: '08:00 WIB' }, 
  { id: 2, value: '09:00', label: '09:00 WIB' }, 
  { id: 3, value: '10:00', label: '10:00 WIB' }, 
  { id: 4, value: '11:00', label: '11:00 WIB' }, 
  { id: 5, value: '13:00', label: '13:00 WIB' }, 
  { id: 6, value: '14:00', label: '14:00 WIB' }, 
  { id: 7, value: '15:00', label: '15:00 WIB' }, 
  { id: 8, value: '16:00', label: '16:00 WIB' } 
]; 

export default function Jadwal() { 
  const navigate = useNavigate(); 
  const [listJadwal, setListJadwal] = useState([]); 
  const [listInstruktur, setListInstruktur] = useState([]); 
  const [listKurikulum, setListKurikulum] = useState([]); 
  const [siswaPackage, setSiswaPackage] = useState(null); 
  const [loadingPage, setLoadingPage] = useState(true); 
  
  const [showModalPesan, setShowModalPesan] = useState(false); 
  const [selectedSesi, setSelectedSesi] = useState(null); 
  const [showModalDetail, setShowModalDetail] = useState(false);
  const [detailSesiData, setDetailSesiData] = useState(null);

  const [instrukturTerpilih, setInstrukturTerpilih] = useState(''); 
  const [tanggalTerpilih, setTanggalTerpilih] = useState(''); 
  const [jamTerpilih, setJamTerpilih] = useState(''); 
  const [isRescheduleMode, setIsRescheduleMode] = useState(false);
  const [alasanReschedule, setAlasanReschedule] = useState('');
  const [listRatings, setListRatings] = useState([]);
  const [showModalRating, setShowModalRating] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingSkor, setRatingSkor] = useState(5);
  const [ratingUlasan, setRatingUlasan] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [jamTersediaList, setJamTersediaList] = useState([]); 
  const [loadingJam, setLoadingJam] = useState(false); 
  const [submitting, setSubmitting] = useState(false); 
  const [now, setNow] = useState(new Date().getTime());

  const savedUser = JSON.parse(localStorage.getItem('user')); 
  const akunId = savedUser?.id; 

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { 
    const initData = async () => { 
      setLoadingPage(true); 
      await fetchSiswaPackage();    
      await fetchMasterInstruktur(); 
      await fetchKurikulum();
      await fetchJadwalSiswa();
      await fetchStudentRatings();
      setLoadingPage(false); 
    }; 
    initData(); 
  }, []); 

  useEffect(() => { 
    if (instrukturTerpilih && tanggalTerpilih) { 
      fetchSlotJamDinamis(); 
    } else { 
      setJamTersediaList([]); 
      setJamTerpilih(''); 
    } 
  }, [instrukturTerpilih, tanggalTerpilih]); 

  const fetchSiswaPackage = async () => { 
    if (!akunId) return; 
    try { 
      const { data: userData } = await supabase 
        .from('akun_pengguna') 
        .select('paket, jumlah_sesi') 
        .eq('id', akunId) 
        .maybeSingle(); 
 
      const { data: pendaftaranData } = await supabase 
        .from('pendaftaran') 
        .select('status') 
        .eq('akun_id', akunId) 
        .order('created_at', { ascending: false }) 
        .limit(1) 
        .maybeSingle(); 
 
      if (userData) { 
        let sessionsCount = parseInt(userData.jumlah_sesi) || 0;
        if (!sessionsCount && userData.paket) {
          const lowerPaket = userData.paket.toLowerCase();
          if (lowerPaket.includes('plus')) sessionsCount = 11;
          else if (lowerPaket.includes('basic')) sessionsCount = 10;
          else if (lowerPaket.includes('terampil')) sessionsCount = 6;
          else if (lowerPaket.includes('mahir')) sessionsCount = 4;
        }

        setSiswaPackage({ 
          nama_paket: userData.paket, 
          jumlah_sesi: sessionsCount,
          status: pendaftaranData?.status || 'Belum Terdaftar' 
        }); 
      } 
    } catch (err) { 
      console.error("Gagal memuat paket siswa:", err.message); 
    } 
  }; 
 
  const fetchMasterInstruktur = async () => { 
    try { 
      const { data } = await supabase 
        .from('akun_pengguna') 
        .select('id, nama_lengkap') 
        .eq('role', 'instruktur'); 
      setListInstruktur(data || []); 
    } catch (err) { 
      console.error("Gagal memuat master instruktur:", err.message); 
    } 
  }; 

  const fetchKurikulum = async () => {
    try {
      const { data } = await supabase
        .from('kurikulum')
        .select('*')
        .order('pertemuan_ke', { ascending: true });
      setListKurikulum(data || []);
    } catch (err) {
      console.error("Gagal memuat kurikulum:", err.message);
    }
  };
 
  const fetchJadwalSiswa = async () => { 
    if (!akunId) return; 
    try { 
      const { data, error } = await supabase 
        .from('jadwal_latihan') 
        .select(`
          *, 
          kurikulum(materi), 
          instruktur:akun_pengguna!instruktur_id(nama_lengkap)
        `) 
        .eq('akun_id', akunId);

      if (error) {
        // Fallback jika join !instruktur_id gagal, coba fkey name
        const { data: retryData } = await supabase
          .from('jadwal_latihan')
          .select(`
            *, 
            kurikulum(materi), 
            instruktur:akun_pengguna!jadwal_latihan_instruktur_id_fkey(nama_lengkap)
          `)
          .eq('akun_id', akunId);
        
        processJadwalData(retryData || []);
      } else {
        processJadwalData(data || []);
      }
    } catch (err) { 
      console.error("Gagal memuat jadwal latihan:", err.message); 
    } 
  }; 

  const processJadwalData = (data) => {
    const formatted = data.map(d => ({
      ...d,
      pertemuan_ke: Number(d.pertemuan_ke),
      materi_judul: d.kurikulum?.materi || d.materi_judul,
      nama_instruktur: d.instruktur?.nama_lengkap || d.nama_instruktur
    })).sort((a, b) => {
      // Prioritaskan status yang sudah dijadwalkan jika ada nomor pertemuan sama
      if (a.pertemuan_ke === b.pertemuan_ke) {
        return a.status === 'Belum Dijadwalkan' ? 1 : -1;
      }
      return a.pertemuan_ke - b.pertemuan_ke;
    });

    // Ambil record unik per pertemuan (jika ada duplikat, ambil yang sudah dijadwalkan)
    const uniqueFormatted = [];
    const seen = new Set();
    formatted.forEach(item => {
      if (!seen.has(item.pertemuan_ke)) {
        uniqueFormatted.push(item);
        seen.add(item.pertemuan_ke);
      }
    });

    setListJadwal(uniqueFormatted);
  }; 
 
  const fetchSlotJamDinamis = async () => { 
    setLoadingJam(true); 
    try { 
      const { data, error } = await supabase 
        .from('slot_instruktur') 
        .select('id, jam, status') 
        .eq('instruktur_id', instrukturTerpilih) 
        .eq('tanggal', tanggalTerpilih)    
        .eq('status', 'Tersedia');         
 
      if (error) {
        const { data: retryData } = await supabase
          .from('slot_instruktur')
          .select('id, jam, status')
          .eq('akun_id', instrukturTerpilih)
          .eq('tanggal', tanggalTerpilih)
          .eq('status', 'Tersedia');
        setJamTersediaList(formatJamData(retryData));
      } else {
        setJamTersediaList(formatJamData(data));
      }
    } catch (err) { 
      console.error("Gagal memfilter jam:", err.message); 
    } finally { 
      setLoadingJam(false); 
    } 
  }; 

  const formatJamData = (data) => {
    return (data || []).map(item => { 
      const jamCleanText = String(item.jam).substring(0, 5); 
      const pencocokanMaster = MASTER_SEMUA_JAM.find(m => 
        m.id === Number(item.jam) || m.value === jamCleanText 
      ); 
      return { 
        id_slot: item.id, 
        jam_text: pencocokanMaster ? pencocokanMaster.value : jamCleanText 
      }; 
    });
  };

  const fetchStudentRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*');
      if (!error) {
        setListRatings(data || []);
      }
    } catch (err) {
      console.error("Gagal memuat ulasan siswa:", err.message);
    }
  };

  const hasBeenRated = (jadwalId) => {
    return listRatings.some(r => r.paket_siswa?.includes(`JadwalID: ${jadwalId}`));
  };

  const getSavedRating = (jadwalId) => {
    const found = listRatings.find(r => r.paket_siswa?.includes(`JadwalID: ${jadwalId}`));
    return found ? found.skor : '';
  };

  const handleBukaModalRatingInstruktur = (session) => {
    setRatingTarget(session);
    setRatingSkor(5);
    setRatingUlasan('');
    setShowModalRating(true);
  };

  const handleSimpanRatingInstruktur = async (e) => {
    e.preventDefault();
    if (!ratingTarget) return;
    setSubmittingRating(true);
    try {
      const payload = {
        nama_siswa: savedUser?.nama_lengkap || savedUser?.username || 'Siswa',
        paket_siswa: `Instruktur: ${ratingTarget.nama_instruktur} | Sesi: ${ratingTarget.pertemuan_ke} | JadwalID: ${ratingTarget.id}`,
        skor: ratingSkor,
        ulasan: ratingUlasan,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ratings')
        .insert([payload]);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Terima Kasih!',
        text: 'Rating dan ulasan Anda untuk instruktur telah tersimpan.',
        confirmButtonColor: '#0b6e99',
        customClass: { popup: 'rounded-xl border border-[#e9e9e7]' }
      });

      setShowModalRating(false);
      fetchStudentRatings();
    } catch (err) {
      alert("Gagal mengirim rating: " + err.message);
    } finally {
      setSubmittingRating(false);
    }
  };
 
  const handleBukaModalPesan = (sesi, reschedule = false) => { 
    setSelectedSesi(sesi); 
    setInstrukturTerpilih(''); 
    setTanggalTerpilih(''); 
    setJamTerpilih(''); 
    setIsRescheduleMode(reschedule);
    setAlasanReschedule('');
    setShowModalPesan(true); 
  }; 

  const handleBukaDetailSesi = (dataDbSesi, nomorSesi, infoMateri) => {
    setDetailSesiData({ ...dataDbSesi, nomorSesi, infoMateri });
    setShowModalDetail(true);
  };
 
  const handleSimpanBookingJadwal = async (e) => { 
    e.preventDefault(); 
    if (!jamTerpilih) { 
      return Swal.fire({ 
        icon: 'warning', 
        title: 'Jam Belum Dipilih', 
        text: 'Silakan tentukan jam latihan!', 
        confirmButtonColor: '#37352f', 
        customClass: { popup: 'rounded-xl border border-[#e9e9e7]' } 
      }); 
    } 
    setSubmitting(true); 
 
    const slotObj = jamTersediaList.find(slot => slot.jam_text === jamTerpilih); 
    const instrukturObj = listInstruktur.find(ins => String(ins.id) === String(instrukturTerpilih)); 
    const namaInstrukturText = instrukturObj?.nama_lengkap || 'Instruktur'; 
    const kurikulumObj = listKurikulum.find(k => Number(k.pertemuan_ke) === Number(selectedSesi.pertemuan_ke));
 
    try { 
      // Pelepasan slot lama jika ada
      const { data: existing } = await supabase
        .from('jadwal_latihan')
        .select('*')
        .eq('akun_id', akunId)
        .eq('pertemuan_ke', selectedSesi.pertemuan_ke)
        .maybeSingle();

      if (existing?.tanggal_waktu) {
         const oldDate = new Date(existing.tanggal_waktu);
         const oldTanggal = oldDate.toLocaleDateString('en-CA'); 
         const oldJam = `${String(oldDate.getHours()).padStart(2, '0')}:${String(oldDate.getMinutes()).padStart(2, '0')}`;

         await supabase
          .from('slot_instruktur')
          .update({ status: 'Tersedia' })
          .eq('instruktur_id', existing.instruktur_id)
          .eq('tanggal', oldTanggal)
          .eq('jam', oldJam);
      }

      const payload = { 
        akun_id: akunId, 
        instruktur_id: instrukturTerpilih, 
        kurikulum_id: kurikulumObj?.id,
        tanggal_waktu: `${tanggalTerpilih}T${jamTerpilih}:00+07:00`,
        pertemuan_ke: selectedSesi.pertemuan_ke, 
        status: isRescheduleMode ? 'Pengajuan Reschedule' : 'Dijadwalkan',
        catatan_instruktur: isRescheduleMode ? `Alasan Reschedule: ${alasanReschedule}` : null,
        created_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updErr } = await supabase.from('jadwal_latihan').update(payload).eq('id', existing.id);
        error = updErr;
      } else {
        const { error: insErr } = await supabase.from('jadwal_latihan').insert([payload]);
        error = insErr;
      }
 
      if (error) throw error; 
 
      const { error: slotErr } = await supabase 
        .from('slot_instruktur') 
        .update({ status: 'Booked' }) 
        .eq('id', slotObj.id_slot); 
 
      if (slotErr) throw slotErr; 
 
      Swal.fire({ 
        icon: 'success', 
        title: 'Berhasil!', 
        text: isRescheduleMode 
          ? 'Pengajuan reschedule Anda telah terkirim dan menunggu persetujuan instruktur.' 
          : 'Jadwal latihan Anda telah berhasil dipesan.', 
        confirmButtonColor: '#0b6e99',
        customClass: { popup: 'rounded-xl border border-[#e9e9e7]' }
      }); 
 
      setShowModalPesan(false); 
      fetchJadwalSiswa(); 
    } catch (err) { 
      Swal.fire({ icon: 'error', title: 'Gagal Booking', text: err.message }); 
    } finally { 
      setSubmitting(false); 
    } 
  }; 

  const formatCountdown = (diffMs) => {
    if (diffMs <= 0) return "00:00";
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSesiContent = (nomorSesi) => {
    const dataDb = listJadwal.find(j => Number(j.pertemuan_ke) === nomorSesi);
    const infoMateri = listKurikulum.find(k => Number(k.pertemuan_ke) === nomorSesi);
    
    if (dataDb) {
      // Grace period check (10 minutes)
      const createdAt = new Date(dataDb.created_at).getTime();
      const lockTime = createdAt + (10 * 60 * 1000);
      const isLocked = now > lockTime && dataDb.status !== 'Selesai' && dataDb.status !== 'Belum Dijadwalkan';
      const remainingMs = lockTime - now;

      return (
        <div className="bg-white border border-[#e9e9e7] rounded-xl p-6 hover:border-[#0b6e99]/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#efefed] rounded-lg flex items-center justify-center text-[#37352f]/40">
                <CheckCircle2 className={`w-4 h-4 ${dataDb.status === 'Selesai' ? 'text-emerald-500' : ''}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Pertemuan {nomorSesi}</p>
                <h4 className="text-sm font-bold truncate max-w-[150px]">{dataDb.materi_judul}</h4>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${dataDb.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' : dataDb.status === 'Belum Dijadwalkan' ? 'bg-slate-100 text-slate-500' : dataDb.status === 'Pengajuan Reschedule' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              {dataDb.status}
            </span>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs font-medium text-[#37352f]/60">
              <CalendarIcon className="w-3 h-3" /> {dataDb.tanggal || dataDb.tanggal_waktu ? new Date(dataDb.tanggal || dataDb.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Belum diatur'}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#37352f]/60">
              <Clock className="w-3 h-3" /> {dataDb.jam ? `${dataDb.jam} WIB` : dataDb.tanggal_waktu ? `${new Date(dataDb.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')} WIB` : 'Belum diatur'}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#37352f]/60">
              <User className="w-3 h-3" /> {dataDb.nama_instruktur || 'Belum diatur'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleBukaDetailSesi(dataDb, nomorSesi, infoMateri)}
              className="w-full py-2 bg-[#efefed] hover:bg-[#37352f] hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Lihat Detail
            </button>
            {dataDb.status === 'Selesai' && (
              hasBeenRated(dataDb.id) ? (
                <div className="text-center py-2 text-[9px] font-bold text-emerald-600 uppercase tracking-widest border border-emerald-100 bg-emerald-50/30 rounded-lg">
                  Rating Diberikan ⭐ {getSavedRating(dataDb.id)}
                </div>
              ) : (
                <button 
                  onClick={() => handleBukaModalRatingInstruktur(dataDb)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer"
                >
                  Beri Rating Instruktur
                </button>
              )
            )}
            {dataDb.status !== 'Selesai' && (
              dataDb.status === 'Belum Dijadwalkan' ? (
                <button 
                  onClick={() => handleBukaModalPesan({ pertemuan_ke: nomorSesi })}
                  className="w-full py-2 bg-[#0b6e99] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#0b6e99]/90 transition-all shadow-lg shadow-[#0b6e99]/20"
                >
                  Booking Sekarang
                </button>
              ) : dataDb.status === 'Pengajuan Reschedule' ? (
                <div className="text-center py-2 text-[9px] font-bold text-blue-500 uppercase tracking-widest border border-blue-100 bg-blue-50/30 rounded-lg">
                  Menunggu Persetujuan
                </div>
              ) : isLocked ? (
                <button 
                  onClick={() => handleBukaModalPesan({ pertemuan_ke: nomorSesi }, true)}
                  className="w-full py-2 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Ajukan Reschedule
                </button>
              ) : (
                <div className="space-y-1">
                  <button 
                    onClick={() => handleBukaModalPesan({ pertemuan_ke: nomorSesi })}
                    className="w-full py-2 bg-[#0b6e99]/5 text-[#0b6e99] hover:bg-[#0b6e99] hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-[#0b6e99]/10"
                  >
                    Ubah Jadwal
                  </button>
                  <p className="text-[9px] text-center font-bold text-amber-500 uppercase tracking-tighter">
                    Batas Ubah: {formatCountdown(remainingMs)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#fbfbfa] border border-dashed border-[#e9e9e7] rounded-xl p-6 flex flex-col items-center justify-center text-center group hover:bg-white hover:border-[#0b6e99]/30 transition-all min-h-[200px]">
        <div className="w-10 h-10 bg-[#efefed] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Plus className="w-5 h-5 text-[#37352f]/20" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Pertemuan {nomorSesi}</p>
        <p className="text-xs font-medium text-[#37352f]/20 mb-4 italic">Belum dijadwalkan</p>
        <button 
          onClick={() => handleBukaModalPesan({ pertemuan_ke: nomorSesi })}
          className="px-4 py-1.5 bg-white border border-[#e9e9e7] text-[#37352f] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#37352f] hover:text-white transition-all shadow-sm"
        >
          Booking
        </button>
      </div>
    );
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="jadwal" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Jadwal Kursus</span>
          </div>
          <button 
            onClick={() => navigate('/profil')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer border-0 bg-transparent text-[#37352f] text-left p-0"
          >
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Siswa'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Siswa</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {savedUser?.nama_lengkap?.charAt(0) || 'S'}
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <div className="mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Agenda Latihan 🗓️</h2>
            <p className="text-lg text-[#37352f]/70 leading-relaxed max-w-2xl font-medium">
              Atur waktu latihan praktik Anda secara mandiri. Pilih instruktur dan jam yang sesuai dengan ketersediaan Anda.
            </p>
          </div>

          {loadingPage ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#37352f]/20">
               <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
               <p className="text-xs font-bold uppercase tracking-widest">Memuat jadwal...</p>
            </div>
          ) : !(siswaPackage?.status === 'Aktif' || siswaPackage?.status === 'Berhasil') ? (
            <div className="bg-white border border-amber-100 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#37352f]">Fitur Belum Terbuka</h3>
              <p className="text-sm text-[#37352f]/60 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                Anda harus menyelesaikan pendaftaran dan pembayaran paket terlebih dahulu sebelum dapat menyusun jadwal latihan.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-[#37352f] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
              >
                Cek Status Pendaftaran
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listJadwal.length > 0 ? (
                listJadwal.map(jadwal => (
                  <div key={jadwal.pertemuan_ke}>{getSesiContent(jadwal.pertemuan_ke)}</div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-sm text-[#37352f]/40 font-medium italic">
                  Belum ada sesi latihan yang dibuat oleh Admin.
                </div>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* MODAL BOOKING */}
      {showModalPesan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#37352f]/20 backdrop-blur-[2px]" onClick={() => setShowModalPesan(false)}></div>
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="p-6 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <h3 className="text-lg font-bold">{isRescheduleMode ? 'Ajukan Reschedule' : 'Booking'} Pertemuan {selectedSesi?.pertemuan_ke}</h3>
              <button onClick={() => setShowModalPesan(false)} className="text-[#37352f]/40 hover:text-red-500 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSimpanBookingJadwal} className="p-6 md:p-8 space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2 block">Pilih Instruktur</label>
                <select 
                  required
                  value={instrukturTerpilih}
                  onChange={(e) => setInstrukturTerpilih(e.target.value)}
                  className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                >
                  <option value="">-- Pilih Instruktur --</option>
                  {listInstruktur.map(ins => <option key={ins.id} value={ins.id}>{ins.nama_lengkap}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2 block">Pilih Tanggal</label>
                <input 
                  type="date" 
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={tanggalTerpilih}
                  onChange={(e) => setTanggalTerpilih(e.target.value)}
                  className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2 block">Pilih Jam</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {loadingJam ? (
                    <div className="col-span-4 text-center py-4 text-[10px] font-bold text-[#37352f]/20 animate-pulse uppercase tracking-widest">Mencari slot...</div>
                  ) : jamTersediaList.length > 0 ? (
                    jamTersediaList.map(slot => (
                      <button
                        key={slot.id_slot}
                        type="button"
                        onClick={() => setJamTerpilih(slot.jam_text)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all border ${jamTerpilih === slot.jam_text ? 'bg-[#37352f] text-white border-[#37352f]' : 'bg-white border-[#e9e9e7] hover:border-[#0b6e99]'}`}
                      >
                        {slot.jam_text}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-4 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                      {instrukturTerpilih && tanggalTerpilih ? 'Tidak ada slot tersedia' : 'Pilih instruktur & tanggal'}
                    </div>
                  )}
                </div>
              </div>

              {isRescheduleMode && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2 block">Alasan Reschedule</label>
                  <textarea 
                    required 
                    rows="3"
                    className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none resize-none"
                    placeholder="Tuliskan alasan pengajuan reschedule..."
                    value={alasanReschedule}
                    onChange={(e) => setAlasanReschedule(e.target.value)}
                  ></textarea>
                </div>
              )}

              <div className="pt-4">
                <button 
                  disabled={submitting || !jamTerpilih}
                  className="w-full bg-[#37352f] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {submitting ? 'Memproses...' : isRescheduleMode ? 'Ajukan Reschedule' : 'Konfirmasi Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL SESI */}
      {showModalDetail && detailSesiData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#37352f]/20 backdrop-blur-[2px]" onClick={() => setShowModalDetail(false)}></div>
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="p-6 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-[#e9e9e7] rounded-xl flex items-center justify-center text-[#0b6e99]">
                   <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-none">Pertemuan {detailSesiData.nomorSesi}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Detail Sesi Latihan</p>
                </div>
              </div>
              <button onClick={() => setShowModalDetail(false)} className="text-[#37352f]/40 hover:text-red-500 transition-colors">✕</button>
            </div>

            <div className="p-6 md:p-8">
               <div className="grid grid-cols-2 gap-4 md:gap-8 mb-10">
                  <div className="bg-[#fbfbfa] p-4 rounded-xl border border-[#e9e9e7]">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Materi Praktik</p>
                     <p className="text-sm font-bold text-[#37352f]">{detailSesiData.materi_judul || detailSesiData.infoMateri?.judul || 'Latihan Praktik'}</p>
                  </div>
                  <div className="bg-[#fbfbfa] p-4 rounded-xl border border-[#e9e9e7]">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Status Kehadiran</p>
                     <p className={`text-sm font-bold ${detailSesiData.status === 'Selesai' ? 'text-emerald-600' : detailSesiData.status === 'Belum Dijadwalkan' ? 'text-slate-500' : 'text-amber-600'}`}>{detailSesiData.status}</p>
                  </div>
                  <div className="bg-[#fbfbfa] p-4 rounded-xl border border-[#e9e9e7]">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Nilai Performa</p>
                     <p className="text-sm font-bold text-[#0b6e99]">{detailSesiData.nilai ?? '-'}</p>
                  </div>
               </div>

               <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-4 text-sm font-medium">
                     <div className="w-8 h-8 bg-[#efefed] rounded-lg flex items-center justify-center text-[#37352f]/40 shrink-0"><CalendarIcon className="w-4 h-4" /></div>
                     <span className="text-[#37352f]/60">Tanggal:</span>
                     <span className="font-bold">{detailSesiData.tanggal || detailSesiData.tanggal_waktu ? new Date(detailSesiData.tanggal || detailSesiData.tanggal_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum diatur'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium">
                     <div className="w-8 h-8 bg-[#efefed] rounded-lg flex items-center justify-center text-[#37352f]/40 shrink-0"><Clock className="w-4 h-4" /></div>
                     <span className="text-[#37352f]/60">Waktu:</span>
                     <span className="font-bold">{detailSesiData.jam ? `${detailSesiData.jam} WIB` : detailSesiData.tanggal_waktu ? `${new Date(detailSesiData.tanggal_waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')} WIB` : 'Belum diatur'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium">
                     <div className="w-8 h-8 bg-[#efefed] rounded-lg flex items-center justify-center text-[#37352f]/40 shrink-0"><User className="w-4 h-4" /></div>
                     <span className="text-[#37352f]/60">Instruktur:</span>
                     <span className="font-bold">{detailSesiData.nama_instruktur || 'Belum diatur'}</span>
                  </div>
               </div>

               {detailSesiData.catatan_instruktur && (
                 <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Catatan Evaluasi Instruktur</p>
                     <p className="text-sm font-medium text-blue-900 leading-relaxed italic">"{detailSesiData.catatan_instruktur}"</p>
                  </div>
               )}
            </div>

            <div className="p-6 bg-[#fbfbfa] border-t border-[#e9e9e7] flex justify-center">
               <button 
                onClick={() => setShowModalDetail(false)}
                className="bg-[#37352f] text-white px-10 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
               >
                 Tutup Detail
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RATING INSTRUKTUR */}
      {showModalRating && ratingTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#37352f]/20 backdrop-blur-[2px]" onClick={() => setShowModalRating(false)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="p-6 border-b border-[#e9e9e7] flex justify-between items-center bg-[#fbfbfa]">
              <h3 className="text-lg font-bold">Beri Rating Instruktur</h3>
              <button onClick={() => setShowModalRating(false)} className="text-[#37352f]/40 hover:text-red-500 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSimpanRatingInstruktur} className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm font-semibold text-[#37352f]/60 mb-1">Instruktur Anda:</p>
                <p className="text-lg font-bold text-[#37352f]">{ratingTarget.nama_instruktur}</p>
                <p className="text-xs text-[#0b6e99] font-bold uppercase tracking-wider mt-1">Pertemuan {ratingTarget.pertemuan_ke}: {ratingTarget.materi_judul}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 block text-center">Penilaian Anda</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingSkor(star)}
                      className="text-amber-400 hover:scale-110 active:scale-95 transition-all cursor-pointer border-0 bg-transparent"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={ratingSkor >= star ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-10 h-10"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-2 block">Ulasan / Testimoni</label>
                <textarea
                  required
                  rows="3"
                  value={ratingUlasan}
                  onChange={(e) => setRatingUlasan(e.target.value)}
                  placeholder="Ceritakan pengalaman belajar Anda bersama instruktur..."
                  className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRating}
                className="w-full bg-[#0b6e99] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#085a80] disabled:opacity-50 transition-all shadow-md shadow-[#0b6e99]/20 cursor-pointer"
              >
                {submittingRating ? 'Mengirim...' : 'Kirim Penilaian'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
