import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';
import Sidebar from './Sidebar';
import InstrukturSidebar from '../instruktur/Sidebar';
import AdminSidebar from '../admin/AdminSidebar';
import OwnerSidebar from '../owner/OwnerSidebar';
import Footer from './Footer';
import { User, Shield, Phone, MapPin, Calendar, Heart, Save, ChevronRight } from 'lucide-react';

export default function Profil() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const akunId = savedUser?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPendaftaran, setHasPendaftaran] = useState(false);
  const [pendaftaranId, setPendaftaranId] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nama_lengkap: '',
    nik: '',
    tempat_tgl_lahir: '',
    jenis_kelamin: '',
    alamat_domisili: '',
    no_whatsapp: ''
  });

  useEffect(() => {
    if (!akunId) {
      navigate('/login');
    } else {
      fetchUserData();
    }
  }, [akunId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data akun_pengguna
      const { data: account, error: errAcc } = await supabase
        .from('akun_pengguna')
        .select('*')
        .eq('id', akunId)
        .single();
      
      if (errAcc) throw errAcc;

      // 2. Ambil data pendaftaran (hanya jika siswa)
      let pendaftaran = null;
      if (savedUser.role === 'siswa') {
        const { data } = await supabase
          .from('pendaftaran')
          .select('*')
          .eq('akun_id', akunId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        pendaftaran = data;
      }

      if (pendaftaran) {
        setHasPendaftaran(true);
        setPendaftaranId(pendaftaran.id);
      }

      setFormData({
        username: account.username || '',
        password: account.password || '',
        nama_lengkap: account.nama_lengkap || '',
        nik: pendaftaran?.nik || '',
        tempat_tgl_lahir: pendaftaran?.tempat_tanggal_lahir || '',
        jenis_kelamin: pendaftaran?.jenis_kelamin || '',
        alamat_domisili: pendaftaran?.alamat_domisili || '',
        no_whatsapp: pendaftaran?.no_whatsapp || ''
      });
    } catch (err) {
      console.error("Gagal mengambil data profil:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Validasi Input Akun
      if (!formData.username.trim() || !formData.password.trim() || !formData.nama_lengkap.trim()) {
        throw new Error("Nama lengkap, username, dan password tidak boleh kosong!");
      }

      // 2. Validasi NIK & WA (jika ada pendaftaran)
      if (hasPendaftaran) {
        const nikRegex = /^\d{16}$/;
        if (!nikRegex.test(formData.nik)) {
          throw new Error("NIK wajib berisi tepat 16 digit angka!");
        }

        const waRegex = /^(08|62)\d{8,13}$/;
        if (!waRegex.test(formData.no_whatsapp)) {
          throw new Error("No WhatsApp harus berformat angka dan diawali dengan 08 atau 62 (minimal 10 digit)!");
        }
      }

      // 3. Update tabel akun_pengguna
      const { error: errAccUpdate } = await supabase
        .from('akun_pengguna')
        .update({
          nama_lengkap: formData.nama_lengkap,
          username: formData.username,
          password: formData.password
        })
        .eq('id', akunId);

      if (errAccUpdate) throw errAccUpdate;

      // 4. Update tabel pendaftaran (jika ada)
      if (hasPendaftaran && pendaftaranId) {
        const { error: errPendUpdate } = await supabase
          .from('pendaftaran')
          .update({
            nama_lengkap: formData.nama_lengkap,
            nik: formData.nik,
            tempat_tanggal_lahir: formData.tempat_tgl_lahir,
            jenis_kelamin: formData.jenis_kelamin,
            alamat_domisili: formData.alamat_domisili,
            no_whatsapp: formData.no_whatsapp
          })
          .eq('id', pendaftaranId);

        if (errPendUpdate) throw errPendUpdate;
      }

      // 5. Perbarui sesi lokal (localStorage)
      const updatedUser = {
        ...savedUser,
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        password: formData.password
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      Swal.fire({
        icon: 'success',
        title: 'Profil Diperbarui',
        text: 'Perubahan profil Anda berhasil disimpan secara aman.',
        confirmButtonColor: '#0b6e99',
        background: '#ffffff',
        color: '#37352f',
        customClass: { popup: 'rounded-2xl border border-[#e9e9e7]' }
      });

      fetchUserData(); // Refresh data dari db
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Pembaruan Gagal',
        text: err.message,
        confirmButtonColor: '#0b6e99',
        background: '#ffffff',
        color: '#37352f',
        customClass: { popup: 'rounded-2xl border border-[#e9e9e7]' }
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSidebar = () => {
    switch (savedUser.role) {
      case 'admin':
        return <AdminSidebar activeMenu="profil" />;
      case 'owner':
        return <OwnerSidebar activeMenu="profil" />;
      case 'instruktur':
        return <InstrukturSidebar activeMenu="profil" />;
      default:
        return <Sidebar role="siswa" activeMenu="profil" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fbfbfa] text-[#37352f]">
        <div className="w-8 h-8 border-4 border-[#efefed] border-t-[#0b6e99] rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#37352f]/50">Memuat Profil Saya...</p>
      </div>
    );
  }

  const userRoleText = savedUser.role === 'admin' ? 'Administrator' :
                     savedUser.role === 'owner' ? 'Owner Portal' :
                     savedUser.role === 'instruktur' ? 'Portal Instruktur' : 'Portal Siswa';

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      {renderSidebar()}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 flex justify-between items-center border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium text-[#37352f]/60">Menu</h1>
            <ChevronRight className="w-4 h-4 text-[#37352f]/30" />
            <span className="text-sm font-semibold">Profil Saya</span>
          </div>
          <button 
            onClick={() => navigate('/profil')}
            className="flex items-center gap-3 hover:opacity-85 transition-opacity cursor-pointer border-0 bg-transparent text-[#37352f] text-left p-0"
          >
            <div className="text-right">
              <p className="text-sm font-semibold leading-none">{formData.nama_lengkap}</p>
              <p className="text-[10px] text-[#37352f]/50 font-bold uppercase tracking-wider mt-1">{userRoleText}</p>
            </div>
            <div className="w-8 h-8 bg-[#efefed] rounded flex items-center justify-center text-sm font-bold text-[#37352f]">
              {formData.nama_lengkap.charAt(0) || 'S'}
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-10">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSave} className="space-y-8">
              {/* Header Title */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#e9e9e7] p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#efefed] rounded-xl flex items-center justify-center text-[#0b6e99]">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Kelola Profil Anda</h2>
                    <p className="text-xs text-[#37352f]/50 mt-1">Perbarui kata sandi, informasi login, dan info kontak pribadi.</p>
                  </div>
                </div>
              </div>

              {hasPendaftaran ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* KIRI: Informasi Akun (Login) */}
                  <div className="bg-white border border-[#e9e9e7] p-6 rounded-2xl h-fit space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#37352f]/40 flex items-center gap-2 border-b border-[#efefed] pb-3">
                      <Shield className="w-4 h-4 text-[#0b6e99]" /> Kredensial Login
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Nama Lengkap</label>
                        <input
                          type="text"
                          name="nama_lengkap"
                          required
                          value={formData.nama_lengkap}
                          onChange={handleInputChange}
                          className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Username</label>
                        <input
                          type="text"
                          name="username"
                          required
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Kata Sandi</label>
                        <input
                          type="text"
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KANAN: Detail Informasi Pribadi */}
                  <div className="lg:col-span-2 bg-white border border-[#e9e9e7] p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#37352f]/40 flex items-center gap-2 border-b border-[#efefed] pb-3">
                      <User className="w-4 h-4 text-[#0b6e99]" /> Detail Informasi Pribadi
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Nomor Induk Kependudukan (NIK)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[#37352f]/30"><Shield className="w-4 h-4" /></span>
                            <input
                              type="text"
                              name="nik"
                              maxLength="16"
                              required
                              value={formData.nik}
                              onChange={handleInputChange}
                              className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">No WhatsApp Kontak</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[#37352f]/30"><Phone className="w-4 h-4" /></span>
                            <input
                              type="text"
                              name="no_whatsapp"
                              required
                              value={formData.no_whatsapp}
                              onChange={handleInputChange}
                              className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Jenis Kelamin</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[#37352f]/30"><Heart className="w-4 h-4" /></span>
                            <select
                              name="jenis_kelamin"
                              required
                              value={formData.jenis_kelamin}
                              onChange={handleInputChange}
                              className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none appearance-none font-sans"
                            >
                              <option value="">Pilih Jenis Kelamin</option>
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Tempat, Tanggal Lahir</label>
                          <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[#37352f]/30"><Calendar className="w-4 h-4" /></span>
                            <input
                              type="text"
                              name="tempat_tgl_lahir"
                              required
                              placeholder="Contoh: Payakumbuh, 12 Juni 2000"
                              value={formData.tempat_tgl_lahir}
                              onChange={handleInputChange}
                              className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Alamat Domisili</label>
                          <div className="relative">
                            <span className="absolute left-4 top-4 text-[#37352f]/30"><MapPin className="w-4 h-4" /></span>
                            <textarea
                              name="alamat_domisili"
                              required
                              rows="3"
                              value={formData.alamat_domisili}
                              onChange={handleInputChange}
                              className="w-full bg-[#efefed] border-none rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none resize-none font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto bg-white border border-[#e9e9e7] p-8 rounded-2xl space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#37352f]/40 flex items-center gap-2 border-b border-[#efefed] pb-3">
                    <Shield className="w-4 h-4 text-[#0b6e99]" /> Kredensial Login
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Nama Lengkap</label>
                      <input
                        type="text"
                        name="nama_lengkap"
                        required
                        value={formData.nama_lengkap}
                        onChange={handleInputChange}
                        className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Username</label>
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40 mb-1.5 block">Kata Sandi</label>
                      <input
                        type="text"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full bg-[#efefed] border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none"
                      />
                    </div>
                  </div>

                  {savedUser.role !== 'siswa' && (
                    <div className="pt-4 border-t border-[#efefed] text-[10px] text-[#37352f]/40 font-medium italic flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span>Kredensial dan hak akses akun Anda dikelola secara terpusat oleh Administrator.</span>
                    </div>
                  )}

                  {savedUser.role === 'siswa' && (
                    <div className="pt-4 border-t border-[#efefed] text-[10px] text-orange-600 font-medium italic flex items-center gap-2">
                      <span>Anda belum melengkapi formulir pendaftaran siswa. Hubungi admin untuk kelayakan akses penuh.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#0b6e99] hover:bg-[#085a80] text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
