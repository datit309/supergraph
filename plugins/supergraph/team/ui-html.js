/**
 * Supergraph Team Live UI HTML Template
 */

export function getTeamUiHtml() {
  return String.raw`<!DOCTYPE html>
<html lang="vi" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supergraph Agent Team Monitor</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --card-hover: #f1f5f9;
      --card-subtle-bg: #f8fafc;
      --card-subtle-border: #e2e8f0;
      --nav-bg: #f1f5f9;
      --text: #0f172a;
      --text-muted: #64748b;
      --primary: #0284c7;
      --primary-dim: rgba(2, 132, 199, 0.12);
      --success: #059669;
      --success-dim: rgba(5, 150, 105, 0.12);
      --warning: #d97706;
      --warning-dim: rgba(217, 119, 6, 0.12);
      --danger: #dc2626;
      --danger-dim: rgba(220, 38, 38, 0.12);
      --purple: #7c3aed;
      --purple-dim: rgba(124, 58, 237, 0.12);
      --teal: #0d9488;
      --teal-dim: rgba(13, 148, 136, 0.12);
      --header-bg: #ffffff;
      --header-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      --card-shadow: 0 2px 8px -1px rgba(0, 0, 0, 0.05);
      --card-shadow-hover: 0 8px 20px -4px rgba(0, 0, 0, 0.1);
      --table-th-bg: #f8fafc;
      --table-border: #f1f5f9;
      --table-hover: #f8fafc;
      --code-bg: #0f172a;
      --code-text: #f8fafc;
      --code-border: #334155;
      --guide-bg: #f8fafc;
      --guide-text: #0369a1;
      --modal-bg: #ffffff;
      --modal-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      --progress-bg: #e2e8f0;
    }

    [data-theme="dark"] {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --card-hover: #192337;
      --card-subtle-bg: rgba(255, 255, 255, 0.02);
      --card-subtle-border: rgba(255, 255, 255, 0.07);
      --nav-bg: rgba(17, 24, 39, 0.8);
      --text: #f9fafb;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-dim: rgba(56, 189, 248, 0.15);
      --success: #10b981;
      --success-dim: rgba(16, 185, 129, 0.15);
      --warning: #f59e0b;
      --warning-dim: rgba(245, 158, 11, 0.15);
      --danger: #ef4444;
      --danger-dim: rgba(239, 68, 68, 0.15);
      --purple: #a855f7;
      --purple-dim: rgba(168, 85, 247, 0.15);
      --teal: #14b8a6;
      --teal-dim: rgba(20, 184, 166, 0.15);
      --header-bg: linear-gradient(135deg, rgba(17, 24, 39, 0.8), rgba(15, 23, 42, 0.9));
      --header-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      --card-shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.3);
      --table-th-bg: rgba(0, 0, 0, 0.25);
      --table-border: rgba(255, 255, 255, 0.04);
      --table-hover: rgba(255, 255, 255, 0.02);
      --code-bg: #070a12;
      --code-text: #e2e8f0;
      --code-border: rgba(255, 255, 255, 0.08);
      --guide-bg: rgba(0, 0, 0, 0.3);
      --guide-text: var(--primary);
      --modal-bg: #0d121f;
      --modal-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      --progress-bg: rgba(255, 255, 255, 0.05);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      min-height: 100vh;
      line-height: 1.5;
    }
    a { color: var(--primary); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Header */
    .header {
      background: var(--header-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      box-shadow: var(--header-shadow);
    }
    .brand-area {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-badge {
      background: linear-gradient(135deg, #0284c7, #7c3aed);
      color: #fff;
      font-weight: 900;
      font-size: 14px;
      padding: 8px 12px;
      border-radius: 10px;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
    }
    .title-area h1 {
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: -0.01em;
    }
    .live-dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    .mission-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 3px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: var(--card-hover);
      border-color: var(--primary);
      transform: translateY(-1px);
    }
    .btn-primary {
      background: #0284c7;
      border-color: #38bdf8;
      color: #fff;
    }
    .btn-primary:hover {
      background: #0369a1;
    }
    .btn-danger {
      color: #f87171;
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }

    /* KPI Summary Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: var(--card-shadow);
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .kpi-card:hover {
      border-color: var(--primary);
      transform: translateY(-1px);
    }
    .kpi-num {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .kpi-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    /* Tab Controls & Filter Bar */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .nav-tabs {
      display: flex;
      gap: 6px;
      background: var(--nav-bg);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--card-border);
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tab-btn.active {
      background: var(--primary);
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 2px 8px var(--primary-dim);
    }
    .filter-area {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      max-width: 450px;
    }
    .search-input {
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 13px;
      color: var(--text);
      outline: none;
      transition: border-color 0.15s ease;
    }
    .search-input:focus { border-color: var(--primary); }
    .status-select {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 12px;
      color: var(--text);
      outline: none;
    }

    /* DAG Grid & Wave Columns */
    .dag-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
      align-items: start;
    }
    .wave-column {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--card-shadow);
    }
    .wave-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
    }
    .wave-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .wave-name {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--purple);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .wave-progress {
      width: 100%;
      height: 4px;
      background: var(--progress-bg);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 6px;
    }
    .wave-progress-bar {
      height: 100%;
      background: var(--success);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    /* Task Card */
    .task-card {
      background: var(--card-subtle-bg);
      border: 1px solid var(--card-subtle-border);
      border-radius: 12px;
      padding: 14px;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .task-card:hover {
      border-color: var(--primary);
      background: var(--card-hover);
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);
    }
    .task-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .task-id {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
    }
    .badge {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-merged { background: var(--success-dim); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-green { background: var(--primary-dim); color: var(--primary); border: 1px solid rgba(56, 189, 248, 0.3); }
    .badge-red { background: var(--danger-dim); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-claimed { background: var(--warning-dim); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-pending { background: rgba(148, 163, 184, 0.12); color: var(--text-muted); border: 1px solid rgba(148, 163, 184, 0.25); }
    .badge-ready { background: var(--teal-dim); color: var(--teal); border: 1px solid rgba(20, 184, 166, 0.3); }

    .task-title {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--text);
    }
    .task-meta {
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-top: 1px solid var(--card-border);
      padding-top: 8px;
    }
    .worker-tag {
      color: var(--primary);
      font-weight: 700;
    }
    .deps-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
      margin-top: 2px;
    }
    .dep-pill {
      font-family: ui-monospace, monospace;
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
    }
    .dep-pill.ok { color: var(--success); border-color: rgba(16, 185, 129, 0.3); }
    .dep-pill.wait { color: var(--danger); border-color: rgba(239, 68, 68, 0.3); }

    /* Workers Table */
    .data-table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .data-table th {
      background: var(--table-th-bg);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--table-border);
    }
    .data-table tr:hover td {
      background: var(--table-hover);
    }

    /* Empty State Hero */
    .empty-state {
      background: var(--card-bg);
      border: 2px dashed var(--card-border);
      border-radius: 20px;
      padding: 48px 24px;
      text-align: center;
      max-width: 680px;
      margin: 40px auto;
      box-shadow: var(--card-shadow);
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 8px;
    }
    .empty-desc {
      font-size: 13px;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .guide-box {
      background: var(--guide-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: var(--guide-text);
      margin-bottom: 24px;
      line-height: 1.6;
    }

    /* Modal Drawer */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-backdrop.open { display: flex; }
    .modal-box {
      background: var(--modal-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      width: 100%;
      max-width: 780px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--modal-shadow);
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: var(--card-subtle-bg);
    }
    .modal-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--text);
    }
    .modal-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .code-block {
      background: var(--code-bg);
      border: 1px solid var(--code-border);
      border-radius: 10px;
      padding: 12px 16px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: var(--code-text);
      overflow-x: auto;
      white-space: pre-wrap;
      max-height: 240px;
    }
    .code-diff {
      color: #94a3b8;
    }
    .diff-add { color: #34d399; background: rgba(52, 211, 153, 0.1); display: block; }
    .diff-del { color: #f87171; background: rgba(248, 113, 113, 0.1); display: block; }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
    }
    .close-btn:hover { color: var(--text); }
  
    @media (max-width: 680px) {
      body { padding: 12px; font-size: 11px; }
      .header { padding: 12px 14px; margin-bottom: 12px; }
      .brand-area { gap: 8px; }
      .title-area h1 { font-size: 15px; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
      .tab-group, .filter-group { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-area">
      <div class="logo-badge">SUPERGRAPH</div>
      <div class="title-area">
        <h1><span class="live-dot"></span> Multi-Agent Team Live Monitor</h1>
        <div class="mission-desc" id="mission-text">Đang đồng bộ dữ liệu...</div>
      </div>
    </div>
    <div class="header-actions">
      <button class="btn" id="theme-toggle" onclick="toggleTheme()" title="Chuyển đổi Chế độ Sáng / Tối">☀️ Sáng</button>
      <button class="btn" onclick="updateDashboard()" title="Tải lại ngay">🔄 Làm mới</button>
      <button class="btn" onclick="copyStateJson()" title="Sao chép toàn bộ state JSON">📋 Copy State</button>
      <button class="btn btn-primary" id="btn-init-demo" onclick="initDemoMission()" style="display: none;">🚀 Khởi tạo Demo Mission</button>
      <button class="btn btn-danger" id="btn-reset" onclick="resetMission()" style="display: none;">🗑️ Reset Mission</button>
    </div>
  </div>

  <!-- KPI Row -->
  <div class="kpi-row" id="kpi-row" style="display: none;">
    <div class="kpi-card">
      <div class="kpi-num" id="kpi-total" style="color: var(--primary);">-</div>
      <div class="kpi-label">Tổng Nhiệm Vụ</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" id="kpi-merged" style="color: var(--success);">-</div>
      <div class="kpi-label">Đã Merge</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" id="kpi-claimed" style="color: var(--warning);">-</div>
      <div class="kpi-label">Đang Thực Thi</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" id="kpi-red" style="color: var(--danger);">-</div>
      <div class="kpi-label">Đang Test RED</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" id="kpi-ready" style="color: var(--teal);">-</div>
      <div class="kpi-label">Sẵn Sàng Nhận</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-num" id="kpi-waves" style="color: var(--purple);">-</div>
      <div class="kpi-label">Tổng Số Wave</div>
    </div>
  </div>

  <!-- Navigation & Toolbar -->
  <div class="toolbar" id="toolbar" style="display: none;">
    <div class="nav-tabs">
      <button class="tab-btn active" id="tab-btn-dag" onclick="switchTab('dag')">🌊 Sóng DAG</button>
      <button class="tab-btn" id="tab-btn-workers" onclick="switchTab('workers')">🤖 Agents &amp; Worktrees</button>
      <button class="tab-btn" id="tab-btn-logs" onclick="switchTab('logs')">📜 Dòng Nhật Ký</button>
    </div>
    <div class="filter-area" id="filter-area">
      <input
        type="text"
        id="search-input"
        class="search-input"
        placeholder="Tìm kiếm theo mã task, tên, worker..."
        oninput="renderDag()"
      />
      <select id="status-filter" class="status-select" onchange="renderDag()">
        <option value="ALL">Tất cả trạng thái</option>
        <option value="ready">Sẵn sàng (Ready)</option>
        <option value="claimed">Đang làm (Claimed)</option>
        <option value="red_tested">Đang test RED</option>
        <option value="green">Test GREEN xong</option>
        <option value="merged">Đã Merge</option>
      </select>
    </div>
  </div>

  <!-- Tab Content: DAG -->
  <div id="content-dag">
    <div class="dag-grid" id="dag-container"></div>
  </div>

  <!-- Tab Content: Workers -->
  <div id="content-workers" style="display: none;">
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Agent / Worker ID</th>
            <th>Mã Task Phụ Trách</th>
            <th>Tên Nhiệm Vụ</th>
            <th>Trạng Thái</th>
            <th>Nhánh Worktree</th>
            <th>Cập Nhật Lần Cuối</th>
          </tr>
        </thead>
        <tbody id="workers-tbody"></tbody>
      </table>
    </div>
  </div>

  <!-- Tab Content: Activity Logs -->
  <div id="content-logs" style="display: none;">
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Thời Gian</th>
            <th>Mã Task</th>
            <th>Tên Nhiệm Vụ</th>
            <th>Trạng Thái</th>
            <th>Worker Phụ Trách</th>
          </tr>
        </thead>
        <tbody id="logs-tbody"></tbody>
      </table>
    </div>
  </div>

  <!-- Empty State Hero -->
  <div class="empty-state" id="empty-state" style="display: none;">
    <div class="empty-icon">⚡</div>
    <h2 class="empty-title">Chưa có Mission nào đang hoạt động</h2>
    <p class="empty-desc">
      Supergraph Multi-Agent Worktree Engine đang sẵn sàng lắng nghe. Khởi tạo mission bằng các công cụ MCP hoặc bấm nút bên dưới để tạo Demo Mission xem trước giao diện.
    </p>
    <div class="guide-box">
      # 1. Khởi tạo mission với base branch<br>
      sg_team_init { objective: "Tái cấu trúc module X", baseBranch: "main" }<br><br>
      # 2. Tạo các task theo Wave DAG<br>
      sg_task_create { id: "task-1", title: "Viết Data Schema", wave: 1 }<br><br>
      # 3. Agent nhận việc &amp; sinh Git Worktree cô lập<br>
      sg_task_claim { taskId: "task-1", workerId: "agent-1" }
    </div>
    <button class="btn btn-primary" onclick="initDemoMission()">🚀 Khởi tạo Demo Mission Ngay</button>
  </div>

  <!-- Task Detail Modal -->
  <div class="modal-backdrop" id="task-modal" onclick="closeModalOnBackdrop(event)">
    <div class="modal-box">
      <div class="modal-header">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="task-id" id="modal-task-id">TASK-ID</span>
            <span class="badge" id="modal-task-badge">STATUS</span>
          </div>
          <div class="modal-title" id="modal-task-title" style="margin-top: 6px;">Tiêu đề nhiệm vụ</div>
        </div>
        <button class="close-btn" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="font-size: 13px; color: var(--text-muted);" id="modal-task-desc"></div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
          <div>
            <strong style="color: var(--text);">Worker:</strong>
            <span id="modal-task-worker" style="color: var(--primary);"></span>
          </div>
          <div>
            <strong style="color: var(--text);">Wave:</strong>
            <span id="modal-task-wave"></span>
          </div>
          <div>
            <strong style="color: var(--text);">Phụ thuộc (Deps):</strong>
            <span id="modal-task-deps"></span>
          </div>
          <div>
            <strong style="color: var(--text);">Write Scopes:</strong>
            <span id="modal-task-scopes"></span>
          </div>
        </div>

        <div>
          <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; color: var(--danger);">
            🔴 TDD RED Output (Kiểm thử thất bại kỳ vọng)
          </h4>
          <div class="code-block" id="modal-task-red">Chưa có kết quả RED test.</div>
        </div>

        <div>
          <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; color: var(--primary);">
            🟢 TDD GREEN Output (Kiểm thử vượt qua)
          </h4>
          <div class="code-block" id="modal-task-green">Chưa có kết quả GREEN test.</div>
        </div>

        <div>
          <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; color: var(--success);">
            📝 Git Diff (Thay đổi mã nguồn)
          </h4>
          <div class="code-block code-diff" id="modal-task-diff">Chưa có git diff.</div>
        </div>

        <div id="modal-action-row" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px;">
          <button id="btn-mark-merged" class="btn btn-outline" style="color: var(--success); border-color: var(--success);" onclick="markCurrentTaskMerged()">
            ✓ Đánh dấu Hoàn thành (Mark Merged)
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentData = null;
    let currentTab = 'dag';
    let currentModalTaskId = null;

    function switchTab(tab) {
      currentTab = tab;
      document.getElementById('tab-btn-dag').classList.toggle('active', tab === 'dag');
      document.getElementById('tab-btn-workers').classList.toggle('active', tab === 'workers');
      document.getElementById('tab-btn-logs').classList.toggle('active', tab === 'logs');

      document.getElementById('content-dag').style.display = tab === 'dag' ? 'block' : 'none';
      document.getElementById('content-workers').style.display = tab === 'workers' ? 'block' : 'none';
      document.getElementById('content-logs').style.display = tab === 'logs' ? 'block' : 'none';
      document.getElementById('filter-area').style.display = tab === 'dag' ? 'flex' : 'none';

      if (tab === 'workers') renderWorkers();
      if (tab === 'logs') renderLogs();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const currentSessionId = urlParams.get("sessionId");
    const currentCwd = urlParams.get("cwd");

    async function updateDashboard() {
      try {
        const queryParams = new URLSearchParams();
        if (currentSessionId) queryParams.set("sessionId", currentSessionId);
        if (currentCwd) queryParams.set("cwd", currentCwd);
        const qs = queryParams.toString() ? "?" + queryParams.toString() : "";

        let res = await fetch("/api/state" + qs).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch("/api/supergraph/team/state" + qs).catch(() => null);
        }
        if (!res || !res.ok) return;
        const data = await res.json();
        currentData = data;

        if (!data || !data.mission) {
          document.getElementById('empty-state').style.display = 'block';
          document.getElementById('kpi-row').style.display = 'none';
          document.getElementById('toolbar').style.display = 'none';
          document.getElementById('content-dag').style.display = 'none';
          document.getElementById('btn-init-demo').style.display = currentSessionId ? 'none' : 'inline-flex';
          document.getElementById('btn-reset').style.display = 'none';
          const sessionHint = currentSessionId ? (' &bull; Session: <code>' + escapeHtml(currentSessionId.slice(0, 8)) + '...</code>') : '';
          document.getElementById('mission-text').innerHTML = 'Phiên làm việc này chưa có Team Mission' + sessionHint + '.';
          return;
        }

        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('kpi-row').style.display = 'grid';
        document.getElementById('toolbar').style.display = 'flex';
        document.getElementById('btn-init-demo').style.display = 'none';
        document.getElementById('btn-reset').style.display = 'inline-flex';

        document.getElementById('mission-text').innerHTML =
          '<strong>Mục tiêu:</strong> ' + escapeHtml(data.mission.objective) +
          ' &bull; <strong>Nhánh cơ sở:</strong> <code style="color:var(--primary)">' + escapeHtml(data.mission.baseBranch) + '</code>';

        const tasks = data.tasks || [];
        const merged = tasks.filter(t => t.status === 'merged').length;
        const claimed = tasks.filter(t => t.status === 'claimed').length;
        const red = tasks.filter(t => t.status === 'red_tested').length;

        // Calculate ready tasks
        const readyCount = tasks.filter(t => {
          if (t.status !== 'pending') return false;
          return (t.dependencies || []).every(depId => {
            const dep = tasks.find(x => x.id === depId);
            return dep && dep.status === 'merged';
          });
        }).length;

        const waves = new Set(tasks.map(t => t.wave || 1));

        document.getElementById('kpi-total').textContent = tasks.length;
        document.getElementById('kpi-merged').textContent = merged;
        document.getElementById('kpi-claimed').textContent = claimed;
        document.getElementById('kpi-red').textContent = red;
        document.getElementById('kpi-ready').textContent = readyCount;
        document.getElementById('kpi-waves').textContent = waves.size;

        if (currentTab === 'dag') renderDag();
        else if (currentTab === 'workers') renderWorkers();
        else if (currentTab === 'logs') renderLogs();
      } catch (e) {
        console.error(e);
      }
    }

    function renderDag() {
      if (!currentData || !currentData.tasks) return;
      const tasks = currentData.tasks;
      const query = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
      const statusFilter = document.getElementById('status-filter')?.value || 'ALL';

      // Group tasks by wave
      const waveMap = {};
      for (const t of tasks) {
        const w = t.wave || 1;
        if (!waveMap[w]) waveMap[w] = [];

        // Check search filter
        if (query) {
          const matchId = t.id.toLowerCase().includes(query);
          const matchTitle = (t.title || '').toLowerCase().includes(query);
          const matchWorker = (t.assignedTo || '').toLowerCase().includes(query);
          if (!matchId && !matchTitle && !matchWorker) continue;
        }

        // Check status filter
        if (statusFilter !== 'ALL') {
          const isReady = t.status === 'pending' && (t.dependencies || []).every(depId => {
            const dep = tasks.find(x => x.id === depId);
            return dep && dep.status === 'merged';
          });
          if (statusFilter === 'ready' && !isReady) continue;
          if (statusFilter !== 'ready' && t.status !== statusFilter) continue;
        }

        waveMap[w].push(t);
      }

      const container = document.getElementById('dag-container');
      container.innerHTML = '';

      const waveKeys = Object.keys(waveMap).sort((a, b) => Number(a) - Number(b));
      if (waveKeys.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Không có nhiệm vụ nào khớp với bộ lọc tìm kiếm.</div>';
        return;
      }

      for (const wKey of waveKeys) {
        const waveTasks = waveMap[wKey];
        const allWaveTasks = tasks.filter(t => (t.wave || 1) == wKey);
        const mergedInWave = allWaveTasks.filter(t => t.status === 'merged').length;
        const progressPct = allWaveTasks.length > 0 ? Math.round((mergedInWave / allWaveTasks.length) * 100) : 0;

        const col = document.createElement('div');
        col.className = 'wave-column';

        let html = '<div class="wave-header">' +
          '<div class="wave-title-group">' +
            '<span class="wave-name">🌊 WAVE ' + wKey + '</span>' +
            '<span style="font-size: 11px; color: var(--text-muted);">' + mergedInWave + '/' + allWaveTasks.length + ' hoàn thành (' + progressPct + '%)</span>' +
            '<div class="wave-progress"><div class="wave-progress-bar" style="width:' + progressPct + '%"></div></div>' +
          '</div>' +
          '<span class="badge badge-merged">' + waveTasks.length + ' tasks</span>' +
        '</div>';

        for (const t of waveTasks) {
          let badgeClass = 'badge-pending';
          let statusText = t.status;

          const isReady = t.status === 'pending' && (t.dependencies || []).every(depId => {
            const dep = tasks.find(x => x.id === depId);
            return dep && dep.status === 'merged';
          });

          if (t.status === 'merged') { badgeClass = 'badge-merged'; statusText = 'Đã Merge'; }
          else if (t.status === 'green') { badgeClass = 'badge-green'; statusText = 'Test GREEN'; }
          else if (t.status === 'red_tested') { badgeClass = 'badge-red'; statusText = 'Test RED'; }
          else if (t.status === 'claimed') { badgeClass = 'badge-claimed'; statusText = 'Đang Làm'; }
          else if (isReady) { badgeClass = 'badge-ready'; statusText = 'Sẵn Sàng'; }
          else { badgeClass = 'badge-pending'; statusText = 'Chờ Deps'; }

          const worker = t.assignedTo
            ? '<span class="worker-tag">@' + escapeHtml(t.assignedTo) + '</span>'
            : '<span style="color:var(--text-muted); font-style:italic;">Chưa gán agent</span>';

          let depsHtml = '';
          if (t.dependencies && t.dependencies.length > 0) {
            depsHtml = '<div class="deps-list"><span style="font-size:10px;">Phụ thuộc:</span> ';
            for (const d of t.dependencies) {
              const depObj = tasks.find(x => x.id === d);
              const isOk = depObj && depObj.status === 'merged';
              depsHtml += '<span class="dep-pill ' + (isOk ? 'ok' : 'wait') + '">' + (isOk ? '✓ ' : '⏳ ') + escapeHtml(d) + '</span>';
            }
            depsHtml += '</div>';
          }

          html += '<div class="task-card" onclick="openTaskModal(\x27' + escapeHtml(t.id) + '\x27)">' +
            '<div class="task-top">' +
              '<span class="task-id">' + escapeHtml(t.id) + '</span>' +
              '<span class="badge ' + badgeClass + '">' + statusText + '</span>' +
            '</div>' +
            '<div class="task-title">' + escapeHtml(t.title) + '</div>' +
            '<div class="task-meta">' +
              '<div>Worker: ' + worker + '</div>' +
              depsHtml +
            '</div>' +
          '</div>';
        }

        col.innerHTML = html;
        container.appendChild(col);
      }
    }

    function renderWorkers() {
      if (!currentData || !currentData.tasks) return;
      const tasks = currentData.tasks;
      const workersMap = {};
      for (const t of tasks) {
        if (t.assignedTo) {
          workersMap[t.assignedTo] = t;
        }
      }

      const tbody = document.getElementById('workers-tbody');
      tbody.innerHTML = '';

      const workerIds = Object.keys(workersMap);
      if (workerIds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px;">Hiện chưa có subagent/worker nào nhận việc.</td></tr>';
        return;
      }

      for (const wId of workerIds) {
        const t = workersMap[wId];
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td style="font-weight:700; color:var(--primary);">@' + escapeHtml(wId) + '</td>' +
          '<td style="font-family:monospace; font-size:11px;">' + escapeHtml(t.id) + '</td>' +
          '<td style="font-weight:600;">' + escapeHtml(t.title) + '</td>' +
          '<td><span class="badge badge-' + (t.status === 'merged' ? 'merged' : t.status === 'green' ? 'green' : t.status === 'red_tested' ? 'red' : 'claimed') + '">' + t.status + '</span></td>' +
          '<td style="font-family:monospace; font-size:11px; color:var(--text-muted);">' + (t.worktreeBranch ? escapeHtml(t.worktreeBranch) : '—') + '</td>' +
          '<td style="font-size:11px; color:var(--text-muted);">' + (t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString('vi-VN') : '—') + '</td>';
        tbody.appendChild(tr);
      }
    }

    function renderLogs() {
      if (!currentData || !currentData.tasks) return;
      const tasks = [...currentData.tasks].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      const tbody = document.getElementById('logs-tbody');
      tbody.innerHTML = '';

      for (const t of tasks) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          '<td style="font-size:11px; color:var(--text-muted); font-family:monospace;">' + (t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString('vi-VN') : '—') + '</td>' +
          '<td style="font-family:monospace; font-size:11px; font-weight:700;">' + escapeHtml(t.id) + '</td>' +
          '<td style="font-weight:600;">' + escapeHtml(t.title) + '</td>' +
          '<td><span class="badge badge-' + (t.status === 'merged' ? 'merged' : t.status === 'green' ? 'green' : t.status === 'red_tested' ? 'red' : 'pending') + '">' + t.status + '</span></td>' +
          '<td style="color:var(--primary); font-weight:600;">' + (t.assignedTo ? '@' + escapeHtml(t.assignedTo) : '—') + '</td>';
        tbody.appendChild(tr);
      }
    }

    function openTaskModal(taskId) {
      if (!currentData || !currentData.tasks) return;
      const t = currentData.tasks.find(x => x.id === taskId);
      if (!t) return;

      document.getElementById('modal-task-id').textContent = t.id;
      document.getElementById('modal-task-title').textContent = t.title;
      document.getElementById('modal-task-desc').textContent = t.description || 'Không có mô tả chi tiết.';
      document.getElementById('modal-task-worker').textContent = t.assignedTo ? '@' + t.assignedTo : 'Chưa gán';
      document.getElementById('modal-task-wave').textContent = 'Wave ' + (t.wave || 1);
      document.getElementById('modal-task-deps').textContent = (t.dependencies && t.dependencies.length > 0) ? t.dependencies.join(', ') : 'Không có';
      document.getElementById('modal-task-scopes').textContent = (t.writeScopes && t.writeScopes.length > 0) ? t.writeScopes.join(', ') : 'Toàn bộ repo';

      const badge = document.getElementById('modal-task-badge');
      badge.textContent = t.status;
      badge.className = 'badge badge-' + (t.status === 'merged' ? 'merged' : t.status === 'green' ? 'green' : t.status === 'red_tested' ? 'red' : 'claimed');

      document.getElementById('modal-task-red').textContent = t.redOutput || 'Chưa có output RED test.';
      document.getElementById('modal-task-green').textContent = t.greenOutput || 'Chưa có output GREEN test.';

      const diffEl = document.getElementById('modal-task-diff');
      if (t.diff) {
        const lines = t.diff.split('\\n');
        let formatted = '';
        for (const line of lines) {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            formatted += '<span class="diff-add">' + escapeHtml(line) + '</span>';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            formatted += '<span class="diff-del">' + escapeHtml(line) + '</span>';
          } else {
            formatted += escapeHtml(line) + '\\n';
          }
        }
        diffEl.innerHTML = formatted;
      } else {
        diffEl.textContent = 'Chưa có git diff.';
      }

      document.getElementById('task-modal').classList.add('open');

      currentModalTaskId = t.id;
      const btnMark = document.getElementById('btn-mark-merged');
      if (btnMark) {
        btnMark.style.display = t.status === 'merged' ? 'none' : 'inline-flex';
      }
    }

    async function markCurrentTaskMerged() {
      if (!currentModalTaskId) return;
      const queryParams = new URLSearchParams();
      if (currentSessionId) queryParams.set("sessionId", currentSessionId);
      if (currentCwd) queryParams.set("cwd", currentCwd);
      const qs = queryParams.toString() ? "?" + queryParams.toString() : "";

      const btn = document.getElementById('btn-mark-merged');
      if (btn) btn.disabled = true;

      try {
        const res = await fetch('/api/task/merge' + qs, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: currentModalTaskId })
        });
        if (res && res.ok) {
          closeModal();
          await updateDashboard();
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    function closeModal() {
      document.getElementById('task-modal').classList.remove('open');
    }

    function closeModalOnBackdrop(e) {
      if (e.target.id === 'task-modal') closeModal();
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    async function initDemoMission() {
      if (!confirm('Khởi tạo Demo Mission để mô phỏng tiến độ Multi-Agent?')) return;
      try {
        const queryParams = new URLSearchParams();
        if (currentSessionId) queryParams.set("sessionId", currentSessionId);
        if (currentCwd) queryParams.set("cwd", currentCwd);
        const qs = queryParams.toString() ? "?" + queryParams.toString() : "";
        await fetch('/api/init-demo' + qs, { method: 'POST' });
        updateDashboard();
      } catch (e) {
        alert('Lỗi: ' + e.message);
      }
    }

    async function resetMission() {
      if (!confirm('Bạn có chắc muốn xóa và reset toàn bộ state của mission hiện tại?')) return;
      try {
        const queryParams = new URLSearchParams();
        if (currentSessionId) queryParams.set("sessionId", currentSessionId);
        if (currentCwd) queryParams.set("cwd", currentCwd);
        const qs = queryParams.toString() ? "?" + queryParams.toString() : "";
        await fetch('/api/reset' + qs, { method: 'POST' });
        updateDashboard();
      } catch (e) {
        alert('Lỗi: ' + e.message);
      }
    }

    function copyStateJson() {
      if (!currentData) return;
      navigator.clipboard.writeText(JSON.stringify(currentData, null, 2))
        .then(() => alert('Đã sao chép State JSON vào clipboard!'))
        .catch(() => alert('Không thể sao chép JSON.'));
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function initTheme() {
      const urlTheme = urlParams.get("theme");
      const savedTheme = localStorage.getItem("sg_team_theme");
      const activeTheme = urlTheme || savedTheme || "light";
      applyTheme(activeTheme);
    }

    function applyTheme(theme) {
      if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        const btn = document.getElementById("theme-toggle");
        if (btn) btn.innerHTML = "🌙 Tối";
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        const btn = document.getElementById("theme-toggle");
        if (btn) btn.innerHTML = "☀️ Sáng";
      }
      localStorage.setItem("sg_team_theme", theme);
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    }

    initTheme();
    updateDashboard();
    setInterval(updateDashboard, 1500);
  </script>
</body>
</html>`;
}
