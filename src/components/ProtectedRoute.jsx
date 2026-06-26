import { Navigate } from 'react-router-dom';

/**
 * Komponen untuk memproteksi rute berdasarkan login dan role
 * @param {JSX.Element} children - Komponen yang akan ditampilkan jika diizinkan
 * @param {string} requiredRole - Role yang diizinkan (opsional)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Jika tidak ada user di localStorage, arahkan ke login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Jika ada requiredRole, cek apakah role user sesuai
  if (requiredRole && user.role !== requiredRole) {
    // Jika role tidak sesuai, arahkan ke landing atau dashboard sesuai role asli
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'instruktur') return <Navigate to="/instruktur-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
