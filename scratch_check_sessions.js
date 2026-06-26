import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env content manually
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

async function checkSessions() {
  console.log("=== MEMULAI ANALISIS KESESUAIAN SESI LATIHAN ===");
  
  // Definisi Paket Pelatihan secara statis
  const pkgMap = new Map([
    ["Paket Mahir", 4],
    ["Paket Terampil", 6],
    ["Paket Basic", 10],
    ["Paket Plus", 11]
  ]);

  console.log("Definisi Paket Pelatihan:");
  pkgMap.forEach((sesi, nama) => {
    console.log(`- ${nama}: ${sesi} sesi`);
  });
  console.log("");

  // 1. Ambil semua siswa
  const { data: students, error: stdErr } = await supabase
    .from('akun_pengguna')
    .select('*')
    .eq('role', 'siswa')
    .order('id', { ascending: true });

  if (stdErr) {
    console.error("Gagal mengambil data siswa:", stdErr.message);
    return;
  }

  // 2. Ambil semua jadwal latihan
  const { data: schedules, error: schedErr } = await supabase
    .from('jadwal_latihan')
    .select('*');

  if (schedErr) {
    console.error("Gagal mengambil data jadwal latihan:", schedErr.message);
    return;
  }

  // Hitung jumlah jadwal per akun_id
  const schedCounts = new Map();
  schedules.forEach(s => {
    schedCounts.set(s.akun_id, (schedCounts.get(s.akun_id) || 0) + 1);
  });

  // 3. Lakukan pencocokan
  let mismatchCount = 0;
  console.log("Hasil Pengecekan per Siswa:");
  students.forEach(s => {
    const expectedFromPkg = pkgMap.get(s.paket);
    const jumlahSesiInAkun = parseInt(s.jumlah_sesi);
    const actualScheduleCount = schedCounts.get(s.id) || 0;

    const isMatchAkunAndPkg = (expectedFromPkg === jumlahSesiInAkun);
    const isMatchAkunAndSched = (jumlahSesiInAkun === actualScheduleCount);

    if (!isMatchAkunAndPkg || !isMatchAkunAndSched) {
      mismatchCount++;
      console.log(`❌ MISMATCH - ID ${s.id}: ${s.nama_lengkap}`);
      console.log(`   * Paket di akun: "${s.paket}" (Seharusnya: ${expectedFromPkg} sesi)`);
      console.log(`   * jumlah_sesi di akun_pengguna: ${jumlahSesiInAkun}`);
      console.log(`   * Jumlah sesi di jadwal_latihan: ${actualScheduleCount}`);
    } else {
      console.log(`✅ MATCH - ID ${s.id}: ${s.nama_lengkap} | Paket: "${s.paket}" | Sesi: ${jumlahSesiInAkun}`);
    }
  });

  console.log("");
  console.log(`=== ANALISIS SELESAI. Total mismatch ditemukan: ${mismatchCount} ===`);
}

checkSessions();
