import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Settings, 
  BookOpen, 
  Monitor, 
  BarChart3, 
  FileText, 
  Award 
} from 'lucide-react';

export default function AdminTabSwitcher({ group, activeTab }) {
  const navigate = useNavigate();

  const groups = {
    pengguna: [
      { id: 'siswa', name: 'Data Siswa', path: '/admin/siswa', icon: Users },
      { id: 'instruktur', name: 'Data Instruktur', path: '/admin/instruktur', icon: Briefcase },
      { id: 'akun', name: 'Master Data Akun', path: '/admin/pengguna', icon: Settings },
    ],
    kurikulum: [
      { id: 'kurikulum', name: 'Manajemen Kurikulum', path: '/admin/kurikulum', icon: BookOpen },
      { id: 'konten', name: 'Manajemen Konten', path: '/admin/konten', icon: Monitor },
    ],
    laporan: [
      { id: 'bisnis', name: 'Laporan Bisnis', path: '/admin/laporan', icon: BarChart3 },
      { id: 'ujian', name: 'Laporan Ujian', path: '/admin/laporan-ujian', icon: FileText },
      { id: 'sertifikat', name: 'Data Sertifikat', path: '/admin/sertifikat', icon: Award },
    ]
  };

  const items = groups[group] || [];

  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-[#efefed] p-1 rounded-xl w-fit border border-[#e9e9e7]">
      {items.map((item) => {
        const active = item.id === activeTab;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              active 
                ? 'bg-white text-[#37352f] shadow-sm font-semibold' 
                : 'text-[#37352f]/50 hover:text-[#37352f]'
            }`}
          >
            <Icon className={`w-4 h-4 ${active ? 'text-[#0b6e99]' : ''}`} />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
