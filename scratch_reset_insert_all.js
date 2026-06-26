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

// Fungsi untuk membuat nilai bervariasi secara realistis
function getVariedNilai(pertemuanKe, studentId) {
  const baseScores = {
    1: 76,
    2: 78,
    3: 80,
    4: 83,
    5: 82,
    6: 85,
    7: 87,
    8: 89,
    9: 86,
    10: 91,
    11: 88
  };
  // Gunakan ID siswa sebagai bagian dari seed agar konsisten namun unik per siswa
  const seed = (studentId * 7 + pertemuanKe * 13) % 5; // menghasilkan angka 0-4
  const offset = seed - 2; // menghasilkan offset -2, -1, 0, 1, 2
  return baseScores[pertemuanKe] + offset;
}

async function runResetAndInsert() {
  console.log("Mulai membersihkan data siswa lama...");

  // 1. Delete all existing students (ON DELETE CASCADE will clear pendaftaran, jadwal_latihan, etc.)
  const { error: deleteError } = await supabase
    .from('akun_pengguna')
    .delete()
    .eq('role', 'siswa');

  if (deleteError) {
    console.error("Gagal menghapus siswa lama:", deleteError.message);
    return;
  }
  console.log("Data siswa lama berhasil dibersihkan.");

  // 2. Data Siswa yang akan diinput (dimulai dari ID 4)
  const students = [
    {
      id: 4,
      nama_lengkap: "Revan Nabil Ananda",
      username: "revan",
      password: "revan123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Ketinggian",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082169287924",
      tempat_tanggal_lahir: "Payakumbuh, 02 Maret 2026",
      nik: "1234567890123456",
      jumlah_sesi: 11,
      created_at: "2026-03-02T14:00:00+07:00"
    },
    {
      id: 5,
      nama_lengkap: "Muhammad Farzhan",
      username: "farzhan",
      password: "farzhan123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Sawahpadang Dua Koto",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "0895602554138",
      tempat_tanggal_lahir: "Payakumbuh, 02 Maret 2026",
      nik: "1234567890123457",
      jumlah_sesi: 11,
      created_at: "2026-03-02T13:00:00+07:00"
    },
    {
      id: 6,
      nama_lengkap: "Muhammad Ibrahim Ariyanto",
      username: "ibrahim",
      password: "ibrahim123",
      role: "siswa",
      paket: "Paket Mahir",
      price: 1050000,
      paket_id: 1,
      alamat_lengkap: "Jl. Jeruk Labuah Basilang",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082286963622",
      tempat_tanggal_lahir: "Payakumbuh, 11 Maret 2026",
      nik: "1234567890123458",
      jumlah_sesi: 4,
      created_at: "2026-03-11T14:00:00+07:00"
    },
    {
      id: 7,
      nama_lengkap: "Elvina",
      username: "elvina",
      password: "elvina123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Jl. Asoka No.10",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "081363045454",
      tempat_tanggal_lahir: "Payakumbuh, 15 Maret 2026",
      nik: "1234567890123459",
      jumlah_sesi: 11,
      created_at: "2026-03-15T09:00:00+07:00"
    },
    {
      id: 8,
      nama_lengkap: "Farhan Widyan",
      username: "farhan_w",
      password: "farhan123",
      role: "siswa",
      paket: "Paket Terampil",
      price: 1250000,
      paket_id: 2,
      alamat_lengkap: "Situjuah",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082217909160",
      tempat_tanggal_lahir: "Payakumbuh, 18 Maret 2026",
      nik: "1234567890123460",
      jumlah_sesi: 6,
      created_at: "2026-03-18T14:00:00+07:00"
    },
    {
      id: 9,
      nama_lengkap: "Muhammad Fajar",
      username: "fajar",
      password: "fajar123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Sicincin mudik",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "083896613835",
      tempat_tanggal_lahir: "Payakumbuh, 25 Maret 2026",
      nik: "1234567890123461",
      jumlah_sesi: 10,
      created_at: "2026-03-25T09:02:00+07:00"
    },
    {
      id: 10,
      nama_lengkap: "Siska Handayani",
      username: "siska",
      password: "siska123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Bukit Kanduang, Haro Sikabu-kabu",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "089643197799",
      tempat_tanggal_lahir: "Payakumbuh, 06 April 2026",
      nik: "1234567890123462",
      jumlah_sesi: 11,
      created_at: "2026-04-06T09:00:00+07:00"
    },
    {
      id: 11,
      nama_lengkap: "Dzikir Awal Lahfa Utama",
      username: "dzikir",
      password: "dzikir123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Taeh bukit",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "085783503784",
      tempat_tanggal_lahir: "Payakumbuh, 06 April 2026",
      nik: "1234567890123463",
      jumlah_sesi: 10,
      created_at: "2026-04-06T08:00:00+07:00"
    },
    {
      id: 12,
      nama_lengkap: "Erryanto",
      username: "erryanto",
      password: "erryanto123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Lubuak batingkok",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "085264801483",
      tempat_tanggal_lahir: "Payakumbuh, 08 April 2026",
      nik: "1234567890123464",
      jumlah_sesi: 11,
      created_at: "2026-04-08T10:00:00+07:00"
    },
    {
      id: 13,
      nama_lengkap: "Restu Vernados",
      username: "restu",
      password: "restu123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Tanjung Pati",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082170064180",
      tempat_tanggal_lahir: "Payakumbuh, 14 April 2026",
      nik: "1234567890123465",
      jumlah_sesi: 11,
      created_at: "2026-04-14T14:00:00+07:00"
    },
    {
      id: 14,
      nama_lengkap: "M. Fajri Fadillah",
      username: "fajri",
      password: "fajri123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Kel. Padang Alai Bodi",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082268826814",
      tempat_tanggal_lahir: "Payakumbuh, 15 April 2026",
      nik: "1234567890123466",
      jumlah_sesi: 11,
      created_at: "2026-04-15T15:00:00+07:00"
    },
    {
      id: 15,
      nama_lengkap: "Melyawati",
      username: "melyawati",
      password: "melyawati123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Aur Kuning",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "085363930343",
      tempat_tanggal_lahir: "Payakumbuh, 16 April 2026",
      nik: "1234567890123467",
      jumlah_sesi: 11,
      created_at: "2026-04-16T10:00:00+07:00"
    },
    {
      id: 16,
      nama_lengkap: "Adrini Marlena",
      username: "adrini",
      password: "adrini123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Subarang Batuang",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "081374619156",
      tempat_tanggal_lahir: "Payakumbuh, 21 April 2026",
      nik: "1234567890123468",
      jumlah_sesi: 11,
      created_at: "2026-04-21T12:00:00+07:00"
    },
    {
      id: 17,
      nama_lengkap: "Nesa Morena",
      username: "nesa",
      password: "nesa123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Jl. Kalimantan No. 6, Kel. Padangtongah Balainanduo, Koto Nan IV",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "081386632043",
      tempat_tanggal_lahir: "Payakumbuh, 21 April 2026",
      nik: "1234567890123469",
      jumlah_sesi: 10,
      created_at: "2026-04-21T17:00:00+07:00"
    },
    {
      id: 18,
      nama_lengkap: "M. Farhan",
      username: "farhan_m",
      password: "farhan123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Padang Tongah Balai Nan Duo",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "087530008805",
      tempat_tanggal_lahir: "Payakumbuh, 23 April 2026",
      nik: "1234567890123470",
      jumlah_sesi: 11,
      created_at: "2026-04-23T10:00:00+07:00"
    },
    {
      id: 19,
      nama_lengkap: "M. Aditya Agustian",
      username: "aditya",
      password: "aditya123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Taram",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082292669114",
      tempat_tanggal_lahir: "Payakumbuh, 28 April 2026",
      nik: "1234567890123471",
      jumlah_sesi: 11,
      created_at: "2026-04-28T09:00:00+07:00"
    },
    {
      id: 20,
      nama_lengkap: "Arsyada Mecca Rafly",
      username: "arsyada",
      password: "arsyada123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Tanjung Gadang",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "081352597362",
      tempat_tanggal_lahir: "Payakumbuh, 30 April 2026",
      nik: "1234567890123472",
      jumlah_sesi: 11,
      created_at: "2026-04-30T09:00:00+07:00"
    },
    {
      id: 21,
      nama_lengkap: "Zair Luthfi Farez",
      username: "zair",
      password: "zair123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Padang Alai Bodi",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082364452207",
      tempat_tanggal_lahir: "Payakumbuh, 02 Mei 2026",
      nik: "1234567890123473",
      jumlah_sesi: 11,
      created_at: "2026-05-02T09:00:00+07:00"
    },
    {
      id: 22,
      nama_lengkap: "Andrea Nersa Putra",
      username: "andrea",
      password: "andrea123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Batang Tabik",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "087899400500",
      tempat_tanggal_lahir: "Payakumbuh, 04 Mei 2026",
      nik: "1234567890123474",
      jumlah_sesi: 11,
      created_at: "2026-05-04T10:00:00+07:00"
    },
    {
      id: 23,
      nama_lengkap: "Maikul Fadri",
      username: "maikul",
      password: "maikul123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Andaleh",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082173213036",
      tempat_tanggal_lahir: "Payakumbuh, 15 Mei 2026",
      nik: "1234567890123475",
      jumlah_sesi: 11,
      created_at: "2026-05-15T10:00:00+07:00"
    },
    {
      id: 24,
      nama_lengkap: "Abdul Azmil Alfikri",
      username: "abdul",
      password: "abdul123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Tarok Andaleh",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "085837075565",
      tempat_tanggal_lahir: "Payakumbuh, 09 Mei 2026",
      nik: "1234567890123476",
      jumlah_sesi: 11,
      created_at: "2026-05-09T11:00:00+07:00"
    },
    {
      id: 25,
      nama_lengkap: "Rahma Khairunnisa",
      username: "rahma",
      password: "rahma123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Nan Kodok",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "081267775967",
      tempat_tanggal_lahir: "Payakumbuh, 06 Mei 2026",
      nik: "1234567890123477",
      jumlah_sesi: 11,
      created_at: "2026-05-06T14:00:00+07:00"
    },
    {
      id: 26,
      nama_lengkap: "Abdi Ghifari Al Haqqi",
      username: "abdi",
      password: "abdi123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Simalanggang",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "082169119925",
      tempat_tanggal_lahir: "Payakumbuh, 11 Mei 2026",
      nik: "1234567890123478",
      jumlah_sesi: 10,
      created_at: "2026-05-11T13:00:00+07:00"
    },
    {
      id: 27,
      nama_lengkap: "Edwar",
      username: "edwar",
      password: "edwar123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Tanjung Gadang",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "085265373589",
      tempat_tanggal_lahir: "Payakumbuh, 13 Mei 2026",
      nik: "1234567890123479",
      jumlah_sesi: 11,
      created_at: "2026-05-13T11:00:00+07:00"
    },
    {
      id: 28,
      nama_lengkap: "Stivany Many",
      username: "stivany",
      password: "stivany123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Bulakan Balai Kandi",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "082388011334",
      tempat_tanggal_lahir: "Payakumbuh, 14 Mei 2026",
      nik: "1234567890123480",
      jumlah_sesi: 10,
      created_at: "2026-05-14T08:00:00+07:00"
    },
    {
      id: 29,
      nama_lengkap: "Dzaky",
      username: "dzaky",
      password: "dzaky123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Payobasung",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "089518250758",
      tempat_tanggal_lahir: "Payakumbuh, 18 Mei 2026",
      nik: "1234567890123481",
      jumlah_sesi: 10,
      created_at: "2026-05-18T12:00:00+07:00"
    },
    {
      id: 30,
      nama_lengkap: "Rohmad Karim",
      username: "rohmad",
      password: "rohmad123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Kota Baru Balai Janggo",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "087803273783",
      tempat_tanggal_lahir: "Payakumbuh, 22 Mei 2026",
      nik: "1234567890123482",
      jumlah_sesi: 11,
      created_at: "2026-05-22T10:25:00+07:00"
    },
    {
      id: 31,
      nama_lengkap: "Alvrindo Fernando",
      username: "alvrindo",
      password: "alvrindo123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Sungai Tarab",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "081262954532",
      tempat_tanggal_lahir: "Payakumbuh, 23 Mei 2026",
      nik: "1234567890123483",
      jumlah_sesi: 10,
      created_at: "2026-05-23T16:00:00+07:00"
    },
    {
      id: 32,
      nama_lengkap: "Khoyrin Al Ani Pasya",
      username: "khoyrin",
      password: "khoyrin123",
      role: "siswa",
      paket: "Paket Basic",
      price: 1550000,
      paket_id: 3,
      alamat_lengkap: "Padang Alai Bodi",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "082218442747",
      tempat_tanggal_lahir: "Payakumbuh, 08 Juni 2026",
      nik: "1234567890123484",
      jumlah_sesi: 10,
      created_at: "2026-06-08T09:00:00+07:00"
    },
    {
      id: 33,
      nama_lengkap: "Zahara Rahmatul Irsya",
      username: "zahara",
      password: "zahara123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Jl. riau",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "089505662641",
      tempat_tanggal_lahir: "Payakumbuh, 11 Juni 2026",
      nik: "1234567890123485",
      jumlah_sesi: 11,
      created_at: "2026-06-11T11:00:00+07:00"
    },
    {
      id: 34,
      nama_lengkap: "Ahmad Zikro",
      username: "ahmad",
      password: "ahmad123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Pulutan",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "085278948579",
      tempat_tanggal_lahir: "Payakumbuh, 13 Juni 2026",
      nik: "1234567890123486",
      jumlah_sesi: 11,
      created_at: "2026-06-13T10:00:00+07:00"
    },
    {
      id: 35,
      nama_lengkap: "Ren Ilfo Hafizco",
      username: "ren",
      password: "ren123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Pulai",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "0895411001677",
      tempat_tanggal_lahir: "Payakumbuh, 17 Juni 2026",
      nik: "1234567890123487",
      jumlah_sesi: 11,
      created_at: "2026-06-17T10:00:00+07:00"
    },
    {
      id: 36,
      nama_lengkap: "Azzura Qotrun Nada",
      username: "azzura",
      password: "azzura123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Ibuh",
      jenis_kelamin: "Perempuan",
      no_whatsapp: "083813040337",
      tempat_tanggal_lahir: "Payakumbuh, 23 Juni 2026",
      nik: "1234567890123488",
      jumlah_sesi: 11,
      created_at: "2026-06-23T09:00:00+07:00"
    },
    {
      id: 37,
      nama_lengkap: "Fadel Muhammad",
      username: "fadel",
      password: "fadel123",
      role: "siswa",
      paket: "Paket Plus",
      price: 1650000,
      paket_id: 4,
      alamat_lengkap: "Kel. Talam, Kec. Payakumbuh Barat",
      jenis_kelamin: "Laki-laki",
      no_whatsapp: "081275572800",
      tempat_tanggal_lahir: "Payakumbuh, 23 Juni 2026",
      nik: "1234567890123489",
      jumlah_sesi: 11,
      created_at: "2026-06-23T12:00:00+07:00"
    }
  ];

  // Insert Akun Pengguna
  console.log("Memasukkan akun pengguna siswa...");
  const { error: userError } = await supabase
    .from('akun_pengguna')
    .insert(students);

  if (userError) {
    console.error("Gagal memasukkan akun pengguna:", userError.message);
    return;
  }
  console.log("Akun pengguna berhasil dimasukkan.");

  // 3. Data Pendaftaran (dimulai dari ID 1)
  const registrations = [
    {
      id: 1,
      akun_id: 4,
      nama_lengkap: "Revan Nabil Ananda",
      nik: "1234567890123456",
      tempat_tanggal_lahir: "Payakumbuh, 02 Maret 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Ketinggian",
      no_whatsapp: "082169287924",
      paket_pilihan: "Paket Plus",
      total_bayar: 1000000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-03-02T14:00:00+07:00"
    },
    {
      id: 2,
      akun_id: 5,
      nama_lengkap: "Muhammad Farzhan",
      nik: "1234567890123457",
      tempat_tanggal_lahir: "Payakumbuh, 02 Maret 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Sawahpadang Dua Koto",
      no_whatsapp: "0895602554138",
      paket_pilihan: "Paket Plus",
      total_bayar: 1000000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-03-02T13:00:00+07:00"
    },
    {
      id: 3,
      akun_id: 6,
      nama_lengkap: "Muhammad Ibrahim Ariyanto",
      nik: "1234567890123458",
      tempat_tanggal_lahir: "Payakumbuh, 11 Maret 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Jl. Jeruk Labuah Basilang",
      no_whatsapp: "082286963622",
      paket_pilihan: "Paket Mahir",
      total_bayar: 1050000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-03-11T14:00:00+07:00"
    },
    {
      id: 4,
      akun_id: 7,
      nama_lengkap: "Elvina",
      nik: "1234567890123459",
      tempat_tanggal_lahir: "Payakumbuh, 15 Maret 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Jl. Asoka No.10",
      no_whatsapp: "081363045454",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-03-15T09:00:00+07:00"
    },
    {
      id: 5,
      akun_id: 8,
      nama_lengkap: "Farhan Widyan",
      nik: "1234567890123460",
      tempat_tanggal_lahir: "Payakumbuh, 18 Maret 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Situjuah",
      no_whatsapp: "082217909160",
      paket_pilihan: "Paket Terampil",
      total_bayar: 1250000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-03-18T14:00:00+07:00"
    },
    {
      id: 6,
      akun_id: 9,
      nama_lengkap: "Muhammad Fajar",
      nik: "1234567890123461",
      tempat_tanggal_lahir: "Payakumbuh, 25 Maret 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Sicincin mudik",
      no_whatsapp: "083896613835",
      paket_pilihan: "Paket Basic",
      total_bayar: 1550000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-03-25T09:02:00+07:00"
    },
    {
      id: 7,
      akun_id: 10,
      nama_lengkap: "Siska Handayani",
      nik: "1234567890123462",
      tempat_tanggal_lahir: "Payakumbuh, 06 April 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Bukit Kanduang, Haro Sikabu-kabu",
      no_whatsapp: "089643197799",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-06T09:00:00+07:00"
    },
    {
      id: 8,
      akun_id: 11,
      nama_lengkap: "Dzikir Awal Lahfa Utama",
      nik: "1234567890123463",
      tempat_tanggal_lahir: "Payakumbuh, 06 April 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Taeh bukit",
      no_whatsapp: "085783503784",
      paket_pilihan: "Paket Basic",
      total_bayar: 1550000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-06T08:00:00+07:00"
    },
    {
      id: 9,
      akun_id: 12,
      nama_lengkap: "Erryanto",
      nik: "1234567890123464",
      tempat_tanggal_lahir: "Payakumbuh, 08 April 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Lubuak batingkok",
      no_whatsapp: "085264801483",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-08T10:00:00+07:00"
    },
    {
      id: 10,
      akun_id: 13,
      nama_lengkap: "Restu Vernados",
      nik: "1234567890123465",
      tempat_tanggal_lahir: "Payakumbuh, 14 April 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Tanjung Pati",
      no_whatsapp: "082170064180",
      paket_pilihan: "Paket Plus",
      total_bayar: 1400000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-14T14:00:00+07:00"
    },
    {
      id: 11,
      akun_id: 14,
      nama_lengkap: "M. Fajri Fadillah",
      nik: "1234567890123466",
      tempat_tanggal_lahir: "Payakumbuh, 15 April 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Kel. Padang Alai Bodi",
      no_whatsapp: "082268826814",
      paket_pilihan: "Paket Plus",
      total_bayar: 2000000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-15T15:00:00+07:00"
    },
    {
      id: 12,
      akun_id: 15,
      nama_lengkap: "Melyawati",
      nik: "1234567890123467",
      tempat_tanggal_lahir: "Payakumbuh, 16 April 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Aur Kuning",
      no_whatsapp: "085363930343",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-16T10:00:00+07:00"
    },
    {
      id: 13,
      akun_id: 16,
      nama_lengkap: "Adrini Marlena",
      nik: "1234567890123468",
      tempat_tanggal_lahir: "Payakumbuh, 21 April 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Subarang Batuang",
      no_whatsapp: "081374619156",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-21T12:00:00+07:00"
    },
    {
      id: 14,
      akun_id: 17,
      nama_lengkap: "Nesa Morena",
      nik: "1234567890123469",
      tempat_tanggal_lahir: "Payakumbuh, 21 April 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Jl. Kalimantan No. 6, Kel. Padangtongah Balainanduo, Koto Nan IV",
      no_whatsapp: "081386632043",
      paket_pilihan: "Paket Basic",
      total_bayar: 1550000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-21T17:00:00+07:00"
    },
    {
      id: 15,
      akun_id: 18,
      nama_lengkap: "M. Farhan",
      nik: "1234567890123470",
      tempat_tanggal_lahir: "Payakumbuh, 23 April 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Padang Tongah Balai Nan Duo",
      no_whatsapp: "087530008805",
      paket_pilihan: "Paket Plus",
      total_bayar: 950000, // Uang Kursus: 950.000 (Lunas)
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-23T10:00:00+07:00"
    },
    {
      id: 16,
      akun_id: 19,
      nama_lengkap: "M. Aditya Agustian",
      nik: "1234567890123471",
      tempat_tanggal_lahir: "Payakumbuh, 28 April 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Taram",
      no_whatsapp: "082292669114",
      paket_pilihan: "Paket Plus",
      total_bayar: 500000, // Uang Kursus: Rp 500.000
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-28T09:00:00+07:00"
    },
    {
      id: 17,
      akun_id: 20,
      nama_lengkap: "Arsyada Mecca Rafly",
      nik: "1234567890123472",
      tempat_tanggal_lahir: "Payakumbuh, 30 April 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Tanjung Gadang",
      no_whatsapp: "081352597362",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000, // Uang Kursus: Rp 1.650.000 (Lunas)
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-04-30T09:00:00+07:00"
    },
    {
      id: 18,
      akun_id: 21,
      nama_lengkap: "Zair Luthfi Farez",
      nik: "1234567890123473",
      tempat_tanggal_lahir: "Payakumbuh, 02 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Padang Alai Bodi",
      no_whatsapp: "082364452207",
      paket_pilihan: "Paket Plus",
      total_bayar: 500000, // Uang Kursus: Rp 500.000 (DP)
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-02T09:00:00+07:00"
    },
    {
      id: 19,
      akun_id: 22,
      nama_lengkap: "Andrea Nersa Putra",
      nik: "1234567890123474",
      tempat_tanggal_lahir: "Payakumbuh, 04 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Batang Tabik",
      no_whatsapp: "087899400500",
      paket_pilihan: "Paket Plus",
      total_bayar: 1150000, // Uang Kursus: Rp 650.000 + Rp 500.000
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-04T10:00:00+07:00"
    },
    {
      id: 20,
      akun_id: 23,
      nama_lengkap: "Maikul Fadri",
      nik: "1234567890123475",
      tempat_tanggal_lahir: "Payakumbuh, 15 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Andaleh",
      no_whatsapp: "082173213036",
      paket_pilihan: "Paket Plus",
      total_bayar: 1050000, // Uang Kursus: Rp 550.000 + Rp 500.000
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-15T10:00:00+07:00"
    },
    {
      id: 21,
      akun_id: 24,
      nama_lengkap: "Abdul Azmil Alfikri",
      nik: "1234567890123476",
      tempat_tanggal_lahir: "Payakumbuh, 09 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Tarok Andaleh",
      no_whatsapp: "085837075565",
      paket_pilihan: "Paket Plus",
      total_bayar: 1550000, // Uang Kursus: Rp 550.000 + Rp 500.000 + Rp 500.000
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-09T11:00:00+07:00"
    },
    {
      id: 22,
      akun_id: 25,
      nama_lengkap: "Rahma Khairunnisa",
      nik: "1234567890123477",
      tempat_tanggal_lahir: "Payakumbuh, 06 Mei 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Nan Kodok",
      no_whatsapp: "081267775967",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000, // Uang Kursus: Rp 1.650.000 (Lunas)
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-06T14:00:00+07:00"
    },
    {
      id: 23,
      akun_id: 26,
      nama_lengkap: "Abdi Ghifari Al Haqqi",
      nik: "1234567890123478",
      tempat_tanggal_lahir: "Payakumbuh, 11 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Simalanggang",
      no_whatsapp: "082169119925",
      paket_pilihan: "Paket Basic",
      total_bayar: 1550000, // Uang Kursus: Rp 550.000 + Rp 500.000 + Rp 500.000 (Lunas)
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-11T13:00:00+07:00"
    },
    {
      id: 24,
      akun_id: 27,
      nama_lengkap: "Edwar",
      nik: "1234567890123479",
      tempat_tanggal_lahir: "Payakumbuh, 13 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Tanjung Gadang",
      no_whatsapp: "085265373589",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000, // Uang Kursus: Rp 1.650.000 (Lunas)
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-13T11:00:00+07:00"
    },
    {
      id: 25,
      akun_id: 28,
      nama_lengkap: "Stivany Many",
      nik: "1234567890123480",
      tempat_tanggal_lahir: "Payakumbuh, 14 Mei 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Bulakan Balai Kandi",
      no_whatsapp: "082388011334",
      paket_pilihan: "Paket Basic",
      total_bayar: 550000, // Uang Kursus: Rp 550.000
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-14T08:00:00+07:00"
    },
    {
      id: 26,
      akun_id: 29,
      nama_lengkap: "Dzaky",
      nik: "1234567890123481",
      tempat_tanggal_lahir: "Payakumbuh, 18 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Payobasung",
      no_whatsapp: "089518250758",
      paket_pilihan: "Paket Basic",
      total_bayar: 500000, // Uang Kursus: Rp 500.000
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-18T12:00:00+07:00"
    },
    {
      id: 27,
      akun_id: 30,
      nama_lengkap: "Rohmad Karim",
      nik: "1234567890123482",
      tempat_tanggal_lahir: "Payakumbuh, 22 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Kota Baru Balai Janggo",
      no_whatsapp: "087803273783",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000, // Uang Kursus: Lunas
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-22T10:25:00+07:00"
    },
    {
      id: 28,
      akun_id: 31,
      nama_lengkap: "Alvrindo Fernando",
      nik: "1234567890123483",
      tempat_tanggal_lahir: "Payakumbuh, 23 Mei 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Sungai Tarab",
      no_whatsapp: "081262954532",
      paket_pilihan: "Paket Basic",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-05-23T16:00:00+07:00"
    },
    {
      id: 29,
      akun_id: 32,
      nama_lengkap: "Khoyrin Al Ani Pasya",
      nik: "1234567890123484",
      tempat_tanggal_lahir: "Payakumbuh, 08 Juni 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Padang Alai Bodi",
      no_whatsapp: "082218442747",
      paket_pilihan: "Paket Basic",
      total_bayar: 1500000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-06-08T09:00:00+07:00"
    },
    {
      id: 30,
      akun_id: 33,
      nama_lengkap: "Zahara Rahmatul Irsya",
      nik: "1234567890123485",
      tempat_tanggal_lahir: "Payakumbuh, 11 Juni 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Jl. riau",
      no_whatsapp: "089505662641",
      paket_pilihan: "Paket Plus",
      total_bayar: 1500000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-06-11T11:00:00+07:00"
    },
    {
      id: 31,
      akun_id: 34,
      nama_lengkap: "Ahmad Zikro",
      nik: "1234567890123486",
      tempat_tanggal_lahir: "Payakumbuh, 13 Juni 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Pulutan",
      no_whatsapp: "085278948579",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-06-13T10:00:00+07:00"
    },
    {
      id: 32,
      akun_id: 35,
      nama_lengkap: "Ren Ilfo Hafizco",
      nik: "1234567890123487",
      tempat_tanggal_lahir: "Payakumbuh, 17 Juni 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Pulai",
      no_whatsapp: "0895411001677",
      paket_pilihan: "Paket Plus",
      total_bayar: 1650000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-06-17T10:00:00+07:00"
    },
    {
      id: 33,
      akun_id: 36,
      nama_lengkap: "Azzura Qotrun Nada",
      nik: "1234567890123488",
      tempat_tanggal_lahir: "Payakumbuh, 23 Juni 2026",
      jenis_kelamin: "Perempuan",
      alamat_domisili: "Ibuh",
      no_whatsapp: "083813040337",
      paket_pilihan: "Paket Plus",
      total_bayar: 1000000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-06-23T09:00:00+07:00"
    },
    {
      id: 34,
      akun_id: 37,
      nama_lengkap: "Fadel Muhammad",
      nik: "1234567890123489",
      tempat_tanggal_lahir: "Payakumbuh, 23 Juni 2026",
      jenis_kelamin: "Laki-laki",
      alamat_domisili: "Kel. Talam, Kec. Payakumbuh Barat",
      no_whatsapp: "081275572800",
      paket_pilihan: "Paket Plus",
      total_bayar: 500000,
      bukti_transfer_url: "manual_input_receipt.jpg",
      status: "Berhasil",
      created_at: "2026-06-23T12:00:00+07:00"
    }
  ];

  console.log("Memasukkan data pendaftaran...");
  const { error: pendaftaranError } = await supabase
    .from('pendaftaran')
    .insert(registrations);

  if (pendaftaranError) {
    console.error("Gagal memasukkan data pendaftaran:", pendaftaranError.message);
    return;
  }
  console.log("Data pendaftaran berhasil dimasukkan.");

  // 4. Data Jadwal Latihan (dimulai dari ID 1)
  const schedules = [];
  let scheduleIdCounter = 1;

  // Revan (akun_id: 4) - P1 s.d P9 selesai (Jam 14.00)
  const revanDates = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-07", "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-13", "2026-03-15"];
  revanDates.forEach((tgl, index) => {
    const ke = index + 1;
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 4,
      instruktur_id: 2,
      kurikulum_id: ke,
      tanggal_waktu: `${tgl}T14:00:00+07:00`,
      pertemuan_ke: ke,
      status: "Selesai",
      nilai: getVariedNilai(ke, 4),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 10 & 11 (Belum Dijadwalkan)
  for (let i = 10; i <= 11; i++) {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 4,
      instruktur_id: null,
      kurikulum_id: i,
      tanggal_waktu: null,
      pertemuan_ke: i,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  }

  // Farzhan (akun_id: 5) - P1 s.d P11 selesai (Jam 13.00)
  const farzhanDates = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-07", "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-13", "2026-03-15", "2026-03-16", "2026-03-18"];
  farzhanDates.forEach((tgl, index) => {
    const ke = index + 1;
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 5,
      instruktur_id: 2,
      kurikulum_id: ke,
      tanggal_waktu: `${tgl}T13:00:00+07:00`,
      pertemuan_ke: ke,
      status: "Selesai",
      nilai: getVariedNilai(ke, 5),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Ibrahim (akun_id: 6) - P1, 6, 10, 11 selesai (Jam 14.00)
  const ibrahimSesi = [
    { ke: 1, kurId: 1, tgl: "2026-03-11" },
    { ke: 6, kurId: 6, tgl: "2026-03-12" },
    { ke: 10, kurId: 10, tgl: "2026-03-13" },
    { ke: 11, kurId: 11, tgl: "2026-03-14" }
  ];
  ibrahimSesi.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 6,
      instruktur_id: 2,
      kurikulum_id: p.kurId,
      tanggal_waktu: `${p.tgl}T14:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 6),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Elvina (akun_id: 7) - P1 s.d P11 selesai (Jam 09.00)
  const elvinaDates = ["2026-03-15", "2026-03-16", "2026-03-17", "2026-03-18", "2026-03-25", "2026-03-26", "2026-03-27", "2026-03-28", "2026-04-01", "2026-04-02", "2026-03-29"];
  elvinaDates.forEach((tgl, index) => {
    const ke = index + 1;
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 7,
      instruktur_id: 2,
      kurikulum_id: ke,
      tanggal_waktu: `${tgl}T09:00:00+07:00`,
      pertemuan_ke: ke,
      status: "Selesai",
      nilai: getVariedNilai(ke, 7),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Farhan Widyan (akun_id: 8) - P1, 6, 7, 8, 10, 11 selesai (Jam 14.00)
  const farhanWSesi = [
    { ke: 1, kurId: 1, tgl: "2026-03-18" },
    { ke: 6, kurId: 6, tgl: "2026-03-19" },
    { ke: 7, kurId: 7, tgl: "2026-03-20" },
    { ke: 8, kurId: 8, tgl: "2026-03-21" },
    { ke: 10, kurId: 10, tgl: "2026-03-22" },
    { ke: 11, kurId: 11, tgl: "2026-03-23" }
  ];
  farhanWSesi.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 8,
      instruktur_id: 2,
      kurikulum_id: p.kurId,
      tanggal_waktu: `${p.tgl}T14:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 8),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Muhammad Fajar (akun_id: 9) - P1 s.d P9, dan P11 selesai (Jam 09.02)
  const fajarSesi = [
    { ke: 1, kurId: 1, tgl: "2026-03-25" },
    { ke: 2, kurId: 2, tgl: "2026-03-26" },
    { ke: 3, kurId: 3, tgl: "2026-03-27" },
    { ke: 4, kurId: 4, tgl: "2026-03-28" },
    { ke: 5, kurId: 5, tgl: "2026-03-29" },
    { ke: 6, kurId: 6, tgl: "2026-03-30" },
    { ke: 7, kurId: 7, tgl: "2026-03-31" },
    { ke: 8, kurId: 8, tgl: "2026-04-01" },
    { ke: 9, kurId: 9, tgl: "2026-04-02" },
    { ke: 11, kurId: 11, tgl: "2026-04-03" }
  ];
  fajarSesi.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 9,
      instruktur_id: 2,
      kurikulum_id: p.kurId,
      tanggal_waktu: `${p.tgl}T09:02:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 9),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Siska Handayani (akun_id: 10) - P1 s.d P11 selesai (Jam 09.00)
  const siskaDates = [
    { ke: 1, tgl: "2026-04-06" },
    { ke: 2, tgl: "2026-04-07" },
    { ke: 3, tgl: "2026-04-08" },
    { ke: 4, tgl: "2026-04-09" },
    { ke: 5, tgl: "2026-04-10" },
    { ke: 6, tgl: "2026-04-11" },
    { ke: 7, tgl: "2026-04-13" },
    { ke: 8, tgl: "2026-04-14" },
    { ke: 9, tgl: "2026-04-15" },
    { ke: 10, tgl: "2026-04-16" },
    { ke: 11, tgl: "2026-04-17" }
  ];
  siskaDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 10,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T09:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 10),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Dzikir Awal Lahfa Utama (akun_id: 11) - P1 s.d P8 selesai (Jam 08.00)
  const dzikirSesi = [
    { ke: 1, kurId: 1, tgl: "2026-04-06" },
    { ke: 2, kurId: 2, tgl: "2026-04-07" },
    { ke: 3, kurId: 3, tgl: "2026-04-08" },
    { ke: 4, kurId: 4, tgl: "2026-04-09" },
    { ke: 5, kurId: 5, tgl: "2026-04-09" },
    { ke: 6, kurId: 6, tgl: "2026-04-10" },
    { ke: 7, kurId: 7, tgl: "2026-04-10" },
    { ke: 8, kurId: 8, tgl: "2026-04-11" }
  ];
  dzikirSesi.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 11,
      instruktur_id: 2,
      kurikulum_id: p.kurId,
      tanggal_waktu: `${p.tgl}T08:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 11),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 9 & 10 (Belum Dijadwalkan)
  for (let i = 9; i <= 10; i++) {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 11,
      instruktur_id: null,
      kurikulum_id: i,
      tanggal_waktu: null,
      pertemuan_ke: i,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  }

  // Erryanto (akun_id: 12) - P1 s.d P11 selesai (Jam 10.00)
  const erryantoDates = [
    { ke: 1, tgl: "2026-04-08" },
    { ke: 2, tgl: "2026-04-09" },
    { ke: 3, tgl: "2026-04-10" },
    { ke: 4, tgl: "2026-04-11" },
    { ke: 5, tgl: "2026-04-13" },
    { ke: 6, tgl: "2026-04-14" },
    { ke: 7, tgl: "2026-04-15" },
    { ke: 8, tgl: "2026-04-16" },
    { ke: 9, tgl: "2026-04-17" },
    { ke: 10, tgl: "2026-04-18" },
    { ke: 11, tgl: "2026-04-20" }
  ];
  erryantoDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 12,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 12),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Restu Vernados (akun_id: 13) - P1 s.d P11 selesai (Jam 14.00)
  const restuDates = [
    { ke: 1, tgl: "2026-04-14" },
    { ke: 2, tgl: "2026-04-15" },
    { ke: 3, tgl: "2026-04-16" },
    { ke: 4, tgl: "2026-04-17" },
    { ke: 5, tgl: "2026-04-20" },
    { ke: 6, tgl: "2026-04-21" },
    { ke: 7, tgl: "2026-04-22" },
    { ke: 8, tgl: "2026-04-25" },
    { ke: 9, tgl: "2026-04-28" },
    { ke: 10, tgl: "2026-04-29" },
    { ke: 11, tgl: "2026-05-03" }
  ];
  restuDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 13,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T14:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 13),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // M. Fajri Fadillah (akun_id: 14) - P1 s.d P11 selesai (Jam 15.00)
  const fajriDates = [
    { ke: 1, tgl: "2026-04-15" },
    { ke: 2, tgl: "2026-04-16" },
    { ke: 3, tgl: "2026-04-17" },
    { ke: 4, tgl: "2026-04-18" },
    { ke: 5, tgl: "2026-04-20" },
    { ke: 6, tgl: "2026-04-21" },
    { ke: 7, tgl: "2026-04-23" },
    { ke: 8, tgl: "2026-04-24" },
    { ke: 9, tgl: "2026-04-25" },
    { ke: 10, tgl: "2026-04-27" },
    { ke: 11, tgl: "2026-05-02" }
  ];
  fajriDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 14,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T15:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 14),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Melyawati (akun_id: 15) - P1 s.d P11 selesai (Jam 10.00)
  const melyawatiDates = [
    { ke: 1, tgl: "2026-04-16" },
    { ke: 2, tgl: "2026-04-17" },
    { ke: 3, tgl: "2026-04-18" },
    { ke: 4, tgl: "2026-04-20" },
    { ke: 5, tgl: "2026-04-21" },
    { ke: 6, tgl: "2026-04-22" },
    { ke: 7, tgl: "2026-04-23" },
    { ke: 8, tgl: "2026-04-24" },
    { ke: 9, tgl: "2026-04-25" },
    { ke: 10, tgl: "2026-04-27" },
    { ke: 11, tgl: "2026-04-28" }
  ];
  melyawatiDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 15,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 15),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Adrini Marlena (akun_id: 16) - P1 s.d P11 selesai (Jam 12.00)
  const adriniDates = [
    { ke: 1, tgl: "2026-04-21" },
    { ke: 2, tgl: "2026-04-22" },
    { ke: 3, tgl: "2026-04-23" },
    { ke: 4, tgl: "2026-04-25" },
    { ke: 5, tgl: "2026-04-27" },
    { ke: 6, tgl: "2026-04-28" },
    { ke: 7, tgl: "2026-04-29" },
    { ke: 8, tgl: "2026-04-30" },
    { ke: 9, tgl: "2026-05-04" },
    { ke: 10, tgl: "2026-05-05" },
    { ke: 11, tgl: "2026-05-10" }
  ];
  adriniDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 16,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T12:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 16),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Nesa Morena (akun_id: 17) - P1 s.d P8 selesai (Jam 17.00)
  const nesaDates = [
    { ke: 1, tgl: "2026-04-21" },
    { ke: 2, tgl: "2026-04-22" },
    { ke: 3, tgl: "2026-04-23" },
    { ke: 4, tgl: "2026-04-24" },
    { ke: 5, tgl: "2026-04-25" },
    { ke: 6, tgl: "2026-04-27" },
    { ke: 7, tgl: "2026-04-28" },
    { ke: 8, tgl: "2026-04-29" }
  ];
  nesaDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 17,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T17:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 17),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 9 & 10 (Belum Dijadwalkan)
  for (let i = 9; i <= 10; i++) {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 17,
      instruktur_id: null,
      kurikulum_id: i,
      tanggal_waktu: null,
      pertemuan_ke: i,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  }

  // M. Farhan (akun_id: 18) - P1 s.d P11 selesai (Jam 10.00)
  const farhanDates = [
    { ke: 1, tgl: "2026-04-23" },
    { ke: 2, tgl: "2026-04-24" },
    { ke: 3, tgl: "2026-04-25" },
    { ke: 4, tgl: "2026-04-30" },
    { ke: 5, tgl: "2026-05-01" },
    { ke: 6, tgl: "2026-05-02" },
    { ke: 7, tgl: "2026-05-07" },
    { ke: 8, tgl: "2026-05-08" },
    { ke: 9, tgl: "2026-05-14" },
    { ke: 10, tgl: "2026-05-15" },
    { ke: 11, tgl: "2026-05-22" }
  ];
  farhanDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 18,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 18),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // M. Aditya Agustian (akun_id: 19) - Sesi P1, P2, P6, P8, P11 selesai (Jam 09.00)
  const adityaSesi = [
    { ke: 1, kurId: 1, tgl: "2026-04-28" },
    { ke: 2, kurId: 2, tgl: "2026-04-29" },
    { ke: 6, kurId: 6, tgl: "2026-04-30" },
    { ke: 8, kurId: 8, tgl: "2026-05-01" },
    { ke: 11, kurId: 11, tgl: "2026-05-14" }
  ];
  adityaSesi.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 19,
      instruktur_id: 2,
      kurikulum_id: p.kurId,
      tanggal_waktu: `${p.tgl}T09:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 19),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Sesi sisa (Belum Dijadwalkan)
  const adityaRemaining = [3, 4, 5, 7, 9, 10];
  adityaRemaining.forEach(ke => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 19,
      instruktur_id: null,
      kurikulum_id: ke,
      tanggal_waktu: null,
      pertemuan_ke: ke,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  });

  // Arsyada Mecca Rafly (akun_id: 20) - P1 s.d P11 selesai (Jam 09.00)
  const arsyadaDates = [
    { ke: 1, tgl: "2026-04-30" },
    { ke: 2, tgl: "2026-05-01" },
    { ke: 3, tgl: "2026-05-02" },
    { ke: 4, tgl: "2026-05-04" },
    { ke: 5, tgl: "2026-05-05" },
    { ke: 6, tgl: "2026-05-07" },
    { ke: 7, tgl: "2026-05-08" },
    { ke: 8, tgl: "2026-05-10" },
    { ke: 9, tgl: "2026-05-12" },
    { ke: 10, tgl: "2026-05-13" },
    { ke: 11, tgl: "2026-05-16" }
  ];
  arsyadaDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 20,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T09:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 20),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Zair Luthfi Farez (akun_id: 21) - Sesi P1, P2, P6, P7, P8 selesai (Jam 09.00)
  const zairSesi = [
    { ke: 1, kurId: 1, tgl: "2026-05-03" },
    { ke: 2, kurId: 2, tgl: "2026-05-06" },
    { ke: 6, kurId: 6, tgl: "2026-05-13" },
    { ke: 7, kurId: 7, tgl: "2026-05-31" },
    { ke: 8, kurId: 8, tgl: "2026-06-02" }
  ];
  zairSesi.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 21,
      instruktur_id: 2,
      kurikulum_id: p.kurId,
      tanggal_waktu: `${p.tgl}T09:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 21),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Sesi sisa (Belum Dijadwalkan)
  const zairRemaining = [3, 4, 5, 9, 10, 11];
  zairRemaining.forEach(ke => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 21,
      instruktur_id: null,
      kurikulum_id: ke,
      tanggal_waktu: null,
      pertemuan_ke: ke,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  });

  // Andrea Nersa Putra (akun_id: 22) - P1 s.d P11 selesai (Jam 10.00)
  const andreaDates = [
    { ke: 1, tgl: "2026-05-04" },
    { ke: 2, tgl: "2026-05-05" },
    { ke: 3, tgl: "2026-05-06" },
    { ke: 4, tgl: "2026-05-07" },
    { ke: 5, tgl: "2026-05-08" },
    { ke: 6, tgl: "2026-05-10" },
    { ke: 7, tgl: "2026-05-11" },
    { ke: 8, tgl: "2026-05-12" },
    { ke: 9, tgl: "2026-05-13" },
    { ke: 10, tgl: "2026-05-14" },
    { ke: 11, tgl: "2026-05-15" } // Tanggal kosong di lembar absensi tapi bertandatangan, diasumsikan tgl 15 Mei 2026
  ];
  andreaDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 22,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 22),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Maikul Fadri (akun_id: 23) - P1 s.d P11 selesai (Jam 10.00)
  const maikulDates = [
    { ke: 1, tgl: "2026-05-15" },
    { ke: 2, tgl: "2026-05-17" },
    { ke: 3, tgl: "2026-05-18" },
    { ke: 4, tgl: "2026-05-19" },
    { ke: 5, tgl: "2026-05-20" },
    { ke: 6, tgl: "2026-05-21" },
    { ke: 7, tgl: "2026-05-29" },
    { ke: 8, tgl: "2026-06-02" },
    { ke: 9, tgl: "2026-06-03" },
    { ke: 10, tgl: "2026-06-04" },
    { ke: 11, tgl: "2026-06-08" }
  ];
  maikulDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 23,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 23),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Abdul Azmil Alfikri (akun_id: 24) - P1 s.d P11 selesai (Jam 11.00)
  const abdulDates = [
    { ke: 1, tgl: "2026-05-15" },
    { ke: 2, tgl: "2026-05-17" },
    { ke: 3, tgl: "2026-05-18" },
    { ke: 4, tgl: "2026-05-19" },
    { ke: 5, tgl: "2026-05-20" },
    { ke: 6, tgl: "2026-05-21" },
    { ke: 7, tgl: "2026-05-23" },
    { ke: 8, tgl: "2026-05-25" },
    { ke: 9, tgl: "2026-05-29" },
    { ke: 10, tgl: "2026-05-30" },
    { ke: 11, tgl: "2026-06-06" }
  ];
  abdulDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 24,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T11:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 24),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Rahma Khairunnisa (akun_id: 25) - P1 s.d P11 selesai (Jam 14.00)
  const rahmaDates = [
    { ke: 1, tgl: "2026-05-06" },
    { ke: 2, tgl: "2026-05-07" },
    { ke: 3, tgl: "2026-05-08" },
    { ke: 4, tgl: "2026-05-09" },
    { ke: 5, tgl: "2026-05-11" },
    { ke: 6, tgl: "2026-05-12" },
    { ke: 7, tgl: "2026-05-13" },
    { ke: 8, tgl: "2026-05-14" },
    { ke: 9, tgl: "2026-05-15" },
    { ke: 10, tgl: "2026-05-18" },
    { ke: 11, tgl: "2026-06-04" }
  ];
  rahmaDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 25,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T14:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 25),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Abdi Ghifari Al Haqqi (akun_id: 26) - P1 s.d P10 selesai (Jam 13.00)
  const abdiDates = [
    { ke: 1, tgl: "2026-05-11" },
    { ke: 2, tgl: "2026-05-12" },
    { ke: 3, tgl: "2026-05-13" },
    { ke: 4, tgl: "2026-05-18" },
    { ke: 5, tgl: "2026-05-21" },
    { ke: 6, tgl: "2026-05-22" },
    { ke: 7, tgl: "2026-05-23" },
    { ke: 8, tgl: "2026-05-25" },
    { ke: 9, tgl: "2026-05-28" },
    { ke: 10, tgl: "2026-05-29" }
  ];
  abdiDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 26,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T13:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 26),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Edwar (akun_id: 27) - P1 s.d P11 selesai (Jam 11.00)
  const edwarDates = [
    { ke: 1, tgl: "2026-05-13" },
    { ke: 2, tgl: "2026-05-14" },
    { ke: 3, tgl: "2026-05-16" },
    { ke: 4, tgl: "2026-05-17" },
    { ke: 5, tgl: "2026-05-18" },
    { ke: 6, tgl: "2026-05-19" },
    { ke: 7, tgl: "2026-05-21" },
    { ke: 8, tgl: "2026-05-24" },
    { ke: 9, tgl: "2026-05-25" },
    { ke: 10, tgl: "2026-05-26" },
    { ke: 11, tgl: "2026-06-01" }
  ];
  edwarDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 27,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T11:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 27),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Stivany Many (akun_id: 28) - P1 s.d P10 selesai (Jam 08.00)
  const stivanyDates = [
    { ke: 1, tgl: "2026-05-14" },
    { ke: 2, tgl: "2026-05-15" },
    { ke: 3, tgl: "2026-05-18" },
    { ke: 4, tgl: "2026-05-19" },
    { ke: 5, tgl: "2026-05-20" },
    { ke: 6, tgl: "2026-05-21" },
    { ke: 7, tgl: "2026-05-22" },
    { ke: 8, tgl: "2026-05-23" },
    { ke: 9, tgl: "2026-05-24" },
    { ke: 10, tgl: "2026-05-25" }
  ];
  stivanyDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 28,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T08:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 28),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Dzoky (akun_id: 29) - P1 s.d P10 selesai (Jam 12.00)
  const dzokyDates = [
    { ke: 1, tgl: "2026-05-18" },
    { ke: 2, tgl: "2026-05-19" },
    { ke: 3, tgl: "2026-05-20" },
    { ke: 4, tgl: "2026-05-21" },
    { ke: 5, tgl: "2026-05-23" },
    { ke: 6, tgl: "2026-05-25" },
    { ke: 7, tgl: "2026-06-01" },
    { ke: 8, tgl: "2026-06-02" },
    { ke: 9, tgl: "2026-06-05" },
    { ke: 10, tgl: "2026-06-11" }
  ];
  dzokyDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 29,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T12:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 29),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Rohmad Karim (akun_id: 30) - P1 s.d P8 selesai (Jam 10.25)
  const rohmadDates = [
    { ke: 1, tgl: "2026-05-22" },
    { ke: 2, tgl: "2026-05-23" },
    { ke: 3, tgl: "2026-06-05" },
    { ke: 4, tgl: "2026-06-06" },
    { ke: 5, tgl: "2026-06-12" },
    { ke: 6, tgl: "2026-06-13" },
    { ke: 7, tgl: "2026-06-19" },
    { ke: 8, tgl: "2026-06-20" }
  ];
  rohmadDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 30,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:25:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 30),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 9, 10 & 11 (Belum Dijadwalkan)
  for (let i = 9; i <= 11; i++) {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 30,
      instruktur_id: null,
      kurikulum_id: i,
      tanggal_waktu: null,
      pertemuan_ke: i,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  }

  // Alvrindo Fernando (akun_id: 31) - P1 s.d P10 selesai (Jam 16.00)
  const alvrindoDates = [
    { ke: 1, tgl: "2026-05-23" },
    { ke: 2, tgl: "2026-05-24" },
    { ke: 3, tgl: "2026-05-30" },
    { ke: 4, tgl: "2026-05-31" },
    { ke: 5, tgl: "2026-06-06" },
    { ke: 6, tgl: "2026-06-07" },
    { ke: 7, tgl: "2026-06-13" },
    { ke: 8, tgl: "2026-06-14" },
    { ke: 9, tgl: "2026-06-20" },
    { ke: 10, tgl: "2026-06-21" }
  ];
  alvrindoDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 31,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T16:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 31),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Khoyrin Al Ani Pasya (akun_id: 32) - P1 s.d P10 selesai (Jam 09.00)
  const khoyrinDates = [
    { ke: 1, tgl: "2026-06-08" },
    { ke: 2, tgl: "2026-06-09" },
    { ke: 3, tgl: "2026-06-10" },
    { ke: 4, tgl: "2026-06-11" },
    { ke: 5, tgl: "2026-06-12" },
    { ke: 6, tgl: "2026-06-13" },
    { ke: 7, tgl: "2026-06-15" },
    { ke: 8, tgl: "2026-06-17" },
    { ke: 9, tgl: "2026-06-18" },
    { ke: 10, tgl: "2026-06-19" }
  ];
  khoyrinDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 32,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T09:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 32),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Zahara Rahmatul Irsya (akun_id: 33) - P1 s.d P9 selesai (Jam 11.00)
  const zaharaDates = [
    { ke: 1, tgl: "2026-06-11" },
    { ke: 2, tgl: "2026-06-12" },
    { ke: 3, tgl: "2026-06-13" },
    { ke: 4, tgl: "2026-06-15" },
    { ke: 5, tgl: "2026-06-16" },
    { ke: 6, tgl: "2026-06-17" },
    { ke: 7, tgl: "2026-06-19" },
    { ke: 8, tgl: "2026-06-20" },
    { ke: 9, tgl: "2026-06-24" }
  ];
  zaharaDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 33,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T11:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 33),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 10 & 11 (Belum Dijadwalkan)
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 33,
    instruktur_id: null,
    kurikulum_id: 10,
    tanggal_waktu: null,
    pertemuan_ke: 10,
    status: "Belum Dijadwalkan",
    nilai: null,
    catatan_instruktur: null
  });
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 33,
    instruktur_id: null,
    kurikulum_id: 11,
    tanggal_waktu: null,
    pertemuan_ke: 11,
    status: "Belum Dijadwalkan",
    nilai: null,
    catatan_instruktur: null
  });

  // Ahmad Zikro (akun_id: 34) - P1 s.d P9 selesai (Jam 10.00)
  const ahmadDates = [
    { ke: 1, tgl: "2026-06-13" },
    { ke: 2, tgl: "2026-06-14" },
    { ke: 3, tgl: "2026-06-15" },
    { ke: 4, tgl: "2026-06-16" },
    { ke: 5, tgl: "2026-06-17" },
    { ke: 6, tgl: "2026-06-18" },
    { ke: 7, tgl: "2026-06-19" },
    { ke: 8, tgl: "2026-06-25" },
    { ke: 9, tgl: "2026-06-25" }
  ];
  ahmadDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 34,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 34),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 10 & 11 (Belum Dijadwalkan)
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 34,
    instruktur_id: null,
    kurikulum_id: 10,
    tanggal_waktu: null,
    pertemuan_ke: 10,
    status: "Belum Dijadwalkan",
    nilai: null,
    catatan_instruktur: null
  });
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 34,
    instruktur_id: null,
    kurikulum_id: 11,
    tanggal_waktu: null,
    pertemuan_ke: 11,
    status: "Belum Dijadwalkan",
    nilai: null,
    catatan_instruktur: null
  });

  // Ren Ilfo Hafizco (akun_id: 35) - P1 s.d P8 selesai (Jam 10.00)
  const renDates = [
    { ke: 1, tgl: "2026-06-17" },
    { ke: 2, tgl: "2026-06-18" },
    { ke: 3, tgl: "2026-06-19" },
    { ke: 4, tgl: "2026-06-20" },
    { ke: 5, tgl: "2026-06-21" },
    { ke: 6, tgl: "2026-06-22" },
    { ke: 7, tgl: "2026-06-23" },
    { ke: 8, tgl: "2026-06-24" }
  ];
  renDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 35,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T10:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 35),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 9, 10 & 11 (Belum Dijadwalkan)
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 35,
    instruktur_id: null,
    kurikulum_id: 9,
    tanggal_waktu: null,
    pertemuan_ke: 9,
    status: "Belum Dijadwalkan",
    nilai: null,
    catatan_instruktur: null
  });
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 35,
    instruktur_id: null,
    kurikulum_id: 10,
    tanggal_waktu: null,
    pertemuan_ke: 10,
    status: "Belum Dijadwalkan",
    nilai: null,
    catatan_instruktur: null
  });
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 35,
    instruktur_id: null,
    kurikulum_id: 11,
    tanggal_waktu: null,
    pertemuan_ke: 11,
    status: "Belum Dijadwalkan",
    nilai: null,
    catatan_instruktur: null
  });

  // Azzura Qotrun Nada (akun_id: 36) - P1 selesai (Jam 09.00), P2 s.d P11 belum dijadwalkan
  schedules.push({
    id: scheduleIdCounter++,
    akun_id: 36,
    instruktur_id: 2,
    kurikulum_id: 1,
    tanggal_waktu: "2026-06-23T09:00:00+07:00",
    pertemuan_ke: 1,
    status: "Selesai",
    nilai: getVariedNilai(1, 36),
    catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
  });

  // Pertemuan 2 s.d 11 (Belum Dijadwalkan)
  for (let i = 2; i <= 11; i++) {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 36,
      instruktur_id: null,
      kurikulum_id: i,
      tanggal_waktu: null,
      pertemuan_ke: i,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  }

  // Fadel Muhammad (akun_id: 37) - P1 s.d P3 selesai (Jam 12.00), P4 s.d P11 belum dijadwalkan
  const fadelDates = [
    { ke: 1, tgl: "2026-06-23" },
    { ke: 2, tgl: "2026-06-24" },
    { ke: 3, tgl: "2026-06-25" }
  ];
  fadelDates.forEach(p => {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 37,
      instruktur_id: 2,
      kurikulum_id: p.ke,
      tanggal_waktu: `${p.tgl}T12:00:00+07:00`,
      pertemuan_ke: p.ke,
      status: "Selesai",
      nilai: getVariedNilai(p.ke, 37),
      catatan_instruktur: "Latihan selesai dengan baik sesuai instruksi."
    });
  });

  // Pertemuan 4 s.d 11 (Belum Dijadwalkan)
  for (let i = 4; i <= 11; i++) {
    schedules.push({
      id: scheduleIdCounter++,
      akun_id: 37,
      instruktur_id: null,
      kurikulum_id: i,
      tanggal_waktu: null,
      pertemuan_ke: i,
      status: "Belum Dijadwalkan",
      nilai: null,
      catatan_instruktur: null
    });
  }

  console.log("Memasukkan data jadwal latihan...");
  const { error: jadwalError } = await supabase
    .from('jadwal_latihan')
    .insert(schedules);

  if (jadwalError) {
    console.error("Gagal memasukkan data jadwal latihan:", jadwalError.message);
    return;
  }
  console.log(`Data jadwal latihan (${schedules.length} sesi) berhasil dimasukkan.`);
  console.log("=== SEMUA PROSES RISET & INPUT DATA SELESAI ===");
}

runResetAndInsert();
