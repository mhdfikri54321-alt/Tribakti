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

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  return (
    <Router>
      <div className="bg-bg-light min-h-screen">

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