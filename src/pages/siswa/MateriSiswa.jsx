import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar'; 
import Footer from './Footer'; 
import { BookOpen, Search, ChevronRight, AlertCircle } from 'lucide-react';

export default function MateriSiswa() {
  const navigate = useNavigate();
  const [listMateri, setListMateri] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // State untuk Modal Baca Materi
  const [showModal, setShowModal] = useState(false);
  const [detailMateri, setDetailMateri] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      
      if (loggedInUser) {
        const { data: dataSiswa, error: errSiswa } = await supabase
          .from('pendaftaran')
          .select('nama_lengkap, paket_pilihan, status')
          .eq('akun_id', loggedInUser.id)
          .single();
          
        if (!errSiswa && dataSiswa) {
          setStudentInfo(dataSiswa);
        } else {
          setStudentInfo({ nama_lengkap: loggedInUser.nama_lengkap || 'Siswa', paket_pilihan: '-', status: 'Menunggu' });
        }
      }

      const { data: dataMateri, error: errMateri } = await supabase
        .from('materi_pembelajaran')
        .select(`*, akun_pengguna (nama_lengkap)`)
        .order('created_at', { ascending: false });

      if (errMateri) throw errMateri;
      setListMateri(dataMateri || []);

    } catch (err) {
      console.error("Gagal memuat data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const materiDisaring = listMateri.filter((item) => {
    return item.judul?.toLowerCase().includes(search.toLowerCase()) || 
           item.deskripsi?.toLowerCase().includes(search.toLowerCase());
  });

  const bukaMateri = (materi) => {
    setDetailMateri(materi);
    setShowModal(true);
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="materi" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Modul</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Materi Belajar</span>
          </div>
          <button 
            onClick={() => navigate('/profil')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer border-0 bg-transparent text-[#37352f] text-left p-0"
          >
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{studentInfo?.nama_lengkap || 'Siswa'}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">Portal Siswa</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {studentInfo?.nama_lengkap?.charAt(0) || 'S'}
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <div className="mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Modul Pembelajaran 📚</h2>
            <p className="text-lg text-[#37352f]/70 leading-relaxed max-w-2xl">
              Tingkatkan wawasan berkendara Anda melalui materi teori yang disusun secara sistematis oleh tim ahli TriBakti.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#37352f]/20">
               <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
               <p className="text-xs font-bold uppercase tracking-widest">Menyiapkan modul...</p>
            </div>
          ) : !(studentInfo?.status === 'Aktif' || studentInfo?.status === 'Berhasil') ? (
            <div className="bg-white border border-amber-100 rounded-2xl p-10 text-center shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-[#37352f]">Akses Terkunci 🔒</h3>
              <p className="text-sm text-[#37352f]/60 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                Anda harus menyelesaikan pendaftaran dan pembayaran paket terlebih dahulu sebelum dapat mengakses materi belajar.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-[#37352f] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
              >
                Cek Status Pendaftaran
              </button>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <div className="relative max-w-md group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30 group-focus-within:text-[#0b6e99] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Cari materi..." 
                    className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#0b6e99] transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materiDisaring.length > 0 ? (
                  materiDisaring.map((materi) => (
                    <div key={materi.id} className="group bg-white border border-[#e9e9e7] rounded-xl overflow-hidden hover:border-[#0b6e99]/30 hover:shadow-lg hover:shadow-[#0b6e99]/5 transition-all duration-200 flex flex-col">
                      <div className="relative h-44 overflow-hidden bg-[#efefed]">
                        {materi.thumbnail_url ? (
                          <img src={materi.thumbnail_url} alt={materi.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#37352f]/10">
                            <BookOpen className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-white/90 backdrop-blur shadow-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-[#0b6e99]">
                            {materi.kategori || 'Teori'}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold text-[#37352f] mb-2 line-clamp-2 leading-tight group-hover:text-[#0b6e99] transition-colors">{materi.judul}</h3>
                        <p className="text-[#37352f]/60 text-xs leading-relaxed mb-6 line-clamp-3 font-medium flex-1">{materi.deskripsi}</p>
                        <button 
                          onClick={() => bukaMateri(materi)} 
                          className="w-full py-2.5 bg-[#efefed] text-[#37352f] hover:bg-[#37352f] hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Buka Modul
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center border border-dashed border-[#e9e9e7] rounded-2xl bg-white">
                    <BookOpen className="w-10 h-10 text-[#37352f]/10 mx-auto mb-4" />
                    <h3 className="text-sm font-bold text-[#37352f]/60">Modul tidak ditemukan</h3>
                    <p className="text-xs text-[#37352f]/40">Coba kata kunci lain atau telusuri modul yang tersedia.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
        <Footer />
      </div>

      {/* MODAL BACA MATERI */}
      {showModal && detailMateri && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#37352f]/20 backdrop-blur-[2px]" onClick={() => setShowModal(false)}></div>
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative z-10 flex flex-col border border-[#e9e9e7]">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b border-[#e9e9e7] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#0b6e99] mb-1 block">{detailMateri.kategori}</span>
                <h3 className="text-xl font-bold text-[#37352f] tracking-tight">{detailMateri.judul}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-[#efefed] rounded-lg flex items-center justify-center text-[#37352f]/40 hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-10">
              <div className="mb-8 flex items-center justify-between bg-[#fbfbfa] p-6 rounded-xl border border-[#e9e9e7]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-[#0b6e99] text-lg border border-[#e9e9e7]">
                    {detailMateri.akun_pengguna?.nama_lengkap?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Disusun oleh</p>
                    <p className="text-sm font-bold text-[#37352f]">
                      {detailMateri.akun_pengguna?.nama_lengkap || 'Tim Pengajar TriBakti'}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Terakhir Update</p>
                  <p className="text-xs font-bold text-[#37352f]/70">
                    {new Date(detailMateri.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {detailMateri.thumbnail_url && (
                <div className="mb-10 w-full h-80 overflow-hidden rounded-xl border border-[#e9e9e7]">
                  <img src={detailMateri.thumbnail_url} alt={detailMateri.judul} className="w-full h-full object-cover" />
                </div>
              )}

              {detailMateri.link_youtube && (
                <div className="mb-10 bg-red-50/50 p-6 rounded-xl border border-red-100 flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Tutorial Video</p>
                    <a href={detailMateri.link_youtube} target="_blank" rel="noopener noreferrer" className="text-red-700 font-bold text-sm hover:underline">Tonton panduan lengkap di YouTube ↗</a>
                  </div>
                </div>
              )}

              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-line text-[#37352f]/80 leading-relaxed font-medium text-lg">
                  {detailMateri.deskripsi}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-[#fbfbfa] border-t border-[#e9e9e7] text-center">
              <button 
                onClick={() => setShowModal(false)} 
                className="bg-[#37352f] text-white px-10 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] transition-all"
              >
                Selesai Membaca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}