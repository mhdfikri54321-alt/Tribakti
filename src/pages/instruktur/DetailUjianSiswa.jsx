import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import Footer from '../siswa/Footer';
import { ChevronRight, Search, FileText } from 'lucide-react';

export default function DetailUjianSiswa() {
  const [listRiwayat, setListRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const savedUser = JSON.parse(localStorage.getItem('user'));
  const namaInstruktur = savedUser?.nama_lengkap || 'Instruktur';

  useEffect(() => {
    fetchRiwayatUjian();
  }, []);

  const fetchRiwayatUjian = async () => {
    setLoading(true);
    try {
      // Mengambil data riwayat ujian yang sudah di-join dengan akun_pengguna (siswa)
      const { data, error } = await supabase
        .from('riwayat_ujian_sim')
        .select(`
          *,
          akun_pengguna!akun_id (nama_lengkap)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListRiwayat(data || []);
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRiwayat = listRiwayat.filter((item) =>
    item.akun_pengguna?.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      
      <Sidebar role="instruktur" activeMenu="ujian" />

      <div className="flex-1 flex flex-col min-w-0">
        
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Detail Ujian</span>
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
              <FileText className="w-3 h-3 text-[#0b6e99]" />
              Monitoring Progress Siswa
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 leading-tight">
              Detail Hasil <span className="text-[#0b6e99]">Ujian Teori</span>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <p className="text-[#37352f]/70 text-sm md:text-lg max-w-2xl leading-relaxed font-medium">
                Pantau hasil simulasi ujian teori SIM seluruh siswa. Data ini membantu Anda menentukan kesiapan siswa sebelum ujian resmi.
              </p>
              
              <div className="relative w-full md:w-64 group">
                <input 
                  type="text" 
                  placeholder="Cari nama siswa..." 
                  className="w-full bg-white border border-[#e9e9e7] rounded-xl px-5 pr-10 py-3 text-xs font-semibold text-[#37352f] outline-none transition-all focus:border-[#0b6e99]/30"
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
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Menyusun data riwayat...</p>
              </div>
            ) : filteredRiwayat.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fbfbfa]">
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Nama Siswa</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Tanggal Ujian</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Skor Akhir</th>
                      <th className="p-6 text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 text-center">Status Kelulusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e9e9e7]">
                    {filteredRiwayat.map((riwayat) => (
                      <tr key={riwayat.id} className="hover:bg-[#fbfbfa] transition-colors group">
                        <td className="p-6">
                          <div className="font-semibold text-[#37352f] group-hover:text-[#0b6e99] transition-colors">
                            {riwayat.akun_pengguna?.nama_lengkap || 'User Unknown'}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">Siswa Terdaftar</div>
                        </td>
                        <td className="p-6">
                          <div className="text-sm font-semibold text-[#37352f]">
                            {new Date(riwayat.created_at).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mt-1">
                            {new Date(riwayat.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`text-xl font-bold ${riwayat.status === 'LULUS' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {riwayat.skor}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest border ${riwayat.status === 'LULUS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {riwayat.status}
                          </span>
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
                <p className="text-[#37352f]/50 font-medium text-sm">Belum ada riwayat ujian yang sesuai dengan pencarian Anda.</p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
