import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminSidebar from './AdminSidebar';
import Footer from '../siswa/Footer';
import { 
  ChevronRight, 
  ArrowLeft, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Package, 
  CreditCard,
  X,
  Download
} from 'lucide-react';

export default function AdminDetailSiswa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [siswaInfo, setSiswaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (id) {
      fetchSiswaData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchSiswaData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendaftaran')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setSiswaInfo(data);
    } catch (err) {
      console.error("Error fetching pendaftaran details:", err.message);
      alert("Gagal memuat detail pendaftaran: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!siswaInfo) return;
    const confirmAction = window.confirm(`Setujui pendaftaran dan aktifkan paket untuk ${siswaInfo.nama_lengkap}?`);
    if (!confirmAction) return;
    setProcessing(true);

    try {
      // Hapus jadwal lama jika ada
      await supabase.from('jadwal_latihan').delete().eq('akun_id', siswaInfo.akun_id);

      // Ambil template kurikulum
      const { data: templateKurikulum, error: errKuri } = await supabase
        .from('kurikulum')
        .select('*')
        .order('pertemuan_ke', { ascending: true });
      if (errKuri) throw errKuri;

      let sesiDiizinkan = [];
      const namaPaket = (siswaInfo.paket_pilihan || '').toLowerCase();

      if (namaPaket.includes('plus')) sesiDiizinkan = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      else if (namaPaket.includes('basic')) sesiDiizinkan = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      else if (namaPaket.includes('terampil')) sesiDiizinkan = [1, 6, 7, 8, 9, 10];
      else if (namaPaket.includes('mahir')) sesiDiizinkan = [1, 6, 8, 10];
      else sesiDiizinkan = [1];

      const kurikulumDisaring = templateKurikulum.filter(k => sesiDiizinkan.includes(k.pertemuan_ke));
      const dataJadwal = kurikulumDisaring.map((k) => ({
        akun_id: siswaInfo.akun_id,
        kurikulum_id: k.id,
        pertemuan_ke: k.pertemuan_ke,
        status: 'Belum Dijadwalkan'
      }));

      // Masukkan jadwal baru
      const { error: errJadwal } = await supabase.from('jadwal_latihan').insert(dataJadwal);
      if (errJadwal) throw errJadwal;

      // Update status pendaftaran
      const { error: errPendaftaran } = await supabase
        .from('pendaftaran')
        .update({ status: 'Berhasil' })
        .eq('id', siswaInfo.id);
      if (errPendaftaran) throw errPendaftaran;
      
      alert(`Pendaftaran disetujui! ${kurikulumDisaring.length} sesi berhasil digenerate.`);
      navigate('/admin/siswa');
    } catch (err) {
      alert("Gagal memproses pendaftaran: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <AdminSidebar activeMenu="siswa" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#37352f]/60 cursor-pointer hover:text-[#0b6e99]" onClick={() => navigate('/admin/siswa')}>Manajemen Siswa</span>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Verifikasi Pendaftaran</span>
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
              onClick={() => navigate('/admin/siswa')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#37352f]/50 hover:text-[#37352f] transition-colors uppercase tracking-wider mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Siswa
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0b6e99]" />
                  Verifikasi Pendaftaran
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 leading-tight">
                  Detail Berkas: <span className="text-[#37352f]/40">{siswaInfo?.nama_lengkap || 'Siswa'}</span>
                </h2>
                <p className="text-[#37352f]/60 text-sm font-medium leading-relaxed">
                  Periksa kelengkapan berkas administrasi dan bukti pembayaran siswa sebelum menyetujui pendaftaran.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Memuat berkas pendaftaran...</p>
            </div>
          ) : siswaInfo ? (
            <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden shadow-sm p-6 md:p-8 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
                {/* Kolom Kiri: Data & Paket */}
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 md:mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0b6e99]" /> Data Administrasi
                    </h4>
                    <div className="grid grid-cols-2 gap-4 md:gap-6 bg-[#efefed]/50 p-4 md:p-6 rounded-2xl border border-[#e9e9e7]">
                      <div className="col-span-2">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase text-[#37352f]/40 mb-1">Nomor Induk Kependudukan (NIK)</p>
                        <p className="text-sm font-bold text-[#37352f]">{siswaInfo.nik || 'Data tidak tersedia'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[10px] font-bold uppercase text-[#37352f]/40 mb-1">Gender</p>
                        <p className="text-sm font-bold text-[#37352f]">{siswaInfo.jenis_kelamin}</p>
                      </div>
                      <div>
                        <p className="text-[9px] md:text-[10px] font-bold uppercase text-[#37352f]/40 mb-1">WhatsApp</p>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#0b6e99] shrink-0" />
                          <p className="text-sm font-bold text-[#37352f]">{siswaInfo.no_whatsapp}</p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] md:text-[10px] font-bold uppercase text-[#37352f]/40 mb-1">Alamat Domisili</p>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#37352f]/30 mt-0.5 shrink-0" />
                          <p className="text-sm font-bold text-[#37352f]">{siswaInfo.alamat_domisili}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 md:mb-4 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-[#0b6e99]" /> Paket Terpilih
                    </h4>
                    <div className="bg-[#0b6e99]/10 border border-[#0b6e99]/20 p-6 md:p-8 rounded-2xl relative overflow-hidden">
                      <Package className="absolute -right-4 -bottom-4 w-20 h-20 md:w-24 md:h-24 text-[#0b6e99]/10" />
                      <p className="text-2xl md:text-3xl font-bold text-[#0b6e99] tracking-tight">{siswaInfo.paket_pilihan}</p>
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-2">Status: {siswaInfo.status}</p>
                    </div>
                  </div>
                </div>
                
                {/* Kolom Kanan: Bukti Pembayaran */}
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 md:mb-4 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-[#0b6e99]" /> Bukti Pembayaran
                  </h4>
                  <div className="bg-[#efefed]/50 aspect-[4/3] flex items-center justify-center border-2 border-dashed border-[#e9e9e7] rounded-2xl overflow-hidden max-w-lg mx-auto">
                    {siswaInfo.bukti_transfer_url ? (
                      <img src={siswaInfo.bukti_transfer_url} className="w-full h-full object-contain" alt="Bukti Transfer" />
                    ) : (
                      <div className="text-center">
                        <CreditCard className="w-10 h-10 text-[#37352f]/20 mx-auto mb-2" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Belum ada lampiran</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-[#e9e9e7] flex justify-end gap-3 flex-wrap">
                {siswaInfo.status === 'Berhasil' && (
                  <button 
                    onClick={() => navigate(`/admin/siswa/kwitansi?id=${siswaInfo.id}`)}
                    className="flex items-center gap-2 bg-[#0b6e99] hover:bg-[#085a80] text-white py-3.5 px-6 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm text-center"
                  >
                    <Download className="w-4 h-4" /> Cetak Bukti Pembayaran
                  </button>
                )}
                {siswaInfo.status === 'Berhasil' ? (
                  <button 
                    disabled
                    className="bg-[#efefed] text-[#37352f]/40 border border-[#e9e9e7] py-3.5 px-8 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest"
                  >
                    Verifikasi Selesai ✓
                  </button>
                ) : (
                  <button 
                    onClick={handleApprove}
                    disabled={processing}
                    className="bg-[#37352f] hover:bg-[#0b6e99] text-white py-3.5 px-8 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm w-full md:w-auto text-center"
                  >
                    {processing ? 'Memproses...' : 'Setujui & Generate Jadwal'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-[#37352f]/40 font-medium italic">
              Data siswa tidak ditemukan.
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
