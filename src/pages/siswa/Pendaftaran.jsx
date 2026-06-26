import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';
import { 
  ChevronLeft, 
  CreditCard, 
  Upload, 
  User, 
  ShieldCheck, 
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import logoTribakti from '../../assets/logo_tribakti.png';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Pendaftaran() {
  const navigate = useNavigate();
  const location = useLocation();
  const paketDipilih = location.state?.paket || null;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileBukti, setFileBukti] = useState(null);

  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nik: '',
    tempat_tgl_lahir: '',
    jenis_kelamin: '',
    alamat_domisili: '',
    no_whatsapp: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setFormData(prev => ({ ...prev, nama_lengkap: parsedUser.nama_lengkap || '' }));
    } else {
      navigate('/login');
    }

    if (!paketDipilih) {
      Swal.fire({
        icon: 'warning',
        title: 'Paket Belum Dipilih',
        text: 'Silakan tentukan pilihan paket kursus terlebih dahulu!',
        confirmButtonColor: '#37352f',
        customClass: { popup: 'rounded-xl border border-[#e9e9e7]' }
      }).then(() => {
        navigate('/dashboard');
      });
    }
  }, [navigate, paketDipilih]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileBukti(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileBukti) {
      return Swal.fire({
        icon: 'warning',
        title: 'Bukti Pembayaran',
        text: 'Silakan unggah foto bukti transfer pembayaran Anda!',
        confirmButtonColor: '#37352f',
        customClass: { popup: 'rounded-xl border border-[#e9e9e7]' }
      });
    }
    setLoading(true);

    try {
      const targetUserId = user?.id || user?.akun_id;
      if (!targetUserId) throw new Error("Sesi pengguna tidak valid. Silakan login kembali.");

      const fileExt = fileBukti.name.split('.').pop();
      const fileName = `${targetUserId}-${Date.now()}.${fileExt}`;
      const filePath = `bukti_transfer/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pendaftaran_files') 
        .upload(filePath, fileBukti);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('pendaftaran_files')
        .getPublicUrl(filePath);

      const publicLinkBukti = urlData.publicUrl;

      const { error: errorInsert } = await supabase
        .from('pendaftaran')
        .insert([{
          akun_id: targetUserId,
          nama_lengkap: formData.nama_lengkap,
          nik: formData.nik,
          tempat_tanggal_lahir: formData.tempat_tgl_lahir, 
          jenis_kelamin: formData.jenis_kelamin,           
          alamat_domisili: formData.alamat_domisili,       
          no_whatsapp: formData.no_whatsapp,               
          paket_pilihan: paketDipilih?.name || 'Paket Kursus',
          total_bayar: paketDipilih?.price || 0,        
          bukti_transfer_url: publicLinkBukti,         
          status: 'Menunggu Konfirmasi'
        }]);

      if (errorInsert) throw errorInsert;

      const { error: errorUpdateAkun } = await supabase
        .from('akun_pengguna')
        .update({ 
          paket: paketDipilih?.name,                           
          price: paketDipilih?.price || 0,                     
          paket_id: paketDipilih?.id, 
          alamat_lengkap: formData.alamat_domisili,            
          jenis_kelamin: formData.jenis_kelamin,               
          no_whatsapp: formData.no_whatsapp,                   
          tempat_tanggal_lahir: formData.tempat_tgl_lahir,
          nik: formData.nik,
          jumlah_sesi: paketDipilih?.session_count
        })
        .eq('id', targetUserId);

      if (errorUpdateAkun) throw errorUpdateAkun;

      Swal.fire({
        icon: 'success',
        title: 'Pendaftaran Berhasil',
        text: 'Data Anda telah terkirim! Admin akan memverifikasi pembayaran Anda maksimal 1x24 jam.',
        confirmButtonColor: '#0b6e99',
        customClass: { popup: 'rounded-xl border border-[#e9e9e7]' }
      }).then(() => {
        navigate('/dashboard');
      });

    } catch (err) {
      console.error('Error proses pendaftaran:', err.message);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mendaftar',
        text: 'Terjadi kesalahan: ' + err.message,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfa] min-h-screen flex text-[#37352f] font-sans">
      <Sidebar role="siswa" activeMenu="dashboard" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 md:px-8 pl-14 md:pl-8 py-4 border-b border-[#e9e9e7] bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-[#efefed] rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                  <div>
                    <span className="block text-lg md:text-xl font-black tracking-tight text-[#37352f] leading-none mb-1">Pendaftaran</span>
                    <span className="block text-[9px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-[#37352f]/40">Kursus Mengemudi</span>
                  </div>
                </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#37352f]/40">Paket</p>
              <p className="text-xs font-bold text-[#0b6e99]">{paketDipilih?.name || '-'}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full px-4 md:px-8 py-6 md:py-12">
          <div className="max-w-6xl">
            <div className="mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-2 md:mb-4">Lengkapi Data Diri 📋</h2>
              <p className="text-sm md:text-lg text-[#37352f]/60 font-medium">Isi formulir di bawah ini dengan benar untuk mempermudah proses administrasi dan sertifikasi.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
              <div className="lg:col-span-8 space-y-6 md:space-y-10">
                <section className="bg-white border border-[#e9e9e7] rounded-3xl p-6 md:p-8 shadow-sm">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#37352f]/40 mb-6 md:mb-8 flex items-center gap-2">
                    <User className="w-4 h-4" /> Informasi Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-1">Nama Lengkap</label>
                      <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-1">NIK (Sesuai KTP)</label>
                      <input type="text" name="nik" placeholder="16 Digit NIK" value={formData.nik} onChange={handleChange} required className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-1">Tempat, Tanggal Lahir</label>
                      <input type="text" name="tempat_tgl_lahir" placeholder="Contoh: Payakumbuh, 12-01-1995" value={formData.tempat_tgl_lahir} onChange={handleChange} required className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-1">Jenis Kelamin</label>
                      <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} required className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all appearance-none">
                        <option value="">-- Pilih --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                      <input type="text" name="no_whatsapp" placeholder="Contoh: 08123456789" value={formData.no_whatsapp} onChange={handleChange} required className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest ml-1">Alamat Domisili</label>
                      <textarea name="alamat_domisili" rows="3" value={formData.alamat_domisili} onChange={handleChange} required className="w-full bg-[#fbfbfa] border border-[#e9e9e7] rounded-xl px-4 py-2.5 md:py-3 text-sm font-medium focus:ring-1 focus:ring-[#0b6e99] outline-none transition-all resize-none"></textarea>
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-[#e9e9e7] rounded-3xl p-6 md:p-8 shadow-sm">
                  <h3 className="text-[10px] md:text-[15px] font-bold uppercase tracking-[0.2em] text-[#37352f]/40 mb-6 md:mb-8 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Pembayaran
                  </h3>
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="w-12 h-12 bg-blue-50 text-[#0b6e99] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#37352f]">Unggah Bukti Transfer</h4>
                      <p className="text-[9px] md:text-[10px] font-medium text-[#37352f]/40 uppercase tracking-widest leading-normal">Format JPG, PNG atau PDF (Maks. 2MB)</p>
                    </div>
                  </div>
                  <div className="relative group">
                    <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="block w-full text-xs text-[#37352f]/60 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-[#37352f] file:text-white hover:file:bg-[#0b6e99] file:transition-all cursor-pointer bg-[#fbfbfa] border border-dashed border-[#e9e9e7] p-4 rounded-2xl group-hover:border-[#0b6e99] transition-colors" />
                  </div>
                </section>
              </div>

              <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 w-full">
                <div className="bg-white border border-[#e9e9e7] rounded-3xl p-6 md:p-8 shadow-sm">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#37352f]/40 mb-6 md:mb-8">Ringkasan Pesanan</h3>
                  <div className="space-y-4 mb-6 md:mb-8">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs md:text-sm font-medium text-[#37352f]/60">Paket</span>
                      <span className="text-xs md:text-sm font-bold text-right">{paketDipilih?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xs md:text-sm font-medium text-[#37352f]/60">Sesi Latihan</span>
                      <span className="text-xs md:text-sm font-bold text-right">{paketDipilih?.session_count} Sesi</span>
                    </div>
                    <div className="pt-4 border-t border-[#efefed] flex justify-between items-center gap-2">
                      <span className="text-xs md:text-sm font-bold">Total Bayar</span>
                      <span className="text-lg md:text-xl font-black text-[#0b6e99] text-right">Rp {paketDipilih?.price?.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#fbfbfa] p-4 md:p-6 rounded-2xl border border-[#e9e9e7] mb-6 md:mb-8">
                    <p className="text-[8px] md:text-[10px] font-bold text-[#37352f]/40 uppercase tracking-widest mb-3 md:mb-4">Transfer Ke:</p>
                    <div className="space-y-2">
                      <p className="text-[10px] md:text-[11px] font-black text-[#37352f] flex justify-between gap-2">BCA <span>0860941759</span></p>
                      <p className="text-[10px] md:text-[11px] font-black text-[#37352f] flex justify-between gap-2">BNI <span>0810867608</span></p>
                      <p className="text-[10px] md:text-[11px] font-black text-[#37352f] flex justify-between gap-2">DANA <span>081372257440</span></p>
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#0b6e99] mt-3 md:mt-4 uppercase tracking-wider">an Rivo Raihan</p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#37352f] text-white py-3 md:py-4 rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#0b6e99] transition-all shadow-xl shadow-[#37352f]/10 flex items-center justify-center gap-2.5 group"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Konfirmasi Pendaftaran <ShieldCheck className="w-4 h-4 md:w-5 h-5 group-hover:scale-110 transition-transform" /></>
                    )}
                  </button>
                </div>
                
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 md:p-6 rounded-3xl flex gap-3 md:gap-4 items-start">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 md:w-5 h-5" />
                  </div>
                  <p className="text-[8px] md:text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-wider">
                    Data Anda aman. Kami menggunakan enkripsi standar industri untuk melindungi informasi pribadi Anda.
                  </p>
                </div>
              </aside>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
