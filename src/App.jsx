import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProtectedRoute from './components/ProtectedRoute';

// Import Semua Halaman
import LandingPage from './pages/siswa/Landing';
import Login from './pages/Login';
import Register from './pages/siswa/Register';
import Pendaftaran from './pages/siswa/Pendaftaran';
import DashboardSiswa from './pages/siswa/DashboardSiswa';
import JadwalSiswa from './pages/siswa/Jadwal';
import MateriSiswa from './pages/siswa/MateriSiswa';
import UjianSim from './pages/siswa/UjianSim';
import UjianMateri from './pages/siswa/UjianMateri';
import UjianMotorik from './pages/siswa/UjianMotorik';
import HistoriUjian from './pages/siswa/HistoriUjian';
import Sertifikat from './pages/siswa/Sertifikat';
import SiswaKwitansi from './pages/siswa/SiswaKwitansi';
import Bantuan from './pages/siswa/Bantuan';
import Profil from './pages/siswa/Profil';

// Import Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManajemenPengguna from './pages/admin/ManajemenPengguna';
import ManajemenInstruktur from './pages/admin/ManajemenInstruktur';
import ManajemenSiswa from './pages/admin/ManajementSiswa';
import AdminDetailSiswa from './pages/admin/AdminDetailSiswa';
import AdminDetailSesiSiswa from './pages/admin/AdminDetailSesiSiswa';
import AdminKwitansiSiswa from './pages/admin/AdminKwitansiSiswa';
import ManajemenKonten from './pages/admin/ManajemenKonten';
import AdminLaporan from './pages/admin/AdminLaporan';
import AdminLaporanDetail from './pages/admin/AdminLaporanDetail';
import AdminManajemenMateri from './pages/admin/AdminManajemenMateri';
import AdminLaporanUjian from './pages/admin/AdminLaporanUjian';
import AdminDaftarSertifikat from './pages/admin/AdminDaftarSertifikat';
import AdminDetailSesiInstruktur from './pages/admin/AdminDetailSesiInstruktur';
import AdminGajiInstruktur from './pages/admin/AdminGajiInstruktur';
import AdminPengeluaran from './pages/admin/AdminPengeluaran';

// Import Instruktur
import InstrukturDashboard from './pages/instruktur/InstrukturDashboard';
import ManageJam from './pages/instruktur/ManageJam';
import SesiAktif from './pages/instruktur/SesiAktif';
import ManajemenMateri from './pages/instruktur/ManajemenMateri';
import DataSiswa from './pages/instruktur/DataSiswa';
import ManajemenSoal from './pages/instruktur/ManajemenSoal';
import DetailUjianSiswa from './pages/instruktur/DetailUjianSiswa';
import RiwayatGaji from './pages/instruktur/RiwayatGaji';

// Import Halaman Owner
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerLaporanBisnis from './pages/owner/OwnerLaporanBisnis';
import OwnerLaporanDetail from './pages/owner/OwnerLaporanDetail';
import OwnerLaporanUjian from './pages/owner/OwnerLaporanUjian';
import OwnerManajemenPengguna from './pages/owner/OwnerManajemenPengguna';
import OwnerDetailSesiSiswa from './pages/owner/OwnerDetailSesiSiswa';
import OwnerDetailSesiInstruktur from './pages/owner/OwnerDetailSesiInstruktur';
import OwnerDetailSiswa from './pages/owner/OwnerDetailSiswa';
import OwnerKwitansiSiswa from './pages/owner/OwnerKwitansiSiswa';
import OwnerGajiInstruktur from './pages/owner/OwnerGajiInstruktur';
import OwnerPengeluaran from './pages/owner/OwnerPengeluaran';

