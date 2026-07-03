import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import OwnerSidebar from './OwnerSidebar';
import Footer from '../siswa/Footer';
import logoTribakti from '../../assets/logo_tribaktii.png';
import {
  Star,
  Award,
  Search,
  Filter,
  ChevronRight,
  Printer,
  ArrowLeft,
  Calendar,
  User,
  TrendingUp,
  MessageSquare,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function OwnerLaporanKinerjaInstruktur() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState(null);
  
  // Search & Filter states for left panel
  const [searchInstructor, setSearchInstructor] = useState('');
  
  // Search, Filter & Sort states for right details panel
  const [searchReview, setSearchReview] = useState('');
  const [ratingFilter, setRatingFilter] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('Terbaru');

  // Error boundary state
  const [renderError, setRenderError] = useState(null);

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchKinerjaData();
  }, []);

  const fetchKinerjaData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all instructors
      const { data: instData, error: instError } = await supabase
        .from('akun_pengguna')
        .select('id, nama_lengkap, username, created_at')
        .eq('role', 'instruktur');
      if (instError) throw instError;

      // 2. Fetch all ratings with 'Instruktur:' prefix
      const { data: ratingData, error: ratingError } = await supabase
        .from('ratings')
        .select('*')
        .like('paket_siswa', 'Instruktur:%')
        .order('created_at', { ascending: false });
      if (ratingError) throw ratingError;

      // 3. Fetch all completed sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('jadwal_latihan')
        .select(`
          id,
          instruktur_id,
          status,
          instruktur:akun_pengguna!jadwal_latihan_instruktur_id_fkey(nama_lengkap)
        `)
        .eq('status', 'Selesai');
      
      // Fallback query if fkey join fails
      let finalSessionData = [];
      if (sessionError) {
        const { data: retrySessionData, error: retryError } = await supabase
          .from('jadwal_latihan')
          .select('id, instruktur_id, status')
          .eq('status', 'Selesai');
        if (retryError) throw retryError;
        finalSessionData = retrySessionData || [];
      } else {
        finalSessionData = sessionData || [];
      }

      const safeInstData = instData || [];
      setInstructors(safeInstData);
      setRatings(ratingData || []);
      setSessions(finalSessionData);

      // Default select the first instructor if available
      if (safeInstData.length > 0) {
        setSelectedInstructorId(safeInstData[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat data kinerja:", err);
      setRenderError("Error during data fetching: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse ratings details safely
  const parseRating = (r) => {
    if (!r || !r.paket_siswa) {
      return { instName: '', sesi: 'Umum', jadwalId: '' };
    }
    try {
      const parts = String(r.paket_siswa).split('|');
      const instName = parts[0]?.replace('Instruktur:', '').trim() || '';
      const sesi = parts[1]?.replace('Sesi:', '').trim() || 'Umum';
      const jadwalId = parts[2]?.replace('JadwalID:', '').trim() || '';
      return { instName, sesi, jadwalId };
    } catch (e) {
      return { instName: '', sesi: 'Umum', jadwalId: '' };
    }
  };

  // Safe wrapper for calculations to catch render-time exceptions
  let processedInstructors = [];
  let filteredInstructorsList = [];
  let selectedInst = null;
  let filteredReviews = [];
  let totalReviewsGlobal = 0;
  let avgRatingGlobal = '0.0';
  let topInstructorName = '-';
  let topInstructorRating = '0.0';
  let totalCompletedSessionsGlobal = 0;

  try {
    const safeInstructors = instructors || [];
    const safeRatings = ratings || [];
    const safeSessions = sessions || [];

    processedInstructors = safeInstructors.map(inst => {
      if (!inst) return null;
      const targetInstName = inst.nama_lengkap || inst.username || '';

      // Find reviews for this instructor
      const instReviews = safeRatings.filter(r => {
        if (!r) return false;
        const { instName } = parseRating(r);
        return instName && targetInstName && instName.toLowerCase() === targetInstName.toLowerCase();
      }).map(r => {
        const { sesi, jadwalId } = parseRating(r);
        return {
          ...r,
          sesi_info: sesi || 'Umum',
          jadwal_id: jadwalId || ''
        };
      });

      // Compute average rating
      const totalReviews = instReviews.length;
      const avgRating = totalReviews > 0
        ? (instReviews.reduce((acc, curr) => acc + (Number(curr.skor) || 0), 0) / totalReviews).toFixed(1)
        : '0.0';

      // Count completed sessions
      const completedSessions = safeSessions.filter(s => {
        if (!s) return false;
        if (s.instruktur_id && inst.id && String(s.instruktur_id) === String(inst.id)) {
          return true;
        }
        const sName = s.instruktur?.nama_lengkap || '';
        return sName && targetInstName && sName.toLowerCase() === targetInstName.toLowerCase();
      }).length;

      // Calculate rating distribution (5, 4, 3, 2, 1 stars)
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      instReviews.forEach(rev => {
        if (!rev) return;
        const score = Math.round(Number(rev.skor)) || 5;
        if (distribution[score] !== undefined) {
          distribution[score] += 1;
        }
      });

      return {
        ...inst,
        reviews: instReviews,
        avgRating: Number(avgRating),
        totalReviews,
        completedSessions,
        distribution
      };
    }).filter(Boolean).sort((a, b) => b.avgRating - a.avgRating);

    // Filtered instructors list for left panel search
    filteredInstructorsList = processedInstructors.filter(inst => {
      const name = inst.nama_lengkap || inst.username || '';
      return name.toLowerCase().includes(searchInstructor.toLowerCase());
    });

    // Get currently selected instructor's details
    selectedInst = processedInstructors.find(inst => inst.id === selectedInstructorId);

    // Filter & Sort reviews for the selected instructor
    if (selectedInst) {
      let list = [...(selectedInst.reviews || [])];

      // Search filter
      if (searchReview.trim()) {
        const query = searchReview.toLowerCase();
        list = list.filter(r =>
          (r.nama_siswa && r.nama_siswa.toLowerCase().includes(query)) ||
          (r.ulasan && r.ulasan.toLowerCase().includes(query)) ||
          (r.sesi_info && r.sesi_info.toLowerCase().includes(query))
        );
      }

      // Rating value filter
      if (ratingFilter !== 'Semua') {
        const filterStars = Number(ratingFilter);
        list = list.filter(r => Math.round(Number(r.skor)) === filterStars);
      }

      // Sort order
      if (sortOrder === 'Terbaru') {
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      } else if (sortOrder === 'Rating Tertinggi') {
        list.sort((a, b) => (b.skor || 0) - (a.skor || 0));
      } else if (sortOrder === 'Rating Terendah') {
        list.sort((a, b) => (a.skor || 0) - (b.skor || 0));
      }

      filteredReviews = list;
    }

    // Aggregate Stats Global
    totalReviewsGlobal = safeRatings.length;
    
    avgRatingGlobal = totalReviewsGlobal > 0
      ? (safeRatings.reduce((acc, curr) => acc + (Number(curr.skor) || 0), 0) / totalReviewsGlobal).toFixed(1)
      : '0.0';

    const topInstructorObj = [...processedInstructors]
      .filter(i => i.totalReviews > 0)
      .sort((a, b) => b.avgRating - a.avgRating)[0];
    topInstructorName = topInstructorObj ? (topInstructorObj.nama_lengkap || topInstructorObj.username || '-') : '-';
    topInstructorRating = topInstructorObj ? topInstructorObj.avgRating.toFixed(1) : '0.0';

    totalCompletedSessionsGlobal = safeSessions.length;
  } catch (err) {
    console.error("Render crash caught:", err);
    if (!renderError) {
      setRenderError("Error during data processing/render: " + (err.stack || err.message || String(err)));
    }
  }

  const handlePrint = () => {
    window.print();
  };

  // If there's a rendering crash, display the diagnostic view
  if (renderError) {
    return (
      <div className="p-8 bg-red-50 text-red-700 min-h-screen font-mono flex items-center justify-center">
        <div className="bg-white border border-red-200 p-8 rounded-2xl shadow-xl max-w-2xl w-full">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
            <span>⚠️</span> Terjadi Kesalahan Aplikasi
          </h1>
          <p className="mb-4 text-sm text-[#37352f]/80 leading-relaxed">
            Halaman tidak dapat dimuat karena terjadi kegagalan pemrosesan data. Informasi kesalahan di bawah ini dapat membantu untuk mendiagnosis masalah:
          </p>
          <pre className="bg-red-50/50 p-4 rounded-xl overflow-auto text-xs text-red-800 border border-red-100 max-h-60 leading-relaxed mb-6">
            {renderError}
          </pre>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all"
            >
              Muat Ulang
            </button>
            <button 
              onClick={() => navigate('/owner')} 
              className="px-6 py-2.5 bg-[#efefed] hover:bg-[#e4e4e2] text-[#37352f] font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all"
            >
              Kembali Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      {/* Sidebar hidden when printing */}
      <div className="print:hidden">
        <OwnerSidebar activeMenu="laporan-kinerja" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:hidden">
        {/* Header */}
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Laporan Kinerja & Rating Instruktur</span>
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
          {/* Back Button and Title Section */}
          <div className="mb-8 md:mb-10">
            <div className="mb-4">
              <button 
                onClick={() => navigate('/owner')}
                className="flex items-center gap-2 text-xs font-bold text-[#37352f]/60 hover:text-[#0b6e99] transition-colors bg-[#efefed] hover:bg-[#e4e4e2] px-3.5 py-2 rounded-xl border border-[#e9e9e7] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#efefed] text-[#37352f]/60 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-3">
                  <Award className="w-3 h-3 text-[#0b6e99]" />
                  Instructor Performance
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight">
                  Kinerja & Rating <span className="text-[#37352f]/40">Instruktur.</span>
                </h2>
                <p className="text-[#37352f]/60 text-sm mt-1.5 font-medium">Pantau kualitas pengajaran dan tingkat kepuasan siswa secara mendalam.</p>
              </div>

              <div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 bg-[#0b6e99] hover:bg-[#095a80] text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#0b6e99]/20 w-full sm:w-auto justify-center cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Laporan
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              { label: 'Rating Rata-rata Global', value: loading ? '...' : `${avgRatingGlobal} / 5.0`, icon: Star, color: 'text-amber-500 fill-amber-500', bg: 'bg-amber-50' },
              { label: 'Total Review Siswa', value: loading ? '...' : `${totalReviewsGlobal} Ulasan`, icon: MessageSquare, color: 'text-[#0b6e99]', bg: 'bg-[#0b6e99]/10' },
              { label: 'Top Instruktur', value: loading ? '...' : `${topInstructorName} (${topInstructorRating} ★)`, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Sesi Latihan Selesai', value: loading ? '...' : `${totalCompletedSessionsGlobal} Sesi`, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#e9e9e7] shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5">{item.label}</h3>
                <p className="text-xl sm:text-2xl font-bold text-[#37352f] truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Main Layout (Master-Detail) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Panel: Instructors List (Master) */}
            <div className="bg-white rounded-2xl border border-[#e9e9e7] p-5 shadow-sm lg:col-span-1 flex flex-col h-[750px]">
              <div className="mb-4">
                <h3 className="text-base font-bold text-[#37352f] mb-1">Daftar Instruktur</h3>
                <p className="text-xs text-[#37352f]/50">Pilih salah satu instruktur untuk melihat detail ulasan.</p>
              </div>

              {/* Instructor Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/30" />
                <input
                  type="text"
                  placeholder="Cari instruktur..."
                  value={searchInstructor}
                  onChange={(e) => setSearchInstructor(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e9e9e7] bg-[#fbfbfa] focus:bg-white outline-none focus:border-[#0b6e99] font-medium transition-all"
                />
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loading ? (
                  <div className="py-20 text-center text-xs opacity-50">Memuat daftar instruktur...</div>
                ) : filteredInstructorsList.length > 0 ? (
                  filteredInstructorsList.map((inst) => {
                    const isSelected = inst.id === selectedInstructorId;
                    const nameToShow = inst.nama_lengkap || inst.username || 'Tanpa Nama';
                    return (
                      <div
                        key={inst.id}
                        onClick={() => setSelectedInstructorId(inst.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                          isSelected
                            ? 'bg-[#0b6e99]/5 border-[#0b6e99] shadow-sm shadow-[#0b6e99]/5'
                            : 'bg-[#fbfbfa] border-[#e9e9e7] hover:border-[#0b6e99]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-[#0b6e99] text-white' : 'bg-[#efefed] text-[#37352f]/60'
                          }`}>
                            {nameToShow.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#37352f] truncate leading-snug">{nameToShow}</p>
                            <p className="text-[9px] text-[#37352f]/40 font-bold uppercase tracking-wider mt-0.5">Instruktur</p>
                          </div>
                        </div>

                        {/* Progress Bar & Ratings Stats */}
                        <div className="space-y-1.5 pt-1.5 border-t border-[#efefed]/80">
                          <div className="flex justify-between items-center text-[10px] font-bold text-[#37352f]/60">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              {inst.avgRating > 0 ? `${inst.avgRating.toFixed(1)} / 5.0` : 'Belum dinilai'}
                            </span>
                            <span className="opacity-75">{inst.totalReviews} Ulasan</span>
                          </div>
                          
                          {inst.totalReviews > 0 && (
                            <div className="w-full bg-[#efefed] h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full"
                                style={{ width: `${(inst.avgRating / 5) * 100}%` }}
                              ></div>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[9px] font-bold text-[#37352f]/40 uppercase tracking-wider pt-0.5">
                            <span>Sesi Selesai</span>
                            <span>{inst.completedSessions} Sesi</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 text-center text-xs opacity-50 italic">Instruktur tidak ditemukan.</div>
                )}
              </div>
            </div>

            {/* Right Panel: Performance & Reviews Detail (Detail) */}
            <div className="bg-white rounded-2xl border border-[#e9e9e7] p-6 shadow-sm lg:col-span-2 flex flex-col h-[750px]">
              {selectedInst ? (
                <>
                  {/* Instructor Detailed Header */}
                  <div className="pb-5 border-b border-[#efefed] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#efefed] rounded-xl flex items-center justify-center font-extrabold text-lg text-[#0b6e99] border border-[#e9e9e7]">
                        {(selectedInst.nama_lengkap || selectedInst.username || 'T').charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-bold leading-none">{selectedInst.nama_lengkap || selectedInst.username || 'Tanpa Nama'}</h3>
                        <p className="text-[10px] font-mono text-[#37352f]/40 uppercase tracking-widest mt-1.5">ID: {selectedInst.id ? String(selectedInst.id).substring(0, 8) : ''}...</p>
                        <p className="text-xs text-[#37352f]/50 mt-1 font-medium">Beban Kerja: <span className="font-bold text-[#37352f]">{selectedInst.completedSessions} sesi mengajar selesai</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-100/60 px-4 py-2.5 rounded-xl self-start sm:self-center">
                      <div className="text-amber-600 font-black text-2xl leading-none">{selectedInst.avgRating.toFixed(1)}</div>
                      <div>
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${Math.round(selectedInst.avgRating) >= star ? 'fill-current' : 'opacity-30'}`}
                            />
                          ))}
                        </div>
                        <div className="text-[9px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">{selectedInst.totalReviews} Siswa Review</div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Breakdown and Filters Scrollable Wrapper */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1 mt-4">
                    {/* Rating Breakdown Bars */}
                    {selectedInst.totalReviews > 0 ? (
                      <div className="bg-[#fbfbfa] p-5 rounded-xl border border-[#e9e9e7]/50">
                        <h4 className="text-xs font-bold text-[#37352f]/60 uppercase tracking-widest mb-3">Distribusi Penilaian Bintang</h4>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = selectedInst.distribution[stars] || 0;
                            const pct = selectedInst.totalReviews > 0 ? (count / selectedInst.totalReviews) * 100 : 0;
                            return (
                              <div key={stars} className="flex items-center gap-3 text-xs">
                                <span className="w-8 font-bold text-[#37352f]/50 flex items-center justify-end gap-1">{stars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /></span>
                                <div className="flex-1 bg-[#efefed] h-2 rounded-full overflow-hidden">
                                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="w-12 font-bold text-[#37352f]/60 text-right">{count} ulasan ({Math.round(pct)}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#fbfbfa] p-6 rounded-xl border border-[#e9e9e7]/50 text-center italic text-xs text-[#37352f]/40 leading-relaxed">
                        Belum ada ulasan bintang untuk instruktur ini.
                      </div>
                    )}

                    {/* Ulasan Header & Filters */}
                    <div className="space-y-4 pt-2 border-t border-[#efefed]">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h4 className="text-sm font-bold text-[#37352f]">Ulasan & Penilaian Siswa ({filteredReviews.length})</h4>
                        
                        {/* Rating value and sorting filters */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Filter Rating */}
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#e9e9e7]">
                            <Filter className="w-3 h-3 text-[#37352f]/40" />
                            <select
                              value={ratingFilter}
                              onChange={(e) => setRatingFilter(e.target.value)}
                              className="text-[10px] font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
                            >
                              <option value="Semua">Semua Rating</option>
                              <option value="5">5 Bintang</option>
                              <option value="4">4 Bintang</option>
                              <option value="3">3 Bintang</option>
                              <option value="2">2 Bintang</option>
                              <option value="1">1 Bintang</option>
                            </select>
                          </div>

                          {/* Sort reviews */}
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#e9e9e7]">
                            <Clock className="w-3 h-3 text-[#37352f]/40" />
                            <select
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value)}
                              className="text-[10px] font-bold text-[#37352f] outline-none bg-transparent cursor-pointer"
                            >
                              <option value="Terbaru">Terbaru</option>
                              <option value="Rating Tertinggi">Rating Tertinggi</option>
                              <option value="Rating Terendah">Rating Terendah</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Search review text */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#37352f]/30" />
                        <input
                          type="text"
                          placeholder="Cari di ulasan siswa..."
                          value={searchReview}
                          onChange={(e) => setSearchReview(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#e9e9e7] outline-none focus:border-[#0b6e99] font-medium"
                        />
                      </div>

                      {/* Reviews Feed List */}
                      <div className="space-y-3 pt-1">
                        {filteredReviews.length > 0 ? (
                          filteredReviews.map((rev, i) => (
                            <div key={rev.id || i} className="bg-[#fbfbfa] p-4.5 rounded-xl border border-[#e9e9e7]/60 flex flex-col justify-between hover:border-[#0b6e99]/20 transition-all">
                              <div>
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-[#efefed] rounded-full flex items-center justify-center font-bold text-[10px] text-[#37352f]">
                                      {(rev.nama_siswa || '?').charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-xs text-[#37352f] block leading-none">{rev.nama_siswa || 'Siswa'}</span>
                                      <span className="text-[9px] text-[#37352f]/40 font-bold block mt-1">
                                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex text-amber-400 shrink-0 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50">
                                    <span className="text-[10px] font-bold mr-1">{rev.skor}</span>
                                    <Star className="w-3 h-3 fill-current text-amber-400" />
                                  </div>
                                </div>
                                <blockquote className="text-[11px] text-[#37352f]/70 italic leading-relaxed pl-3 border-l-2 border-[#efefed] py-0.5 my-2">
                                  "{rev.ulasan || 'Tanpa ulasan tertulis.'}"
                                </blockquote>
                              </div>
                              <div className="mt-2 pt-2 border-t border-[#efefed] text-[9px] font-bold text-[#37352f]/40 uppercase tracking-wider">
                                {rev.sesi_info || 'Sesi Kursus'}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-xs opacity-50 italic">
                            Tidak ada ulasan ulasan siswa yang cocok dengan kriteria filter.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="m-auto text-center py-20 text-xs text-[#37352f]/40 italic">
                  Pilih instruktur di panel kiri untuk memuat laporan kinerja rinci.
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* PRINT-ONLY VIEW */}
      <div className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-[21cm] min-h-[29.7cm] border border-black/10 mx-auto text-xs">
        {/* Header Kop LPK */}
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
                Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Payakumbuh
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold uppercase tracking-wider text-black">Laporan Kinerja & Rating Instruktur</h2>
            <p className="text-[10px] font-mono text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>

        {/* Print Metadata */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold text-gray-500 uppercase text-[9px] tracking-wider">Dicetak Oleh</p>
            <p className="font-bold text-black mt-0.5">{savedUser?.nama_lengkap || 'Owner'} (Owner)</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-500 uppercase text-[9px] tracking-wider">Ringkasan Sistem</p>
            <p className="font-bold text-black mt-0.5">Total Instruktur: {processedInstructors.length} | Total Review: {totalReviewsGlobal} Ulasan</p>
          </div>
        </div>

        {/* Table of Instructor Performance */}
        <h3 className="text-sm font-bold mb-2 uppercase border-b pb-1 text-black">Tabel Rekapitulasi Kinerja</h3>
        <table className="w-full text-left border-collapse border border-gray-300 mb-8">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-[10px] font-bold">
              <th className="px-3 py-2 border-r border-gray-300 text-center w-10">No</th>
              <th className="px-3 py-2 border-r border-gray-300">Nama Instruktur</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Rating Rata-rata</th>
              <th className="px-3 py-2 border-r border-gray-300 text-center">Jumlah Ulasan Siswa</th>
              <th className="px-3 py-2 text-center">Total Jam Sesi Selesai</th>
            </tr>
          </thead>
          <tbody>
            {processedInstructors.map((inst, idx) => (
              <tr key={inst.id} className="border-b border-gray-300 text-xs">
                <td className="px-3 py-2 border-r border-gray-300 text-center">{idx + 1}</td>
                <td className="px-3 py-2 border-r border-gray-300 font-semibold">{inst.nama_lengkap || inst.username || 'Tanpa Nama'}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center font-bold text-amber-600">{inst.avgRating > 0 ? `${inst.avgRating.toFixed(1)} ★` : '-'}</td>
                <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">{inst.totalReviews} Ulasan</td>
                <td className="px-3 py-2 text-center font-mono">{inst.completedSessions} Sesi</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Detailed Reviews per Instructor */}
        <h3 className="text-sm font-bold mb-3 uppercase border-b pb-1 text-black">Detail Review Siswa per Instruktur</h3>
        <div className="space-y-6">
          {processedInstructors.map((inst, idx) => (
            <div key={inst.id} className="keep-together">
              <h4 className="font-bold text-xs text-[#0b6e99] mb-2">{idx + 1}. {inst.nama_lengkap || inst.username || 'Tanpa Nama'} ({inst.avgRating.toFixed(1)} ★ / {inst.totalReviews} Ulasan)</h4>
              
              {inst.reviews && inst.reviews.length > 0 ? (
                <table className="w-full text-left border-collapse border border-gray-200 text-[10px] mb-4">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500">
                      <th className="px-2 py-1 w-24">Nama Siswa</th>
                      <th className="px-2 py-1 w-12 text-center">Rating</th>
                      <th className="px-2 py-1">Ulasan / Umpan Balik</th>
                      <th className="px-2 py-1 w-20 text-center">Sesi</th>
                      <th className="px-2 py-1 w-16 text-right">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inst.reviews.map((rev, rIdx) => (
                      <tr key={rev.id || rIdx} className="border-b border-gray-150">
                        <td className="px-2 py-1.5 font-medium">{rev.nama_siswa || 'Siswa'}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-amber-600">{rev.skor} ★</td>
                        <td className="px-2 py-1.5 italic text-gray-700">"{rev.ulasan || 'Tanpa ulasan tertulis.'}"</td>
                        <td className="px-2 py-1.5 text-center text-gray-500">{rev.sesi_info?.split('|')[0] || rev.sesi_info}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-gray-500">{rev.created_at ? new Date(rev.created_at).toLocaleDateString('id-ID') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[10px] text-gray-400 italic mb-4">Belum ada review dari siswa untuk instruktur ini.</p>
              )}
            </div>
          ))}
        </div>

        {/* Signature Area */}
        <div className="mt-12 flex justify-end keep-together">
          <div className="text-center w-48">
            <p className="text-gray-500 mb-16 text-[10px]">Mengetahui,<br />Pimpinan LPK TriBakti</p>
            <div className="border-b border-black w-full"></div>
            <p className="font-bold text-black mt-1">Rifo Raihan</p>
            <p className="text-[9px] text-gray-500">Direktur Utama</p>
          </div>
        </div>
      </div>
    </div>
  );
}
