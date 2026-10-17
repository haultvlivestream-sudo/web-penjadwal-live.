const express = require('express');
const path = require('path');

const app = express();

// Mendukung pembacaan JSON dan Form Data dari Cron-job.org
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'haultvlivestream-sudo';
const REPO_NAME = 'liveyt-denganlogo2026-amanlag';
const WORKFLOW_FILE = 'Scriptpercobaan.yml';

async function triggerGitHub(link_youtube, kunci_rtmp, res) {
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
          link_youtube: link_youtube,
          kunci_rtmp: kunci_rtmp
        }
      })
    });

    if (response.status === 204) {
      return res.json({ success: true, message: '🚀 Live berhasil dipicu ke GitHub Actions!' });
    } else {
      const err = await response.json();
      return res.status(500).json({ success: false, message: 'Gagal memicu GitHub API', error: err });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
}

// Menangani permintaan POST (dari Web & Cron-job.org)
app.post('/api/trigger', async (req, res) => {
  const link_youtube = req.body.link_youtube;
  const kunci_rtmp = req.body.kunci_rtmp;

  if (!link_youtube || !kunci_rtmp) {
    return res.status(400).json({ success: false, message: 'Link dan Stream Key wajib diisi!' });
  }
  await triggerGitHub(link_youtube, kunci_rtmp, res);
});

module.exports = app;
        
