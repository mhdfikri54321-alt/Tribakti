import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Footer from './Footer'; 
import logoTribakti from '../../assets/logo_tribaktii.png';
import tempatTribakti from '../../assets/tempat-tribakti.jpeg';
import tempatTribakti2 from '../../assets/tempat-tribakti-2.jpeg';
import tempatTribakti3 from '../../assets/tempat-tribakti-3.jpeg';
import lpkkk from '../../assets/lpkkk.jpeg';
import Sertifikat from '../../assets/Sertifikat.jpeg';
import Swal from 'sweetalert2';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ExternalLink,
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Camera,
  ShieldCheck,
  Award,
  CheckCircle2,
  Users2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Car,
  Target,
  Plus,
  X,
  MessageCircle,
  HelpCircle,
  Image as ImageIcon,
  Newspaper,
  Menu
} from 'lucide-react';

export default function LandingPage() {
  // --- STATES ---
  const [selectedArtikel, setSelectedArtikel] = useState(null);
  const [paketKursus, setPaketKursus] = useState([]);
  const [loadingPaket, setLoadingPaket] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [loadingFaq, setLoadingFaq] = useState(true);
  const [artikelList, setArtikelList] = useState([]);
  const [loadingArtikel, setLoadingArtikel] = useState(true);
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [dokumentasiList, setDokumentasiList] = useState([]);
  const [loadingDokumentasi, setLoadingDokumentasi] = useState(true);
  const [faqAktif, setFaqAktif] = useState(null);
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  
  // State Slider Foto Hero
  const [currentFotoIndex, setCurrentFotoIndex] = useState(0);
  const fotoTempat = [logoTribakti, tempatTribakti, tempatTribakti2, tempatTribakti3];

  // State Modal Rating
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userRatingForm, setUserRatingForm] = useState({
    nama_siswa: '',
    paket_siswa: '',
    skor: 5,
    ulasan: ''
  });

  // --- HANDLERS ---
  const nextFoto = () => setCurrentFotoIndex((prev) => (prev + 1) % fotoTempat.length);
  const prevFoto = () => setCurrentFotoIndex((prev) => (prev - 1 + fotoTempat.length) % fotoTempat.length);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from('ratings').insert([userRatingForm]);
      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Terima kasih atas ulasan Anda.',
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#37352f',
        customClass: { popup: 'rounded-xl border border-[#e9e9e7]' }
      });
      setShowRatingModal(false);
      setUserRatingForm({ nama_siswa: '', paket_siswa: '', skor: 5, ulasan: '' });
      fetchData(); // Refresh ratings
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally {
      setSubmittingRating(false);
    }
  };

  const fetchData = async () => {
    try {
      const [resPaket, resFaq, resArtikel, resRatings, resDokumentasi] = await Promise.all([
        supabase.from('packages').select('*').order('id', { ascending: true }),
        supabase.from('faq').select('*').order('created_at', { ascending: true }),
        supabase.from('artikel').select('*').order('tanggal', { ascending: false }),
        supabase.from('ratings').select('*').not('paket_siswa', 'ilike', 'Instruktur:%').order('created_at', { ascending: false }),
        supabase.from('dokumentasi').select('*').order('created_at', { ascending: false })
      ]);

      setPaketKursus(resPaket.data || []);
      setFaqs(resFaq.data || []);
      setArtikelList(resArtikel.data || []);
      setRatings(resRatings.data || []);
      setDokumentasiList(resDokumentasi.data || []);
    } catch (error) {
      console.error("Gagal mengambil data:", error.message);
    } finally {
      setLoadingPaket(false);
      setLoadingFaq(false);
      setLoadingArtikel(false);
      setLoadingRatings(false);
      setLoadingDokumentasi(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-white min-h-screen text-[#37352F] font-sans selection:bg-[#ebeced] selection:text-[#37352f]">
      
      {/* NAVIGATION */}
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#e9e9e7] w-full">
        <div className="flex items-center gap-2">
          <img src={logoTribakti} alt="Logo" className="w-8 h-8 object-contain dark:brightness-0 dark:invert" />
          <h1 className="text-lg font-black tracking-widest">
            <span className="text-black">Tri</span>
            <span className="text-[#0b6e99]">Bakti</span>
          </h1>
        </div>
        
        <div className="hidden lg:flex gap-4 items-center">
          <a href="#tentang" className="text-sm font-medium hover:bg-[#efefed] px-3 py-1.5 rounded-md transition-colors">Profil</a>
          <a href="#keunggulan" className="text-sm font-medium hover:bg-[#efefed] px-3 py-1.5 rounded-md transition-colors">Solusi</a>
          <a href="#paket" className="text-sm font-medium hover:bg-[#efefed] px-3 py-1.5 rounded-md transition-colors">Biaya</a>
          <a href="#faq" className="text-sm font-medium hover:bg-[#efefed] px-3 py-1.5 rounded-md transition-colors">FAQ</a>
          <a href="#artikel" className="text-sm font-medium hover:bg-[#efefed] px-3 py-1.5 rounded-md transition-colors">Edukasi</a>
          <a href="#dokumentasi" className="text-sm font-medium hover:bg-[#efefed] px-3 py-1.5 rounded-md transition-colors">Galeri</a>
          <div className="h-4 w-[1px] bg-[#e9e9e7] mx-2"></div>
          <Link to="/login" className="text-sm font-medium hover:bg-[#efefed] px-3 py-1.5 rounded-md transition-colors">Masuk</Link>
          <Link to="/register" className="bg-[#0b6e99] text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-[#095677] transition-all shadow-sm">Daftar Sekarang</Link>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button onClick={() => setMenuTerbuka(!menuTerbuka)} className="lg:hidden p-2 hover:bg-[#efefed] rounded-lg transition-colors flex items-center justify-center" aria-label="Toggle Menu">
          {menuTerbuka ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* MOBILE MENU DROPDOWN */}
        {menuTerbuka && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-[#e9e9e7] px-4 py-6 flex flex-col gap-3.5 shadow-xl z-40 animate-in slide-in-from-top-5 duration-200">
            <a href="#tentang" onClick={() => setMenuTerbuka(false)} className="text-sm font-bold hover:bg-[#efefed] px-3 py-2.5 rounded-xl transition-colors">Profil</a>
            <a href="#keunggulan" onClick={() => setMenuTerbuka(false)} className="text-sm font-bold hover:bg-[#efefed] px-3 py-2.5 rounded-xl transition-colors">Solusi</a>
            <a href="#paket" onClick={() => setMenuTerbuka(false)} className="text-sm font-bold hover:bg-[#efefed] px-3 py-2.5 rounded-xl transition-colors">Biaya</a>
            <a href="#faq" onClick={() => setMenuTerbuka(false)} className="text-sm font-bold hover:bg-[#efefed] px-3 py-2.5 rounded-xl transition-colors">FAQ</a>
            <a href="#artikel" onClick={() => setMenuTerbuka(false)} className="text-sm font-bold hover:bg-[#efefed] px-3 py-2.5 rounded-xl transition-colors">Edukasi</a>
            <a href="#dokumentasi" onClick={() => setMenuTerbuka(false)} className="text-sm font-bold hover:bg-[#efefed] px-3 py-2.5 rounded-xl transition-colors">Galeri</a>
            <div className="h-[1px] bg-[#e9e9e7] my-1"></div>
            <Link to="/login" onClick={() => setMenuTerbuka(false)} className="text-sm font-bold hover:bg-[#efefed] px-3 py-2.5 rounded-xl transition-colors">Masuk</Link>
            <Link to="/register" onClick={() => setMenuTerbuka(false)} className="bg-[#0b6e99] text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-[#095677] transition-all text-center shadow-sm">Daftar Sekarang</Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="pt-12 md:pt-24 pb-16 md:pb-32 px-4 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center text-left">
        <div className="space-y-6 md:space-y-10">
          <div className="inline-flex items-center gap-2 bg-[#f1f1ef] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#e9e9e7]">
             <Sparkles className="w-3 h-3 text-[#0b6e99]" /> Terakreditasi & Berlisensi Resmi
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
            Belajar mengemudi <br />
            <span className="text-[#0b6e99] font-black tracking-widest uppercase text-2xl sm:text-4xl md:text-6xl">TriBakti Payakumbuh.</span>
          </h2>
          <p className="text-base sm:text-xl md:text-2xl font-medium leading-relaxed opacity-80 max-w-xl">
            Satu sistem untuk pendaftaran, penjadwalan latihan mandiri, hingga sertifikasi digital berstandar nasional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2 md:pt-4">
            <Link to="/register" className="bg-[#0b6e99] text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-[#095677] transition-all flex items-center justify-center gap-2 shadow-sm">
              Mulai Belajar <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#tentang" className="text-lg font-medium hover:bg-[#efefed] px-8 py-3 rounded-lg transition-colors border border-[#e9e9e7] text-center">
              Lihat Profil
            </a>
          </div>
        </div>

        {/* HERO LOGO DISPLAY */}
        <div className="relative group">
          <div className="relative rounded-2xl overflow-hidden border border-[#e9e9e7] shadow-2xl aspect-[4/3] bg-[#fbfbfa] flex items-center justify-center p-12 exclude-dark-white">
            <img src={logoTribakti} alt="Logo TriBakti" className="w-full h-full object-contain dark:brightness-0 dark:invert" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* LOGO STRIP */}
      <section className="py-8 md:py-12 border-y border-[#e9e9e7] bg-[#fbfbfa]">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center items-center gap-8 md:gap-24 opacity-40 grayscale font-bold text-sm md:text-lg">
          <span>AKREDITASI A</span>
          <span>BNSP CERTIFIED</span>
          <span>DISNAKER PAYAKUMBUH</span>
          <span>LPK RESMI</span>
        </div>
      </section>

      {/* KEUNGGULAN (SOLUSI) */}
      <section id="keunggulan" className="py-16 md:py-32 max-w-7xl mx-auto px-4">
        <div className="text-left mb-10 md:mb-20 space-y-4">
          <h3 className="text-2xl md:text-4xl font-bold tracking-tight">Solusi belajar mengemudi modern.</h3>
          <p className="text-sm md:text-xl opacity-70 max-w-2xl leading-relaxed">Semua fitur dirancang untuk memberikan kepastian dan kenyamanan dalam perjalanan Anda menjadi pengemudi mahir.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Clock className="w-6 h-6" />, title: "Jadwal Mandiri", desc: "Booking jam latihan langsung dari HP Anda tanpa antri." },
            { icon: <Target className="w-6 h-6" />, title: "Hasil Terukur", desc: "Dapatkan skor dan evaluasi mendalam dari instruktur setiap sesi." },
            { icon: <ShieldCheck className="w-6 h-6" />, title: "Legalitas Terjamin", desc: "LPK dengan izin resmi Disnaker dan sertifikat Akreditasi." },
            { icon: <Car className="w-6 h-6" />, title: "Instruktur Ahli", desc: "Pelatihan oleh instruktur profesional bersertifikat BNSP." }
          ].map((item, i) => (
            <div key={i} className="p-6 md:p-8 rounded-2xl border border-[#e9e9e7] bg-white hover:bg-[#fbfbfa] transition-all group">
              <div className="w-12 h-12 bg-[#f1f1ef] rounded-xl flex items-center justify-center mb-6 text-[#37352f] group-hover:scale-110 transition-transform">{item.icon}</div>
              <h4 className="text-base md:text-lg font-bold mb-2 md:mb-3">{item.title}</h4>
              <p className="text-xs md:text-sm opacity-70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IDENTITAS (TENTANG KAMI) */}
      <section id="tentang" className="py-16 md:py-32 bg-[#fbfbfa] border-y border-[#e9e9e7]">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div className="space-y-6 md:space-y-8">
            <h3 className="text-2xl md:text-4xl font-bold tracking-tight">Identitas Lembaga.</h3>
            <div className="space-y-6 text-sm md:text-lg opacity-80 leading-relaxed font-medium">
               <p>LPK Tri Bakti merupakan lembaga pendidikan mengemudi terpercaya di Kota Payakumbuh yang berdedikasi menciptakan pengemudi cerdas dan beretika.</p>
               <div className="p-6 bg-white rounded-xl border border-[#e9e9e7] space-y-4">
                  <div className="flex gap-3 items-start">
                     <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                     <p className="text-xs md:text-sm">Izin LPK No: 13.76.04.2022 (Disnaker Perindustrian)</p>
                  </div>
                  <div className="flex gap-3 items-start">
                     <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                     <p className="text-xs md:text-sm">Sertifikat Akreditasi No: 746/LA-LPK/XII/2022</p>
                  </div>
               </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <img src={lpkkk} className="rounded-2xl border border-[#e9e9e7] aspect-square object-cover" alt="Foto 1" />
             <img src={Sertifikat} className="rounded-2xl border border-[#e9e9e7] aspect-square object-cover mt-4 md:mt-8" alt="Foto 2" />
          </div>
        </div>
      </section>

      {/* BIAYA (PRICING) */}
      <section id="paket" className="py-16 md:py-32 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 md:mb-24 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Biaya Transparan.</h2>
          <p className="text-sm md:text-xl opacity-70">Tanpa biaya tersembunyi. Semua fasilitas sudah termasuk dalam paket.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loadingPaket ? [1,2,3].map(i => <div key={i} className="h-96 bg-[#f1f1ef] animate-pulse rounded-2xl"></div>) : 
            paketKursus.map((p, i) => (
              <div key={i} className="flex flex-col border border-[#e9e9e7] rounded-2xl p-10 hover:border-[#0b6e99]/30 transition-all bg-white shadow-sm hover:shadow-lg">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{p.name || p.nama}</h3>
                  <p className="text-xs font-bold opacity-40 uppercase tracking-widest">{p.session_count || p.sesi} Sesi Pelatihan</p>
                </div>
                <div className="mb-10">
                  <span className="text-4xl font-bold text-[#37352F]">Rp {(p.price || p.harga)?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex-1 space-y-4 mb-12 pt-8 border-t border-[#f1f1ef]">
                  {String(p.features || p.fitur || '').split(',').map((f, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm font-medium opacity-70">
                      <CheckCircle2 className="w-4 h-4 text-[#0b6e99] shrink-0" /> {f.trim()}
                    </div>
                  ))}
                </div>
                <Link to="/register" className="w-full bg-[#0b6e99] text-white py-3 rounded-lg font-bold text-center hover:bg-[#095677] transition-all">Mulai Sekarang</Link>
              </div>
            ))
          }
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-32 bg-[#fbfbfa] border-y border-[#e9e9e7]">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-16 space-y-4">
            <HelpCircle className="w-8 h-8 md:w-10 md:h-10 text-[#0b6e99] mx-auto" />
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Pertanyaan Umum.</h2>
          </div>
          
          <div className="space-y-3">
            {loadingFaq ? <div className="h-20 bg-white animate-pulse rounded-xl"></div> : 
              faqs.map((faq, index) => (
                <div key={index} className="bg-white border border-[#e9e9e7] rounded-xl overflow-hidden transition-all">
                  <button onClick={() => setFaqAktif(faqAktif === index ? null : index)} className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left hover:bg-[#fbfbfa] gap-4">
                    <span className="font-bold text-[#37352f] text-sm md:text-base">{faq.tanya}</span>
                    {faqAktif === index ? <X className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
                  </button>
                  <div className={`px-5 md:px-6 overflow-hidden transition-all duration-300 ${faqAktif === index ? 'max-h-96 pb-5 md:pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-xs md:text-sm opacity-70 leading-relaxed border-t border-[#f1f1ef] pt-4">{faq.jawab}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* ARTIKEL / EDUKASI */}
      <section id="artikel" className="py-16 md:py-32 max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-10 md:mb-16">
          <div className="space-y-3 md:space-y-4 text-left">
            <Newspaper className="w-8 h-8 md:w-10 md:h-10 text-[#0b6e99]" />
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Wawasan Berkendara.</h2>
            <p className="text-base md:text-xl opacity-70">Tips dan edukasi seputar keselamatan di jalan raya.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loadingArtikel ? [1,2,3].map(i => <div key={i} className="h-80 bg-[#f1f1ef] animate-pulse rounded-2xl"></div>) : 
            artikelList.map((art, i) => (
              <div key={i} className="group cursor-pointer space-y-6" onClick={() => setSelectedArtikel(art)}>
                <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-[#e9e9e7] bg-[#f1f1ef]">
                   <img src={art.gambar_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={art.judul} />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{new Date(art.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                  <h4 className="text-xl font-bold group-hover:text-[#0b6e99] transition-colors line-clamp-2">{art.judul}</h4>
                  <p className="text-sm opacity-70 line-clamp-2">{art.excerpt}</p>
                </div>
              </div>
            ))
          }
        </div>
      </section>

      {/* DOKUMENTASI (GALERI) */}
      <section id="dokumentasi" className="py-16 md:py-32 bg-[#fbfbfa] border-y border-[#e9e9e7]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-20 space-y-4">
            <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-[#0b6e99] mx-auto" />
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Galeri Kegiatan.</h2>
          </div>
          
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {loadingDokumentasi ? [1,2,3,4].map(i => <div key={i} className="h-64 bg-white animate-pulse rounded-2xl"></div>) : 
              dokumentasiList.map((img, i) => (
                <div key={i} className="break-inside-avoid relative rounded-xl overflow-hidden border border-[#e9e9e7] group">
                   <img src={img.gambar_url} className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-500" alt="Galeri" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <p className="text-white text-xs font-bold">{img.caption}</p>
                   </div>
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section id="testimoni" className="py-16 md:py-32 max-w-7xl mx-auto px-4">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 md:mb-24 w-full">
            <div className="space-y-3 md:space-y-4 text-left">
              <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-[#0b6e99]" />
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight italic">"Apa kata mereka?"</h2>
              <p className="text-base md:text-xl opacity-70">Kepuasan siswa adalah standar keberhasilan kami.</p>
            </div>
            <button onClick={() => setShowRatingModal(true)} className="bg-[#0b6e99] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#095677] transition-all flex items-center justify-center gap-2 w-full md:w-auto">
               Tulis Ulasan <Plus className="w-4 h-4" />
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingRatings ? [1,2,3].map(i => <div key={i} className="h-64 bg-[#f1f1ef] animate-pulse rounded-2xl"></div>) : 
              ratings.slice(0, 6).map((r, i) => (
                <div key={i} className="p-6 md:p-8 rounded-2xl border border-[#e9e9e7] bg-white space-y-6">
                   <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, s) => <Star key={s} className={`w-3 h-3 ${s < r.skor ? 'fill-current' : 'text-[#e9e9e7]'}`} />)}
                </div>
                   <p className="text-sm md:text-base opacity-80 leading-relaxed italic">"{r.ulasan}"</p>
                   <div className="flex items-center gap-3 pt-4 border-t border-[#f1f1ef]">
                      <div className="w-8 h-8 bg-[#f1f1ef] rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{r.nama_siswa?.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-bold">{r.nama_siswa}</p>
                        <p className="text-[10px] opacity-40 font-bold uppercase">{r.paket_siswa}</p>
                      </div>
                   </div>
                </div>
              ))
            }
         </div>
      </section>

      {/* LOKASI */}
      <section id="lokasi" className="py-16 md:py-32 bg-[#fbfbfa] border-t border-[#e9e9e7]">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div className="space-y-6 md:space-y-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">Lokasi Kantor.</h2>
            <div className="space-y-6 md:space-y-8">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#0b6e99] shrink-0 mt-0.5" />
                <p className="opacity-70 font-medium text-sm md:text-base">Jl. Gatot Subroto No.50, Ibuh, Payakumbuh Barat, Kota Payakumbuh, 26218</p>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-[#0b6e99] shrink-0 mt-0.5" />
                <p className="opacity-70 font-medium text-sm md:text-base">+62 813-7225-7440</p>
              </div>
              <div className="flex gap-4">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#0b6e99] shrink-0 mt-0.5" />
                <p className="opacity-70 font-medium text-sm md:text-base">Setiap Hari: 08:00 - 16:00 WIB</p>
              </div>
            </div>
            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#0b6e99] font-bold hover:underline text-sm md:text-base">Buka di Google Maps <ExternalLink className="w-4 h-4" /></a>
          </div>
          <div className="h-[250px] md:h-[400px] rounded-2xl overflow-hidden border border-[#e9e9e7]">
             <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7463.782395279163!2d100.63122736700407!3d-0.23278088209278208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e2ab4b79ffaafd5%3A0x482d2e3ad48bcbab!2sTRI%20BAKTI%20-%20Kursus%20Stir%20Mobil%20Payakumbuh!5e1!3m2!1sid!2sid!4v1780362501510!5m2!1sid!2sid" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

      {/* MODAL ARTIKEL */}
      {selectedArtikel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4 md:p-6" onClick={() => setSelectedArtikel(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="h-48 md:h-64 w-full bg-[#f1f1ef] relative">
              <img src={selectedArtikel.gambar_url} className="w-full h-full object-cover" alt="Banner" />
              <button className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg" onClick={() => setSelectedArtikel(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 md:p-10 space-y-4 md:space-y-6">
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest">{new Date(selectedArtikel.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <h2 className="text-xl md:text-3xl font-bold tracking-tight">{selectedArtikel.judul}</h2>
              <div className="text-sm md:text-lg leading-relaxed opacity-80 space-y-3 md:space-y-4">
                {String(selectedArtikel.full_text || '').split('\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RATING */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRatingModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative z-10 p-6 md:p-10 border border-[#e9e9e7] animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8">
               <h3 className="text-xl md:text-2xl font-bold tracking-tight">Tulis Ulasan</h3>
               <button onClick={() => setShowRatingModal(false)}><X className="w-6 h-6 opacity-40 hover:opacity-100" /></button>
            </div>
            <form onSubmit={handleRatingSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest">Nama Lengkap</label>
                <input type="text" required className="w-full px-4 py-2.5 md:py-3 rounded-lg border border-[#e9e9e7] focus:border-[#0b6e99] outline-none" value={userRatingForm.nama_siswa} onChange={(e) => setUserRatingForm({...userRatingForm, nama_siswa: e.target.value})} />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest">Paket Kursus</label>
                <input type="text" required className="w-full px-4 py-2.5 md:py-3 rounded-lg border border-[#e9e9e7] focus:border-[#0b6e99] outline-none" value={userRatingForm.paket_siswa} onChange={(e) => setUserRatingForm({...userRatingForm, paket_siswa: e.target.value})} />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest">Skor Bintang</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button key={num} type="button" onClick={() => setUserRatingForm({...userRatingForm, skor: num})} className={`w-10 h-10 rounded-lg flex items-center justify-center border ${userRatingForm.skor >= num ? 'bg-amber-400 border-amber-400 text-white' : 'border-[#e9e9e7]'}`}>
                      <Star className={`w-5 h-5 ${userRatingForm.skor >= num ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest">Ulasan</label>
                <textarea required rows="3" className="w-full px-4 py-2.5 md:py-3 rounded-lg border border-[#e9e9e7] focus:border-[#0b6e99] outline-none resize-none" value={userRatingForm.ulasan} onChange={(e) => setUserRatingForm({...userRatingForm, ulasan: e.target.value})}></textarea>
              </div>
              <button type="submit" disabled={submittingRating} className="w-full bg-[#0b6e99] text-white py-3.5 md:py-4 rounded-lg font-bold hover:bg-[#095677] transition-all disabled:opacity-50">{submittingRating ? 'Mengirim...' : 'Kirim Ulasan'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
