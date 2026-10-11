#!/usr/bin/env node

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { TeamEngine } from '../team/engine.js'

const PORT = 3333
const repoRoot = process.cwd()
const engine = new TeamEngine(repoRoot)

const HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supergraph Agent Team Live Dashboard</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #121827;
      --card-border: #1f293d;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --success: #34d399;
      --warning: #fbbf24;
      --danger: #f87171;
      --purple: #c084fc;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .title-area h1 {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.02em;
    }
    .live-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 12px var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    .mission-desc {
      margin-top: 8px;
      font-size: 14px;
      color: var(--text-muted);
    }
    .stats-bar {
      display: flex;
      gap: 20px;
      background: rgba(0, 0, 0, 0.25);
      padding: 12px 20px;
      border-radius: 12px;
      border: 1px solid var(--card-border);
    }
    .stat-item {
      text-align: center;
    }
    .stat-num {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
    }
    .stat-lbl {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .dag-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }
    .wave-column {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .wave-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
    }
    .wave-name {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--purple);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .task-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s ease;
    }
    .task-card:hover {
      border-color: rgba(56, 189, 248, 0.4);
      background: rgba(255, 255, 255, 0.04);
      transform: translateY(-2px);
    }
    .task-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      gap: 8px;
    }
    .task-id {
      font-family: monospace;
      font-size: 11px;
      color: var(--text-muted);
    }
    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-merged { background: rgba(52, 211, 153, 0.15); color: var(--success); border: 1px solid rgba(52, 211, 153, 0.3); }
    .badge-green { background: rgba(56, 189, 248, 0.15); color: var(--primary); border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge-red { background: rgba(248, 113, 113, 0.15); color: var(--danger); border: 1px solid rgba(248, 113, 113, 0.3); }
    .badge-claimed { background: rgba(251, 191, 36, 0.15); color: var(--warning); border: 1px solid rgba(251, 191, 36, 0.3); }
    .badge-pending { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); border: 1px solid rgba(148, 163, 184, 0.3); }
    .task-title {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 10px;
    }
    .task-meta {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 8px;
    }
    .worker-tag {
      color: var(--primary);
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-area">
      <h1><span class="live-dot"></span> Supergraph Agent Team Monitor</h1>
      <div class="mission-desc" id="mission-text">Đang tải dữ liệu...</div>
    </div>
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-num" id="total-tasks">-</div>
        <div class="stat-lbl">Tasks</div>
      </div>
      <div class="stat-item">
        <div class="stat-num" style="color: var(--success)" id="merged-tasks">-</div>
        <div class="stat-lbl">Merged</div>
      </div>
      <div class="stat-item">
        <div class="stat-num" style="color: var(--purple)" id="total-waves">-</div>
        <div class="stat-lbl">Waves</div>
      </div>
    </div>
  </div>

  <div class="dag-grid" id="dag-container">
    <!-- Waves rendered here -->
  </div>

  <script>
    async function updateDashboard() {
      try {
        const res = await fetch('/api/state');
        const data = await res.json();
        if (!data || !data.mission) return;

        document.getElementById('mission-text').innerHTML =
          '<strong>Mission:</strong> ' + data.mission.objective + ' &bull; <strong>Branch:</strong> ' + data.mission.baseBranch;

        const tasks = data.tasks || [];
        const merged = tasks.filter(t => t.status === 'merged').length;
        document.getElementById('total-tasks').textContent = tasks.length;
        document.getElementById('merged-tasks').textContent = merged;

        // Group by wave
        const waves = {};
        for (const t of tasks) {
          const w = t.wave || 1;
          if (!waves[w]) waves[w] = [];
          waves[w].push(t);
        }
        document.getElementById('total-waves').textContent = Object.keys(waves).length;

        const container = document.getElementById('dag-container');
        container.innerHTML = '';

        const waveKeys = Object.keys(waves).sort((a, b) => Number(a) - Number(b));
        for (const wKey of waveKeys) {
          const waveTasks = waves[wKey];
          const col = document.createElement('div');
          col.className = 'wave-column';

          let html = '<div class="wave-header"><span class="wave-name">🌊 WAVE ' + wKey + '</span><span class="badge badge-merged">' + waveTasks.length + ' tasks</span></div>';

          for (const t of waveTasks) {
            let badgeClass = 'badge-pending';
            if (t.status === 'merged') badgeClass = 'badge-merged';
            else if (t.status === 'green') badgeClass = 'badge-green';
            else if (t.status === 'red_tested') badgeClass = 'badge-red';
            else if (t.status === 'claimed') badgeClass = 'badge-claimed';

            const worker = t.assignedTo ? '<span class="worker-tag">@' + t.assignedTo + '</span>' : '<em>(unassigned)</em>';
            const deps = t.dependencies && t.dependencies.length > 0 ? '<div>Deps: ' + t.dependencies.join(', ') + '</div>' : '';

            html += '<div class="task-card">' +
              '<div class="task-top"><span class="task-id">' + t.id + '</span><span class="badge ' + badgeClass + '">' + t.status + '</span></div>' +
              '<div class="task-title">' + t.title + '</div>' +
              '<div class="task-meta"><div>Worker: ' + worker + '</div>' + deps + '</div>' +
              '</div>';
          }

          col.innerHTML = html;
          container.appendChild(col);
        }
      } catch (e) {
        console.error(e);
      }
    }

    updateDashboard();
    setInterval(updateDashboard, 1500);
  </script>
</body>
</html>`

const server = http.createServer((req, res) => {
  if (req.url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    const state = engine._loadState()
    res.end(JSON.stringify(state))
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(HTML)
})

function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  try {
    exec(`${start} ${url}`, () => {})
  } catch {}
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Supergraph Team UI] Already running at http://127.0.0.1:${PORT}`)
    if (!process.argv.includes('--no-open')) {
      openBrowser(`http://127.0.0.1:${PORT}`)
    }
    process.exit(0)
  } else {
    console.error(`[Supergraph Team UI] Server error:`, err)
    process.exit(1)
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Supergraph Team UI] Running at http://127.0.0.1:${PORT}`)
  if (!process.argv.includes('--no-open')) {
    openBrowser(`http://127.0.0.1:${PORT}`)
  }
})
