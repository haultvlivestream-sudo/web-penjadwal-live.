const express = require('express');
const cron = require('node-cron');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// CONFIGURASI GITHUB KAMU
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Akan diambil dari Environment Variable Render
const REPO_OWNER = 'haultvlivestream-sudo';
const REPO_NAME = 'liveyt-denganlogo2026-amanlag';
const WORKFLOW_FILE = 'Scriptpercobaan.yml';

// Tempat menyimpan daftar antrean jadwal
let scheduledJobs = [];

// API untuk menerima data dari formulir Web
app.post('/api/schedule', (req, res) => {
  const { link_youtube, kunci_rtmp, datetime } = req.body;

  if (!link_youtube || !kunci_rtmp || !datetime) {
    return res.status(400).json({ success: false, message: 'Semua data wajib diisi!' });
  }

  const targetDate = new Date(datetime);
  const now = new Date();

  if (targetDate <= now) {
    return res.status(400).json({ success: false, message: 'Waktu jadwal harus lebih dari jam sekarang!' });
  }

  // Ambil menit, jam, tanggal, bulan untuk Cron (Format WIB/Server)
  const minute = targetDate.getMinutes();
  const hour = targetDate.getHours();
  const day = targetDate.getDate();
  const month = targetDate.getMonth() + 1;

  // Cron Expression: Menit Jam Tanggal Bulan *
  const cronTime = `${minute} ${hour} ${day} ${month} *`;

  console.log(`[JADWAL BARU DIBUAT] Untuk tanggal: ${datetime} | Cron: ${cronTime}`);

  // Buat Tugas Penjadwalan dengan Timezone Asia/Jakarta (WIB)
  const task = cron.schedule(cronTime, async () => {
    console.log(`⏰ [JAM TIBA] Mengirim perintah trigger ke GitHub Actions...`);
    await triggerGitHubWorkflow(link_youtube, kunci_rtmp);
    task.stop(); // Hentikan tugas setelah sekali jalan
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });

  scheduledJobs.push({
    id: Date.now(),
    link_youtube,
    datetime,
    status: 'Menunggu Jam Main'
  });

  res.json({ success: true, message: `Jadwal berhasil dibuat untuk jam ${datetime} WIB!` });
});

// Fungsi penembak GitHub API
async function triggerGitHubWorkflow(linkYoutube, streamKey) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          link_youtube: linkYoutube,
          kunci_rtmp: streamKey
        }
      })
    });

    if (response.status === 204) {
      console.log('🚀 [SUCCESS] GitHub Actions Berhasil Dijalankan!');
    } else {
      const err = await response.json();
      console.error('❌ [ERROR GITHUB API]', err);
    }
  } catch (error) {
    console.error('❌ [FETCH ERROR]', error);
  }
}

// Jalankan Server Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Web Penjadwal berjalan di port ${PORT}`);
});
  