export default function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <div className="bg-bg-light min-h-screen relative">
        {/* Floating Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="fixed bottom-6 right-6 z-50 bg-[#37352f] dark:bg-white text-white dark:text-[#37352f] w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer print:hidden border border-[#e9e9e7]/10"
          title="Toggle Dark Mode"
        >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          )}
        </button>

        {/* Floating WhatsApp Widget */}
        <a
          href="https://wa.me/6281363278134?text=Halo%20Admin%20TriBakti%2C%20saya%20ingin%20bertanya%20mengenai%20layanan%20dan%20pendaftaran%20kursus%20mengemudi%20di%20TriBakti..."
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-50 bg-[#25D366] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer print:hidden border border-emerald-400/20"
          title="Hubungi Kami di WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20" height="20" fill="currentColor">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
          </svg>
        </a>

        <Routes>
          {/* Rute Umum & Siswa */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/pendaftaran" element={<ProtectedRoute requiredRole="siswa"><Pendaftaran /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="siswa"><DashboardSiswa /></ProtectedRoute>} />
          <Route path="/jadwal" element={<ProtectedRoute requiredRole="siswa"><JadwalSiswa /></ProtectedRoute>} />
          <Route path="/materi" element={<ProtectedRoute requiredRole="siswa"><MateriSiswa /></ProtectedRoute>} />
          <Route path="/ujian" element={<ProtectedRoute requiredRole="siswa"><UjianSim /></ProtectedRoute>} />
          <Route path="/ujian-materi" element={<ProtectedRoute requiredRole="siswa"><UjianMateri /></ProtectedRoute>} />
          <Route path="/ujian-motorik" element={<ProtectedRoute requiredRole="siswa"><UjianMotorik /></ProtectedRoute>} />
          <Route path="/histori" element={<ProtectedRoute requiredRole="siswa"><HistoriUjian /></ProtectedRoute>} />
          <Route path="/sertifikat" element={<ProtectedRoute requiredRole="siswa"><Sertifikat /></ProtectedRoute>} />
          <Route path="/siswa/kwitansi" element={<ProtectedRoute requiredRole="siswa"><SiswaKwitansi /></ProtectedRoute>} />
          <Route path="/bantuan" element={<ProtectedRoute requiredRole="siswa"><Bantuan /></ProtectedRoute>} />
          <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />

          {/* Rute Admin */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/pengguna" element={<ProtectedRoute requiredRole="admin"><ManajemenPengguna /></ProtectedRoute>} />
          <Route path="/admin/instruktur" element={<ProtectedRoute requiredRole="admin"><ManajemenInstruktur /></ProtectedRoute>} />
          <Route path="/admin/siswa" element={<ProtectedRoute requiredRole="admin"><ManajemenSiswa /></ProtectedRoute>} />
          <Route path="/admin/siswa/detail" element={<ProtectedRoute requiredRole="admin"><AdminDetailSiswa /></ProtectedRoute>} />
          <Route path="/admin/siswa/sesi" element={<ProtectedRoute requiredRole="admin"><AdminDetailSesiSiswa /></ProtectedRoute>} />
          <Route path="/admin/siswa/kwitansi" element={<ProtectedRoute requiredRole="admin"><AdminKwitansiSiswa /></ProtectedRoute>} />
          <Route path="/admin/konten" element={<ProtectedRoute requiredRole="admin"><ManajemenKonten /></ProtectedRoute>} />
          <Route path="/admin/laporan" element={<ProtectedRoute requiredRole="admin"><AdminLaporan /></ProtectedRoute>} />
          <Route path="/admin/laporan/detail" element={<ProtectedRoute requiredRole="admin"><AdminLaporanDetail /></ProtectedRoute>} />
          <Route path="/admin/kurikulum" element={<ProtectedRoute requiredRole="admin"><AdminManajemenMateri /></ProtectedRoute>} />
          <Route path="/admin/laporan-ujian" element={<ProtectedRoute requiredRole="admin"><AdminLaporanUjian /></ProtectedRoute>} />
          <Route path="/admin/sertifikat" element={<ProtectedRoute requiredRole="admin"><AdminDaftarSertifikat /></ProtectedRoute>} />
          <Route path="/admin/instruktur/sesi" element={<ProtectedRoute requiredRole="admin"><AdminDetailSesiInstruktur /></ProtectedRoute>} />
          <Route path="/admin/gaji" element={<ProtectedRoute requiredRole="admin"><AdminGajiInstruktur /></ProtectedRoute>} />
          <Route path="/admin/pengeluaran" element={<ProtectedRoute requiredRole="admin"><AdminPengeluaran /></ProtectedRoute>} />
          <Route path="/sertifikat-preview/:id" element={<ProtectedRoute requiredRole="admin"><Sertifikat /></ProtectedRoute>} />



          {/* Rute Panel Kendali Instruktur */}
          <Route path="/instruktur-dashboard" element={<ProtectedRoute requiredRole="instruktur"><InstrukturDashboard /></ProtectedRoute>} />
          <Route path="/sesi-aktif" element={<ProtectedRoute requiredRole="instruktur"><SesiAktif /></ProtectedRoute>} />
          <Route path="/manage-jam" element={<ProtectedRoute requiredRole="instruktur"><ManageJam /></ProtectedRoute>} />
          <Route path="/instruktur/materi" element={<ProtectedRoute requiredRole="instruktur"><ManajemenMateri /></ProtectedRoute>} />
          <Route path="/instruktur/siswa" element={<ProtectedRoute requiredRole="instruktur"><DataSiswa /></ProtectedRoute>} />
          <Route path="/manajemen-soal" element={<ProtectedRoute requiredRole="instruktur"><ManajemenSoal /></ProtectedRoute>} />
          <Route path="/data-ujian-siswa" element={<ProtectedRoute requiredRole="instruktur"><DetailUjianSiswa /></ProtectedRoute>} />
          <Route path="/instruktur/gaji" element={<ProtectedRoute requiredRole="instruktur"><RiwayatGaji /></ProtectedRoute>} />

          {/* --- ROUTES OWNER --- */}
           <Route path="/owner" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner/laporan" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerLaporanBisnis /></ProtectedRoute>} />
          <Route path="/owner/laporan/detail" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerLaporanDetail /></ProtectedRoute>} />
          <Route path="/owner/laporan-ujian" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerLaporanUjian /></ProtectedRoute>} />
          <Route path="/owner/siswa" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerManajemenPengguna /></ProtectedRoute>} />
          <Route path="/owner/siswa/sesi" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerDetailSesiSiswa /></ProtectedRoute>} />
          <Route path="/owner/instruktur/sesi" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerDetailSesiInstruktur /></ProtectedRoute>} />
          <Route path="/owner/siswa/detail" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerDetailSiswa /></ProtectedRoute>} />
          <Route path="/owner/siswa/kwitansi" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerKwitansiSiswa /></ProtectedRoute>} />
          <Route path="/owner/gaji" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerGajiInstruktur /></ProtectedRoute>} />
          <Route path="/owner/pengeluaran" element={<ProtectedRoute user={user} requiredRole="owner"><OwnerPengeluaran /></ProtectedRoute>} />

          {/* Default Redirect Halaman Awal */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>

      </div>
    </Router>
  );
}