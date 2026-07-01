import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logoTribakti from '../assets/logo_tribaktii.png';
import Swal from 'sweetalert2';
import { LogIn, User, Lock, ArrowRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Cari data pengguna berdasarkan username dan password yang diinput
      const { data, error } = await supabase
        .from('akun_pengguna')
        .select('*')
        .eq('username', formData.username)
        .eq('password', formData.password)
        .single(); // Ambil 1 data saja

      if (error || !data) {
        throw new Error("Username atau password yang Anda masukkan salah.");
      }

      // 2. Simpan data login pengguna ke localStorage agar bisa dibaca halaman lain
      localStorage.setItem('user', JSON.stringify(data));

      Swal.fire({
        html: `
          <div class="flex flex-col items-center justify-center pt-4">
            <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-[#37352f] mb-2 font-sans">Login Berhasil</h3>
            <p class="text-sm text-[#37352f]/60 text-center font-sans">Selamat datang kembali, ${data.nama_lengkap}!</p>
          </div>
        `,
        timer: 2000,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-2xl border border-[#e9e9e7] shadow-xl p-6'
        }
      });

      // 3. --- PROSES DIALIKHAN BERDASARKAN ROLE ---
      setTimeout(() => {
        if (data.role === 'admin') {
          navigate('/admin'); // Jika admin, ke Panel Admin
        } else if (data.role === 'instruktur') {
          navigate('/instruktur-dashboard'); // Jika instruktur, ke Panel Instruktur
        } else if (data.role === 'owner') {
          navigate('/owner'); // Jika owner, ke Panel Owner
        } else {
          navigate('/dashboard'); // Jika siswa, ke Dashboard Siswa
        }
      }, 2000);
      // ---------------------------------------------

    } catch (error) {
      Swal.fire({
        html: `
          <div class="flex flex-col items-center justify-center pt-4">
            <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-[#37352f] mb-2 font-sans">Gagal Login</h3>
            <p class="text-sm text-[#37352f]/60 text-center font-sans">${error.message}</p>
          </div>
        `,
        confirmButtonText: 'Coba Lagi',
        background: '#ffffff',
        buttonsStyling: false,
        customClass: {
          popup: 'rounded-2xl border border-[#e9e9e7] shadow-xl p-6',
          confirmButton: 'bg-[#37352f] hover:bg-[#0b6e99] text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 text-sm outline-none border-0 cursor-pointer shadow-sm font-sans'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex flex-col items-center justify-center p-6 font-sans text-[#37352f]">
      <div className="w-full max-w-sm">

        <Link to="/landing" className="inline-flex items-center gap-2 text-[#37352f]/40 hover:text-[#37352f] transition-colors text-xs font-bold uppercase tracking-widest mb-12 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali
        </Link>

        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-white border border-[#e9e9e7] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <img src={logoTribakti} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Selamat Datang</h2>
          <p className="text-sm text-[#37352f]/60 font-medium">Masuk ke portal TriBakti Driving School</p>
        </div>

        <div className="bg-white border border-[#e9e9e7] p-8 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#37352f]/20 group-focus-within:text-[#0b6e99]">@</div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="username anda"
                  className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#37352f]/20 group-focus-within:text-[#0b6e99] transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-11 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#37352f]/40 hover:text-[#0b6e99] transition-colors outline-none cursor-pointer flex items-center justify-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#37352f] text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#0b6e99] disabled:opacity-50 transition-all shadow-lg shadow-[#37352f]/10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Masuk Sekarang <LogIn className="w-4 h-4" /></>
              )}
            </button>

          </form>

          <div className="mt-8 pt-6 border-t border-[#efefed] text-center">
            <p className="text-xs font-medium text-[#37352f]/60">
              Belum memiliki akun?{' '}
              <Link to="/register" className="text-[#0b6e99] font-bold hover:underline">
                Daftar Gratis
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-[10px] font-bold text-[#37352f]/20 uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} TriBakti Driving School
        </p>
      </div>
    </div>
  );
}