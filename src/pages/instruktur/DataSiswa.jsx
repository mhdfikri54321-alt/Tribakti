import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from '../siswa/Footer';
import { ChevronRight, Search, FileText } from 'lucide-react';

export default function DataSiswa() {
  const [pendaftar, setPendaftar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModalNilai, setShowModalNilai] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [jadwalSiswa, setJadwalSiswa] = useState([]);

  const savedUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchPendaftar();
  }, []);

  const fetchPendaftar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendaftaran')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPendaftar(data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBukaNilai = async (siswa) => {
    setSelectedSiswa(siswa);
    setShowModalNilai(true);
    try {
      const { data, error } = await supabase
        .from('jadwal_latihan')
        .select('*, kurikulum(materi)')
        .eq('akun_id', siswa.akun_id)
        .order('pertemuan_ke', { ascending: true });
      if (error) throw error;
      setJadwalSiswa(data || []);
    } catch (err) {
      console.error("Gagal memuat nilai:", err.message);
    }
  };

  const filteredPendaftar = pendaftar.filter((item) =>
    item.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.paket_pilihan?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="instruktur" activeMenu="data siswa" />

      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Data Siswa</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{savedUser?.nama_lengkap || 'Instruktur'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Instruktur</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {(savedUser?.nama_lengkap || 'I').charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          
          <div className="mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3 md:mb-4">
              <FileText className="w-3 h-3 text-[#0b6e99]" />
              Database Siswa Terdaftar
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Manajemen <span className="text-[#0b6e99]">Siswa Anda</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Kelola informasi pendaftaran, paket belajar, dan pantau perkembangan nilai setiap siswa dalam satu dashboard terintegrasi.
              </p>
              
              <div className="relative w-full md:w-64 group">
                <input 
                  type="text" 
                  placeholder="Cari nama siswa..." 
                  className="w-full bg-white border border-[#e9e9e7] rounded-xl pl-5 pr-10 py-3 text-xs font-semibold text-[#37352f] outline-none transition-all focus:border-[#0b6e99]/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors pointer-events-none w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e9e9e7] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-24 text-center">
                <div className="w-10 h-10 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4 mx-auto"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Memuat data siswa...</p>
              </div>
            ) : filteredPendaftar.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fbfbfa]">
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Nama Lengkap</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Paket Belajar</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Kontak WA</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Evaluasi Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9e9e7]">
                    {filteredPendaftar.map((item) => (
                      <tr key={item.id} className="hover:bg-[#fbfbfa] transition-colors group">
                        <td className="p-6">
                          <div className="font-semibold text-[#37352f] group-hover:text-[#0b6e99] transition-colors">
                            {item.nama_lengkap}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                            NIK: {item.nik || '-'}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1.5 bg-[#efefed] text-[#0b6e99] text-[10px] font-bold tracking-widest uppercase rounded-lg border border-[#e9e9e7]">
                            {item.paket_pilihan}
                          </span>
                        </td>
                        <td className="p-6">
                          <a 
                            href={`https://wa.me/${item.no_whatsapp}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm font-semibold text-[#37352f]/70 hover:text-[#0b6e99] hover:underline flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82c1.516.903 3.076 1.382 4.672 1.383 5.501 0 9.975-4.474 9.977-9.977.001-2.669-1.038-5.176-2.927-7.065-1.889-1.889-4.396-2.928-7.062-2.929-5.503 0-9.978 4.475-9.981 9.977-.001 1.77.464 3.491 1.343 5.013l-1.008 3.676 3.786-.993zm11.333-7.633c-.301-.15-1.781-.879-2.056-.979-.275-.1-.475-.15-.675.15-.199.299-.775.979-.95 1.178-.175.199-.35.225-.65.075-.301-.15-1.267-.467-2.414-1.49-.893-.795-1.495-1.777-1.671-2.076-.175-.3-.019-.463.13-.612.135-.133.301-.35.451-.524.15-.175.2-.299.3-.5.1-.199.05-.375-.025-.524-.075-.15-.675-1.626-.925-2.227-.244-.583-.493-.503-.675-.512-.175-.01-.375-.011-.575-.011s-.525.075-.8.375c-.275.3-1.05 1.026-1.05 2.503s1.075 2.903 1.225 3.103c.15.199 2.115 3.227 5.125 4.525.715.309 1.274.494 1.708.632.719.228 1.373.196 1.89.119.577-.086 1.781-.727 2.031-1.427.25-.699.25-1.299.175-1.427-.075-.125-.275-.199-.575-.349z"/>
                            </svg>
                            {item.no_whatsapp}
                          </a>
                        </td>
                        <td className="p-6 text-center">
                          <button 
                            onClick={() => handleBukaNilai(item)}
                            className="px-4 md:px-6 py-2.5 md:py-3 bg-[#37352f] hover:bg-[#0b6e99] text-white rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all"
                          >
                            Lihat Nilai
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-24 text-center">
                <div className="w-20 h-20 bg-[#efefed] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#37352f]/30">
                  <FileText className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[#37352f] mb-2">Tidak Ada Data</h3>
                <p className="text-[#37352f]/50 font-medium text-sm">Belum ada siswa yang sesuai dengan kriteria pencarian.</p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Modal Nilai */}
      {showModalNilai && selectedSiswa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#37352f]/20" onClick={() => setShowModalNilai(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl relative z-10 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8 border-b border-[#e9e9e7] bg-[#fbfbfa] sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#0b6e99] rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shrink-0">
                  {selectedSiswa.nama_lengkap.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-[#37352f] tracking-tight truncate">{selectedSiswa.nama_lengkap}</h3>
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] mt-1 truncate">{selectedSiswa.paket_pilihan}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-4 overflow-y-auto max-h-[350px]">
              {jadwalSiswa.length > 0 ? (
                jadwalSiswa.map((j) => (
                  <div key={j.id} className="flex justify-between items-center p-4 md:p-5 bg-[#fbfbfa] rounded-xl border border-[#e9e9e7] group hover:bg-white hover:border-[#0b6e99]/30 transition-all gap-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Pertemuan {j.pertemuan_ke}</span>
                      <span className="font-semibold text-[#37352f] text-xs md:text-sm truncate">{j.kurikulum?.materi || 'Materi Kursus'}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1">Nilai</span>
                      <span className={`text-base md:text-lg font-bold ${j.nilai ? 'text-[#0b6e99]' : 'text-[#37352f]/30'}`}>{j.nilai || '-'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-xs md:text-sm font-bold text-[#37352f]/40 uppercase tracking-widest">Belum ada sesi selesai</p>
                </div>
              )}
            </div>
            
            <div className="p-6 md:p-8 bg-[#fbfbfa] border-t border-[#e9e9e7] sticky bottom-0 z-10">
              <button 
                onClick={() => setShowModalNilai(false)} 
                className="w-full py-3.5 md:py-4 bg-[#37352f] text-white rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
              >
                Tutup Database Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
