import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from '../siswa/Footer';
import { ChevronRight, Clock, Plus, Trash2, Calendar } from 'lucide-react';

export default function ManageJam() {
  const navigate = useNavigate();
  const [loadingPage, setLoadingPage] = useState(true); 
  const [loadingTable, setLoadingTable] = useState(false); 
  const [listSlotSaya, setListSlotSaya] = useState([]);
  
  // State Input Form Slot Baru
  const [inputTanggal, setInputTanggal] = useState('');
  const [inputJam, setInputJam] = useState('');

  // State Tanggal Filter Pencarian
  const [filterTanggal, setFilterTanggal] = useState('');

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const instrukturId = savedUser?.id;
  const namaInstruktur = savedUser?.nama_lengkap || savedUser?.username || 'Instruktur';

  const masterSemuaJam = [
    { id: 1, value: '08:00', label: '08:00 WIB' },
    { id: 2, value: '09:00', label: '09:00 WIB' },
    { id: 3, value: '10:00', label: '10:00 WIB' },
    { id: 4, value: '11:00', label: '11:00 WIB' },
    { id: 5, value: '13:00', label: '13:00 WIB' },
    { id: 6, value: '14:00', label: '14:00 WIB' },
    { id: 7, value: '15:00', label: '15:00 WIB' },
    { id: 8, value: '16:00', label: '16:00 WIB' }
  ];

  useEffect(() => {
    if (!instrukturId) {
      navigate('/');
      return;
    }

    const loadDataJadwal = async () => {
      if (listSlotSaya.length === 0) {
        setLoadingPage(true);
      } else {
        setLoadingTable(true);
      }
      
      await fetchSlotSaya();
      
      setLoadingPage(false);
      setLoadingTable(false);
    };

    loadDataJadwal();
  }, [instrukturId, filterTanggal]);

  const fetchSlotSaya = async () => {
    try {
      // 1. Ambil data slot instruktur
      let querySlot = supabase
        .from('slot_instruktur')
        .select('*')
        .eq('akun_id', instrukturId)
        .order('tanggal', { ascending: true });

      if (filterTanggal) {
        querySlot = querySlot.eq('tanggal', filterTanggal);
      }

      // 2. Ambil data jadwal_latihan untuk mencocokkan nama siswa
      const [resSlot, resJadwal] = await Promise.all([
        querySlot,
        supabase
          .from('jadwal_latihan')
          .select('tanggal_waktu, akun_pengguna!akun_id(nama_lengkap)')
          .eq('instruktur_id', instrukturId)
      ]);

      if (resSlot.error) throw resSlot.error;
      if (resJadwal.error) throw resJadwal.error;

      const slots = resSlot.data || [];
      const jadwals = resJadwal.data || [];

      // 3. Deteksi Otomatis & Perbaiki Slot "Yatim" (Terpakai tapi tidak ada di jadwal_latihan)
      const orphanSlotIds = [];
      const slotsWithSiswa = slots.map(slot => {
        let namaSiswa = null;
        
        if (slot.status === 'Terpakai' || slot.status === 'Booked') {
          const jamBersih = slot.jam.length === 5 ? `${slot.jam}:00` : slot.jam;
          const slotTimeMs = new Date(`${slot.tanggal}T${jamBersih}+07:00`).getTime();
          
          const matchedJadwal = jadwals.find(j => {
            if (!j.tanggal_waktu) return false;
            const jTimeMs = new Date(j.tanggal_waktu).getTime();
            return jTimeMs === slotTimeMs;
          });

          if (matchedJadwal) {
            namaSiswa = matchedJadwal.akun_pengguna?.nama_lengkap;
          } else {
            // Jika tidak ada jadwal yang cocok, tandai untuk di-reset otomatis
            orphanSlotIds.push(slot.id);
          }
        }
        
        return { ...slot, nama_siswa: namaSiswa };
      });

      // Jika ditemukan slot yatim, lakukan perbaikan otomatis di background
      if (orphanSlotIds.length > 0) {
        console.log(`LOG: Mengotomatisasi reset ${orphanSlotIds.length} slot tanpa sinkronisasi.`);
        await supabase
          .from('slot_instruktur')
          .update({ status: 'Tersedia' })
          .in('id', orphanSlotIds);
        
        // Refresh data setelah perbaikan otomatis
        return fetchSlotSaya();
      }

      setListSlotSaya(slotsWithSiswa);
    } catch (err) {
      console.error("Gagal memuat slot kerja:", err.message);
    }
  };

  const handleTambahSlot = async (e) => {
    e.preventDefault();
    if (!inputTanggal || !inputJam) return alert("Silakan lengkapi tanggal & jam!");
    setLoadingTable(true);

    try {
      const { error } = await supabase
        .from('slot_instruktur')
        .insert([
          {
            akun_id: instrukturId,
            tanggal: inputTanggal,
            jam: inputJam,
            status: 'Tersedia'
          }
        ]);

      if (error) throw error;

      alert("Slot jam mengemudi berhasil ditambahkan! 👍");
      setInputJam('');
      await fetchSlotSaya();
    } catch (err) {
      alert("Gagal menambah slot: " + err.message);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleHapusSlot = async (idSlot) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus slot waktu ini?")) return;
    setLoadingTable(true);

    try {
      const { error } = await supabase
        .from('slot_instruktur')
        .delete()
        .eq('id', idSlot);

      if (error) throw error;
      await fetchSlotSaya();
    } catch (err) {
      alert("Gagal menghapus slot: " + err.message);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleResetSlot = async (idSlot) => {
    if (!window.confirm("Slot ini tampak bermasalah (siswa tidak ditemukan). Kembalikan status menjadi 'Tersedia'?")) return;
    setLoadingTable(true);

    try {
      const { error } = await supabase
        .from('slot_instruktur')
        .update({ status: 'Tersedia' })
        .eq('id', idSlot);

      if (error) throw error;
      await fetchSlotSaya();
    } catch (err) {
      alert("Gagal mereset slot: " + err.message);
    } finally {
      setLoadingTable(false);
    }
  };

  if (loadingPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfa] text-[#37352f]/40">
        <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Memuat data slot...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="instruktur" activeMenu="atur jam kursus" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Atur Jam Kursus</span>
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

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <Clock className="w-3 h-3 text-[#0b6e99]" />
              Ketersediaan Waktu
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Atur Jam <span className="text-[#0b6e99]">Kursus</span>
            </h2>
            <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
              Buka slot waktu mengajar Anda agar siswa dapat melakukan booking sesi latihan sesuai dengan ketersediaan Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            
            {/* Form Input Slot Baru */}
            <div className="lg:col-span-1">
              <div className="static lg:sticky lg:top-24">
                <div className="bg-white border border-[#e9e9e7] p-6 md:p-8 rounded-2xl shadow-sm">
                  <h3 className="text-base md:text-lg font-bold text-[#37352f] tracking-tight mb-4 md:mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#0b6e99] text-white rounded-lg flex items-center justify-center text-xs">+</span>
                    Buka Slot Baru
                  </h3>
                  
                  <form onSubmit={handleTambahSlot} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Pilih Tanggal</label>
                      <input 
                        type="date" 
                        required 
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-[#efefed] border border-[#e9e9e7] rounded-xl px-4 py-3 text-sm font-semibold text-[#37352f] outline-none transition-all focus:bg-white focus:border-[#0b6e99]/30 cursor-pointer"
                        value={inputTanggal}
                        onChange={(e) => setInputTanggal(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#37352f]/40 tracking-widest ml-1">Pilih Jam Mengajar</label>
                      <div className="grid grid-cols-2 gap-3">
                        {masterSemuaJam.map(slot => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setInputJam(slot.value)}
                            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${inputJam === slot.value ? 'bg-[#37352f] text-white border-[#37352f]' : 'bg-[#fbfbfa] text-[#37352f]/60 border-[#e9e9e7] hover:border-[#0b6e99]/30'}`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loadingTable}
                      className="w-full bg-[#37352f] hover:bg-[#0b6e99] text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all"
                    >
                      {loadingTable ? 'Memproses...' : 'Buka Slot Waktu ✓'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Daftar Slot Saya */}
            <div className="lg:col-span-2">
              <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#37352f]">Jadwal Aktif Saya</h2>
                  {filterTanggal && (
                    <button 
                      onClick={() => setFilterTanggal('')} 
                      className="px-4 py-2 bg-[#efefed] hover:bg-red-50 text-[#37352f]/60 hover:text-red-600 border border-[#e9e9e7] rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Lihat Semua ✕
                    </button>
                  )}
                </div>

                {/* INPUT FILTER TANGGAL */}
                <div className="relative w-64 group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors pointer-events-none" />
                  
                  {/* Placeholder overlay */}
                  {!filterTanggal && (
                    <span className="absolute left-11 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#37352f]/40 pointer-events-none font-sans">
                      Pilih tanggal filter...
                    </span>
                  )}
                  
                  <input 
                    type="date" 
                    className={`w-full bg-white border border-[#e9e9e7] rounded-xl pl-11 pr-4 py-3 text-xs font-semibold outline-none transition-all focus:border-[#0b6e99]/30 cursor-pointer min-h-[46px] ${filterTanggal ? 'text-[#37352f]' : 'text-transparent'}`}
                    value={filterTanggal}
                    onChange={(e) => setFilterTanggal(e.target.value)}
                  />
                </div>
              </div>

              <div className={`bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden transition-opacity duration-300 ${loadingTable ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {listSlotSaya.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fbfbfa]">
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Tanggal</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Jam Latihan</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Siswa</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Status</th>
                          <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e9e9e7]">
                        {listSlotSaya.map((slot) => (
                          <tr key={slot.id} className="hover:bg-[#fbfbfa] transition-colors">
                            <td className="p-6 font-semibold text-[#37352f]">
                              {new Date(slot.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </td>
                            <td className="p-6">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${slot.status === 'Terpakai' || slot.status === 'Booked' ? 'text-[#0b6e99] bg-[#efefed] border-[#e9e9e7]' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                                {slot.jam} WIB
                              </span>
                            </td>
                            <td className="p-6">
                              {slot.status === 'Terpakai' || slot.status === 'Booked' ? (
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-[#37352f]">
                                    {slot.nama_siswa || 'Menunggu Sinkronisasi...'}
                                  </span>
                                  {!slot.nama_siswa && (
                                    <button 
                                      onClick={() => handleResetSlot(slot.id)}
                                      className="text-[9px] font-bold uppercase tracking-widest text-[#0b6e99] hover:underline text-left"
                                    >
                                      Reset Jadi Tersedia?
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[#37352f]/40 font-medium">-</span>
                              )}
                            </td>
                            <td className="p-6">
                              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${slot.status === 'Tersedia' ? 'bg-[#efefed] text-[#37352f]/60' : 'bg-[#0b6e99]/10 text-[#0b6e99]'}`}>
                                {slot.status}
                              </span>
                            </td>
                            <td className="p-6 text-center">
                              <button 
                                onClick={() => handleHapusSlot(slot.id)}
                                disabled={slot.status === 'Terpakai' || slot.status === 'Booked'} 
                                className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center mx-auto text-xs font-bold ${slot.status === 'Terpakai' || slot.status === 'Booked' ? 'bg-[#efefed] text-[#37352f]/20 cursor-not-allowed' : 'bg-[#fbfbfa] hover:bg-red-50 text-[#37352f]/30 hover:text-red-600 border border-[#e9e9e7]'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-24 text-center">
                    <div className="w-24 h-24 bg-[#efefed] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#37352f]/30">
                      {filterTanggal ? <Clock className="w-12 h-12" /> : <Plus className="w-12 h-12" />}
                    </div>
                    <h4 className="text-xl font-bold text-[#37352f] mb-2">
                      {filterTanggal ? 'Tidak ada slot pada tanggal ini' : 'Belum ada slot waktu'}
                    </h4>
                    <p className="text-[#37352f]/50 font-medium">
                      {filterTanggal ? 'Silakan pilih tanggal lain atau klik "Lihat Semua"' : 'Gunakan form di samping untuk membuka jam mengajar Anda.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
