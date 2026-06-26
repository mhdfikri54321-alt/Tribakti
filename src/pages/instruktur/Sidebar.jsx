import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoTribakti from '../../assets/logo_tribaktii.png';
import Swal from 'sweetalert2';
import { 
  LayoutDashboard, 
  Activity, 
  Clock, 
  BookOpen, 
  FileQuestion, 
  Users, 
  FileText,
  LogOut,
  Menu,
  X,
  Wallet
} from 'lucide-react';

export default function Sidebar({ activeMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path || activeMenu === path.split('/').pop();

  const handleLogout = () => {
    Swal.fire({
      html: `
        <div class="flex flex-col items-center justify-center pt-4">
          <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-[#37352f] mb-2 font-sans">Keluar Website</h3>
          <p class="text-sm text-[#37352f]/60 text-center font-sans">Apakah Anda yakin ingin keluar dari akun Anda?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-2xl border border-[#e9e9e7] shadow-xl p-6',
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 text-sm mx-2 outline-none border-0 cursor-pointer shadow-sm shadow-red-100 font-sans',
        cancelButton: 'bg-[#efefed] hover:bg-[#e4e4e7] text-[#37352f] font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 text-sm mx-2 outline-none border-0 cursor-pointer font-sans'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('user');
        navigate('/landing');
      }
    });
  };

  const menuItems = [
    { name: 'Dashboard', path: '/instruktur-dashboard', icon: LayoutDashboard },
    { name: 'Sesi Latihan Aktif', path: '/sesi-aktif', icon: Activity },
    { name: 'Atur Jam Kursus', path: '/manage-jam', icon: Clock },
    { name: 'Materi Belajar', path: '/instruktur/materi', icon: BookOpen },
    { name: 'Bank Soal Ujian', path: '/manajemen-soal', icon: FileQuestion },
    { name: 'Data Siswa', path: '/instruktur/siswa', icon: Users },
    { name: 'Hasil Ujian Siswa', path: '/data-ujian-siswa', icon: FileText },
    { name: 'Riwayat Gaji', path: '/instruktur/gaji', icon: Wallet },
  ];

  return (
    <>
      {/* Mobile Drawer Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed top-3 left-3 z-[90] md:hidden p-2.5 bg-white border border-[#e9e9e7] hover:bg-[#efefed] text-[#37352f] rounded-xl shadow-sm transition-all flex items-center justify-center"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Backdrop Overlay for mobile drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[80] md:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#fbfbfa] border-r border-[#e9e9e7] flex flex-col shrink-0 z-[85] font-sans transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'}`}>
        
        {/* Header Logo */}
        <div className="p-6 mb-2 pl-14 md:pl-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border border-[#e9e9e7] rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <img src={logoTribakti} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-[#37352f] leading-tight">
                Tri<span className="text-[#0b6e99]">Bakti</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">
                Instruktur Portal
              </span>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[#efefed] text-[#37352f]' : 'text-[#37352f]/70 hover:bg-[#efefed] hover:text-[#37352f]'}`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#0b6e99]' : ''}`} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#e9e9e7]">
          <button 
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }} 
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>

      </aside>
    </>
  );
}