import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OwnerSidebar from './OwnerSidebar';
import Footer from '../siswa/Footer';
import { 
  ChevronRight, 
  ArrowLeft, 
  User, 
  Package, 
  CreditCard,
  Phone
} from 'lucide-react';

export default function OwnerDetailSiswa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [siswaInfo, setSiswaInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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
      alert("Gagal memuat detail berkas pendaftaran: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <OwnerSidebar activeMenu="siswa" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span 
              className="text-sm font-medium text-[#37352f]/60 cursor-pointer hover:text-[#0b6e99]" 
              onClick={() => navigate('/owner/siswa')}
            >
              Manajemen Siswa
            </span>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Detail Berkas & Pembayaran</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Owner'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Owner</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'O').charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          {/* Header & Back Action */}
          <div className="mb-8 md:mb-12">
            <button 
              onClick={() => navigate('/owner/siswa')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#37352f]/50 hover:text-[#37352f] transition-colors uppercase tracking-wider mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar Siswa
            </button>

            <div>
              <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3">
                Verifikasi Berkas Akademik
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 leading-tight">
                Detail Berkas & Pembayaran
              </h2>
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
                <div className="space-y-8">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#0b6e99]" /> Data Administrasi Siswa
                    </h4>
                    <div className="bg-[#efefed]/50 p-6 rounded-2xl border border-[#e9e9e7] space-y-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase text-[#37352f]/40 mb-1">Nama Lengkap</p>
                        <p className="text-sm font-bold text-[#37352f]">{siswaInfo.nama_lengkap}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-[#37352f]/40 mb-1">Nomor Induk Kependudukan (NIK)</p>
                        <p className="text-sm font-bold text-[#37352f]">{siswaInfo.nik || '-'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-bold uppercase text-[#37352f]/40 mb-1">Gender</p>
                          <p className="text-sm font-semibold text-[#37352f]">{siswaInfo.jenis_kelamin}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase text-[#37352f]/40 mb-1">No. WhatsApp</p>
                          <p className="text-sm font-semibold text-[#37352f]">{siswaInfo.no_whatsapp}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-[#37352f]/40 mb-1">Tempat, Tanggal Lahir</p>
                        <p className="text-sm font-semibold text-[#37352f]">{siswaInfo.tempat_tanggal_lahir}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase text-[#37352f]/40 mb-1">Alamat Domisili</p>
                        <p className="text-sm font-semibold text-[#37352f]">{siswaInfo.alamat_domisili || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#0b6e99]" /> Detail Paket Pilihan
                    </h4>
                    <div className="bg-[#0b6e99]/5 border border-[#0b6e99]/10 p-5 rounded-2xl">
                      <p className="text-lg font-bold text-[#0b6e99]">{siswaInfo.paket_pilihan}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#0b6e99]/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#37352f]/40">Status Pendaftaran</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          siswaInfo.status === 'Berhasil' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {siswaInfo.status === 'Berhasil' ? 'Aktif' : siswaInfo.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Bukti Pembayaran */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#0b6e99]" /> Bukti Pembayaran (Transfer)
                  </h4>
                  <div className="bg-[#efefed]/50 aspect-[4/3] flex items-center justify-center border-2 border-dashed border-[#e9e9e7] rounded-2xl overflow-hidden min-h-[300px]">
                    {siswaInfo.bukti_transfer_url ? (
                      <a 
                        href={siswaInfo.bukti_transfer_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-full h-full block group relative cursor-zoom-in"
                      >
                        <img 
                          src={siswaInfo.bukti_transfer_url} 
                          className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]" 
                          alt="Bukti Transfer" 
                        />
                        <div className="absolute inset-0 bg-[#37352f]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 text-[#37352f] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border border-[#e9e9e7]">Perbesar Gambar ↗</span>
                        </div>
                      </a>
                    ) : (
                      <div className="text-center p-6">
                        <CreditCard className="w-10 h-10 text-[#37352f]/20 mx-auto mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 block">Belum ada lampiran bukti transfer</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-[#e9e9e7] flex justify-end gap-3 flex-wrap">
                {siswaInfo.status === 'Berhasil' && (
                  <button 
                    onClick={() => navigate(`/owner/siswa/kwitansi?id=${siswaInfo.id}`)}
                    className="flex items-center gap-2 bg-[#0b6e99] hover:bg-[#085a80] text-white py-3 px-6 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm text-center"
                  >
                    Lihat Bukti Pembayaran / Kwitansi
                  </button>
                )}
                <button 
                  onClick={() => navigate('/owner/siswa')}
                  className="bg-[#37352f] hover:bg-[#0b6e99] text-white py-3 px-8 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm text-center"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-[#37352f]/40 font-medium italic">
              Data pendaftaran tidak ditemukan.
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
