import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf-8');
const lines = envText.split('\n');
const env = {};
for (const line of lines) {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function verify() {
  console.log("=== VERIFIKASI DATA AZZURA QOTRUN NADA (ID: 36) ===");
  
  // 1. Cek akun_pengguna
  const { data: user, error: userErr } = await supabase
    .from('akun_pengguna')
    .select('*')
    .eq('id', 36)
    .single();
    
  if (userErr) {
    console.error("Gagal mengambil data akun:", userErr.message);
  } else {
    console.log("Akun ditemukan:", {
      id: user.id,
      nama: user.nama_lengkap,
      paket: user.paket,
      jumlah_sesi: user.jumlah_sesi
    });
  }

  // 2. Cek pendaftaran
  const { data: reg, error: regErr } = await supabase
    .from('pendaftaran')
    .select('*')
    .eq('akun_id', 36)
    .single();

  if (regErr) {
    console.error("Gagal mengambil data pendaftaran:", regErr.message);
  } else {
    console.log("Pendaftaran ditemukan:", {
      id: reg.id,
      nama: reg.nama_lengkap,
      paket: reg.paket_pilihan,
      total_bayar: reg.total_bayar
    });
  }

  // 3. Cek jadwal_latihan
  const { data: schedules, error: schedErr } = await supabase
    .from('jadwal_latihan')
    .select('*')
    .eq('akun_id', 36)
    .order('pertemuan_ke', { ascending: true });

  if (schedErr) {
    console.error("Gagal mengambil data jadwal latihan:", schedErr.message);
  } else {
    console.log(`Jadwal latihan ditemukan: ${schedules.length} sesi.`);
    schedules.forEach(s => {
      console.log(`- Pertemuan ${s.pertemuan_ke}: ${s.status} (${s.tanggal_waktu || 'Belum Dijadwalkan'})`);
    });
  }
}

verify();
