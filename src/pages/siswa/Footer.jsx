import React from 'react';
import logoTribakti from '../../assets/logo_tribaktii.png';

export default function Footer() {
  return (
    <footer className="py-12 px-8 border-t border-[#e9e9e7] bg-white mt-auto w-full font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
            <div className="w-9 h-9 bg-white border border-[#e9e9e7] rounded-lg flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <img src={logoTribakti} alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-base font-bold tracking-tight text-[#37352f]">Tri<span className="text-[#0b6e99]">Bakti</span></h1>
          </div>
          <p className="text-[#37352f]/40 text-xs font-medium max-w-xs leading-relaxed">
            Pusat Pelatihan Mengemudi Profesional & Terpercaya di Payakumbuh.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="text-[#37352f]/40 text-[10px] font-bold tracking-widest uppercase">
            &copy; {new Date().getFullYear()} TriBakti Driving School
          </div>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/tribaktipayakumbuh/" className="text-[#37352f]/60 hover:text-[#0b6e99] transition-colors text-[10px] font-bold uppercase tracking-widest">Instagram</a>
            <a href="https://wa.me/6281363278134" className="text-[#37352f]/60 hover:text-[#0b6e99] transition-colors text-[10px] font-bold uppercase tracking-widest">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
