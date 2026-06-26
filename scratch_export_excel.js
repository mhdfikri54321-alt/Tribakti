import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import ExcelJS from 'exceljs';

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

async function exportToExcel() {
  console.log("Mengambil data dari database...");

  // 1. Ambil semua akun siswa
  const { data: students, error: studentError } = await supabase
    .from('akun_pengguna')
    .select('*')
    .eq('role', 'siswa')
    .order('id', { ascending: true });

  if (studentError) {
    console.error("Gagal mengambil data siswa:", studentError.message);
    return;
  }

  // 2. Ambil semua data pendaftaran
  const { data: registrations, error: regError } = await supabase
    .from('pendaftaran')
    .select('*');

  if (regError) {
    console.error("Gagal mengambil data pendaftaran:", regError.message);
    return;
  }

  // 3. Ambil semua jadwal latihan
  const { data: schedules, error: schedError } = await supabase
    .from('jadwal_latihan')
    .select('*');

  if (schedError) {
    console.error("Gagal mengambil data jadwal latihan:", schedError.message);
    return;
  }

  console.log(`Berhasil mengambil ${students.length} data siswa.`);

  // Buat map pendaftaran berdasarkan akun_id
  const regMap = new Map();
  registrations.forEach(r => {
    regMap.set(r.akun_id, r);
  });

  // Hitung sesi selesai/sisa untuk setiap siswa
  const schedMap = new Map();
  schedules.forEach(s => {
    if (!schedMap.has(s.akun_id)) {
      schedMap.set(s.akun_id, { selesai: 0, belum: 0, total: 0 });
    }
    const counts = schedMap.get(s.akun_id);
    counts.total++;
    if (s.status === 'Selesai') {
      counts.selesai++;
    } else {
      counts.belum++;
    }
  });

  // Buat workbook & sheet baru
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Siswa Tri Bakti');

  // Atur gridlines agar terlihat
  worksheet.views = [{ showGridLines: true }];

  // Definisikan header kolom
  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'ID Akun', key: 'id', width: 10 },
    { header: 'Nama Lengkap', key: 'nama_lengkap', width: 25 },
    { header: 'NIK', key: 'nik', width: 20 },
    { header: 'Username', key: 'username', width: 15 },
    { header: 'Password', key: 'password', width: 15 },
    { header: 'Jenis Kelamin', key: 'jenis_kelamin', width: 15 },
    { header: 'No WhatsApp', key: 'no_whatsapp', width: 18 },
    { header: 'Tempat, Tgl Lahir', key: 'tempat_tanggal_lahir', width: 30 },
    { header: 'Alamat Lengkap', key: 'alamat_lengkap', width: 35 },
    { header: 'Paket', key: 'paket', width: 15 },
    { header: 'Harga Paket', key: 'price', width: 15 },
    { header: 'Total Bayar', key: 'total_bayar', width: 15 },
    { header: 'Jumlah Sesi', key: 'jumlah_sesi', width: 12 },
    { header: 'Sesi Selesai', key: 'sesi_selesai', width: 12 },
    { header: 'Sesi Sisa', key: 'sesi_sisa', width: 12 },
    { header: 'Status Kelulusan', key: 'status_kelulusan', width: 18 }
  ];

  // Masukkan data siswa ke worksheet
  students.forEach((student, index) => {
    const reg = regMap.get(student.id) || {};
    const sched = schedMap.get(student.id) || { selesai: 0, belum: 0, total: 0 };
    
    // Status Kelulusan
    const totalSesi = parseInt(student.jumlah_sesi || 0);
    const statusKelulusan = (sched.selesai >= totalSesi && totalSesi > 0) ? 'Lulus / Selesai' : 'Aktif / Belum Selesai';

    worksheet.addRow({
      no: index + 1,
      id: student.id,
      nama_lengkap: student.nama_lengkap,
      nik: student.nik || reg.nik || '-',
      username: student.username,
      password: student.password,
      jenis_kelamin: student.jenis_kelamin,
      no_whatsapp: student.no_whatsapp,
      tempat_tanggal_lahir: student.tempat_tanggal_lahir || reg.tempat_tanggal_lahir || '-',
      alamat_lengkap: student.alamat_lengkap || reg.alamat_domisili || '-',
      paket: student.paket || reg.paket_pilihan || '-',
      price: student.price || 0,
      total_bayar: reg.total_bayar || 0,
      jumlah_sesi: totalSesi,
      sesi_selesai: sched.selesai,
      sesi_sisa: totalSesi - sched.selesai,
      status_kelulusan: statusKelulusan
    });
  });

  // Format header row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.font = { name: 'Arial', family: 4, size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F497D' } // Navy blue header
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 25;

  // Format data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    // Alinyemen default
    row.alignment = { vertical: 'middle' };
    row.getCell('no').alignment = { horizontal: 'center' };
    row.getCell('id').alignment = { horizontal: 'center' };
    row.getCell('nik').alignment = { horizontal: 'center' };
    row.getCell('jenis_kelamin').alignment = { horizontal: 'center' };
    row.getCell('no_whatsapp').alignment = { horizontal: 'center' };
    row.getCell('jumlah_sesi').alignment = { horizontal: 'center' };
    row.getCell('sesi_selesai').alignment = { horizontal: 'center' };
    row.getCell('sesi_sisa').alignment = { horizontal: 'center' };
    row.getCell('status_kelulusan').alignment = { horizontal: 'center' };

    // Format harga/uang
    const priceCell = row.getCell('price');
    priceCell.value = parseInt(priceCell.value);
    priceCell.numFormat = '#,##0';
    priceCell.alignment = { horizontal: 'right' };

    const bayarCell = row.getCell('total_bayar');
    bayarCell.value = parseInt(bayarCell.value);
    bayarCell.numFormat = '#,##0';
    bayarCell.alignment = { horizontal: 'right' };

    // Border untuk semua sel data
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      cell.font = { name: 'Arial', size: 10 };
    });

    // Berikan warna selang-seling untuk baris (zebra striping)
    if (rowNumber % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F5F8' } // abu-abu sangat muda
        };
      });
    }

    // Berikan warna khusus untuk status kelulusan
    const statusCell = row.getCell('status_kelulusan');
    if (statusCell.value === 'Lulus / Selesai') {
      statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF2779BD' } }; // Biru
    } else {
      statusCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFDE751F' } }; // Oranye
    }
  });

  // Tulis ke file
  const filename = 'Data_Siswa_Tri_Bakti.xlsx';
  await workbook.xlsx.writeFile(filename);
  console.log(`Excel berhasil diekspor dan disimpan sebagai: ${filename}`);
}

exportToExcel();
