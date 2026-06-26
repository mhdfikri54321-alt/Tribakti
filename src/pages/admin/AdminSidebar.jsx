import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoTribakti from '../../assets/logo_tribaktii.png';
import Swal from 'sweetalert2';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  FileText, 
  BookOpen, 
  Calendar, 
  Award, 
  Settings,
  Monitor,
  LogOut,
  Menu,
  X,
  Wallet
} from 'lucide-react';

export default function AdminSidebar({ activeMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (item) => {
    // 1. Cek berdasarkan pathname
    if (item.subPaths && item.subPaths.includes(location.pathname)) {
      return true;
    }
    if (location.pathname === item.path) {
      return true;
    }
    
    // 2. Cek berdasarkan prop activeMenu yang dikirim oleh halaman
    if (item.name === 'Dashboard Utama' && activeMenu === 'dashboard') return true;
    if (item.name === 'Kelola Pengguna' && ['siswa', 'instruktur', 'pengguna'].includes(activeMenu)) return true;
    if (item.name === 'Kurikulum & Konten' && ['kurikulum', 'manajemen-materi', 'konten'].includes(activeMenu)) return true;
    if (item.name === 'Laporan & Sertifikat' && ['laporan', 'laporan-ujian', 'sertifikat-admin'].includes(activeMenu)) return true;
    if (item.name === 'Perhitungan Gaji' && activeMenu === 'gaji') return true;
    if (item.name === 'Pengeluaran Operasional' && activeMenu === 'pengeluaran') return true;

    return false;
  };

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
    { name: 'Dashboard Utama', path: '/admin', icon: LayoutDashboard },
    { 
      name: 'Kelola Pengguna', 
      path: '/admin/siswa', 
      icon: Users, 
      subPaths: ['/admin/siswa', '/admin/instruktur', '/admin/pengguna'] 
    },
    { 
      name: 'Kurikulum & Konten', 
      path: '/admin/kurikulum', 
      icon: BookOpen, 
      subPaths: ['/admin/kurikulum', '/admin/konten'] 
    },
    { 
      name: 'Laporan & Sertifikat', 
      path: '/admin/laporan', 
      icon: BarChart3, 
      subPaths: ['/admin/laporan', '/admin/laporan-ujian', '/admin/sertifikat', '/admin/laporan/detail'] 
    },
    {
      name: 'Perhitungan Gaji',
      path: '/admin/gaji',
      icon: Wallet
    },
    {
      name: 'Pengeluaran Operasional',
      path: '/admin/pengeluaran',
      icon: Wallet
    },
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
                Administrator
              </span>
            </div>
          </div>
        </div>
        
        {/* Menu Items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item);
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
