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
    .btn-warning {
      color: #fbbf24 !important;
      border-color: #f59e0b !important;
      background: rgba(245, 158, 11, 0.15) !important;
      animation: pulse-warn 1s infinite alternate;
    }
    .btn-warning:hover {
      background: rgba(245, 158, 11, 0.25) !important;
    }
    @keyframes pulse-warn {
      from { border-color: #f59e0b; }
      to { border-color: #ef4444; }
    }
    .spin {
      display: inline-block;
      animation: sg-spin 0.8s linear infinite;
    }
    @keyframes sg-spin {
      100% { transform: rotate(360deg); }
    }

    /* Toast Notification System */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast-item {
      background: var(--card-bg);
      color: var(--text);
      border: 1px solid var(--card-border);
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(0);
      opacity: 1;
    }
    .toast-item.hide {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    .toast-success { border-left: 4px solid var(--success); }
    .toast-warning { border-left: 4px solid var(--warning); }
    .toast-danger { border-left: 4px solid var(--danger); }
    .toast-info { border-left: 4px solid var(--primary); }

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
      .desk-dual-monitors { grid-template-columns: 1fr; }
    }

    /* ========================================================
       🏢 VIRTUAL OFFICE WORKSPACE STYLES
       ======================================================== */
    .office-floor {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: var(--card-shadow);
      background-image: radial-gradient(var(--card-border) 1.5px, transparent 1.5px);
      background-size: 24px 24px;
      position: relative;
    }

    .office-war-room {
      background: linear-gradient(135deg, rgba(2, 132, 199, 0.06), rgba(124, 58, 237, 0.06));
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 18px 22px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      position: relative;
      overflow: hidden;
    }
    .office-war-room::before {
      content: "";
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
      background: linear-gradient(180deg, var(--primary), var(--purple));
    }
    .war-room-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .war-room-meta {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .war-room-stats {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .war-stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
    }

    .office-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .office-section-header h2 {
      font-size: 16px;
      font-weight: 800;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .office-tagline {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* Desk Grid */
    .office-desks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    /* Interactive Desk Card */
    .office-desk {
      background: var(--card-bg);
      border: 1.5px solid var(--card-border);
      border-radius: 16px;
      padding: 16px;
      box-shadow: var(--card-shadow);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .office-desk:hover {
      border-color: var(--primary);
      transform: translateY(-4px);
      box-shadow: var(--card-shadow-hover), 0 12px 28px -6px rgba(2, 132, 199, 0.15);
    }

    /* State-based Desk Light Cones / Indicators */
    .office-desk.status-coding {
      border-color: rgba(2, 132, 199, 0.5);
    }
    .office-desk.status-coding .desk-lamp-cone {
      background: radial-gradient(circle at 85% 15%, rgba(2, 132, 199, 0.2) 0%, transparent 60%);
    }

    .office-desk.status-red_tested {
      border-color: rgba(220, 38, 38, 0.6);
      animation: desk-alert-pulse 1.8s infinite;
    }
    .office-desk.status-red_tested .desk-lamp-cone {
      background: radial-gradient(circle at 85% 15%, rgba(220, 38, 38, 0.25) 0%, transparent 60%);
    }
    @keyframes desk-alert-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.2); }
      50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
    }

    .office-desk.status-green {
      border-color: rgba(5, 150, 105, 0.5);
    }
    .office-desk.status-green .desk-lamp-cone {
      background: radial-gradient(circle at 85% 15%, rgba(5, 150, 105, 0.2) 0%, transparent 60%);
    }

    .office-desk.status-merged {
      border-color: rgba(124, 58, 237, 0.4);
    }

    .office-desk.status-idle {
      opacity: 0.9;
    }

    .desk-lamp-cone {
      position: absolute;
      top: 0; right: 0; width: 100%; height: 100%;
      pointer-events: none;
      transition: background 0.3s ease;
      z-index: 1;
    }

    /* Desk Header: Member & Status */
    .desk-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      z-index: 2;
    }
    .desk-member-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .desk-avatar-wrapper {
      position: relative;
    }
    .desk-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--nav-bg);
      border: 1.5px solid var(--card-border);
      font-size: 20px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    .desk-avatar-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--card-bg);
    }
    .desk-avatar-indicator.active {
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
    }
    .desk-avatar-indicator.warning {
      background: var(--danger);
      box-shadow: 0 0 8px var(--danger);
      animation: pulse 1s infinite;
    }
    .desk-avatar-indicator.idle {
      background: var(--text-muted);
    }

    .desk-member-names h3 {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .desk-member-role {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .desk-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      z-index: 2;
    }

    /* Desk Surface & Dual Screens */
    .desk-surface {
      background: var(--card-subtle-bg);
      border: 1px solid var(--card-subtle-border);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 2;
      position: relative;
    }

    .desk-dual-monitors {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 8px;
    }
    .desk-screen {
      background: #0f172a;
      border: 1.5px solid #334155;
      border-radius: 8px;
      padding: 8px;
      min-height: 74px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
    }
    .desk-screen-titlebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
      padding-bottom: 3px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .desk-screen-dots {
      display: flex;
      gap: 3px;
    }
    .desk-screen-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }
    .desk-screen-dot.red { background: #ef4444; }
    .desk-screen-dot.yellow { background: #f59e0b; }
    .desk-screen-dot.green { background: #10b981; }
    .desk-screen-tab {
      font-size: 9px;
      color: #94a3b8;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 90px;
    }

    .desk-code-lines {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 2px;
    }
    .desk-code-line {
      height: 3px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.2);
    }
    .desk-code-line.active {
      background: var(--primary);
      box-shadow: 0 0 6px var(--primary);
      animation: code-pulse 1.2s infinite alternate;
    }
    @keyframes code-pulse {
      from { opacity: 0.4; width: 40%; }
      to { opacity: 1; width: 85%; }
    }

    .desk-status-screen {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 4px;
      background: #1e293b;
      border-color: #475569;
    }
    .desk-status-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }

    /* Desk Accessories Bar */
    .desk-accessories {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      padding-top: 4px;
      border-top: 1px dashed var(--card-border);
    }
    .desk-coffee {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .steam-icon {
      display: inline-block;
      animation: steam 1.5s infinite ease-out;
    }
    @keyframes steam {
      0% { transform: translateY(0) scaleX(1); opacity: 0.8; }
      50% { transform: translateY(-3px) scaleX(1.2); opacity: 0.5; }
      100% { transform: translateY(-6px) scaleX(0.8); opacity: 0; }
    }
    .desk-note {
      background: #fef08a;
      color: #854d0e;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      transform: rotate(-2deg);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Lower Office Zones: QA Lab & Lounge */
    .office-lower-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 18px;
    }
    .office-qa-zone, .office-lounge-zone {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .zone-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .qa-spec-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .qa-metric-card {
      background: var(--card-subtle-bg);
      border: 1px solid var(--card-subtle-border);
      border-radius: 8px;
      padding: 8px;
      text-align: center;
    }
    .qa-metric-val {
      font-size: 14px;
      font-weight: 800;
      color: var(--primary);
    }
    .qa-metric-lbl {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .lounge-avatars-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }
    .lounge-avatar-item {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--nav-bg);
      border: 1px solid var(--card-border);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    /* ========================================================
       🗺️ REALISTIC 2D ARCHITECTURAL FLOORPLAN STYLES
       ======================================================== */
    .office-view-toggle {
      display: inline-flex;
      background: var(--nav-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 3px;
      gap: 4px;
    }
    .view-toggle-btn {
      padding: 6px 12px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .view-toggle-btn:hover {
      color: var(--text);
    }
    .view-toggle-btn.active {
      background: var(--card-bg);
      color: var(--primary);
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }

    .floorplan-container {
      position: relative;
      background: var(--card-bg);
      border: 2px solid var(--card-border);
      border-radius: 20px;
      min-height: 680px;
      box-shadow: var(--card-shadow);
      background-image: 
        linear-gradient(var(--card-subtle-border) 1px, transparent 1px),
        linear-gradient(90deg, var(--card-subtle-border) 1px, transparent 1px);
      background-size: 28px 28px;
      margin-bottom: 24px;
      overflow: hidden;
      box-sizing: border-box;
      user-select: none;
    }

    /* Corridors / Lối đi */
    .floorplan-hallway {
      position: absolute;
      background: rgba(148, 163, 184, 0.08);
      z-index: 1;
    }
    .floorplan-hallway-h {
      top: 295px;
      left: 0;
      right: 0;
      height: 70px;
      border-top: 1.5px dashed var(--card-border);
      border-bottom: 1.5px dashed var(--card-border);
    }
    .floorplan-hallway-v {
      left: calc(52% - 35px);
      top: 0;
      bottom: 0;
      width: 70px;
      border-left: 1.5px dashed var(--card-border);
      border-right: 1.5px dashed var(--card-border);
    }
    .hallway-carpet {
      position: absolute;
      top: 15px; bottom: 15px; left: 0; right: 0;
      background: rgba(2, 132, 199, 0.04);
      border-radius: 4px;
    }
    .hallway-guide-line {
      position: absolute;
      top: 50%; left: 0; right: 0;
      height: 2px;
      border-top: 2px dashed rgba(2, 132, 199, 0.25);
    }
    .hallway-direction-arrow {
      position: absolute;
      color: rgba(148, 163, 184, 0.5);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    /* Walking Personnel along corridors */
    .walking-agent {
      position: absolute;
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      animation: walk-corridor 24s infinite linear;
    }
    .walking-agent-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.25);
      border: 1.5px solid #fff;
      position: relative;
    }
    .walking-agent-avatar::after {
      content: "☕";
      position: absolute;
      top: -6px;
      right: -8px;
      font-size: 10px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
    .walking-agent-tag {
      background: var(--nav-bg);
      border: 1px solid var(--card-border);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 700;
      color: var(--text);
      white-space: nowrap;
      margin-top: 3px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    @keyframes walk-corridor {
      0% { left: 40px; top: 312px; }
      35% { left: calc(52% - 15px); top: 312px; }
      40% { left: calc(52% - 15px); top: 312px; }
      50% { left: calc(52% - 15px); top: 580px; }
      55% { left: calc(52% - 15px); top: 580px; }
      65% { left: calc(52% - 15px); top: 312px; }
      70% { left: calc(52% - 15px); top: 120px; }
      80% { left: calc(52% - 15px); top: 312px; }
      100% { left: 40px; top: 312px; }
    }

    /* War Room / Meeting Room 2D */
    .floorplan-meeting-room {
      position: absolute;
      top: 20px;
      left: 20px;
      width: calc(52% - 65px);
      height: 255px;
      background: rgba(2, 132, 199, 0.03);
      border: 2px solid rgba(2, 132, 199, 0.35);
      border-radius: 16px;
      padding: 16px;
      box-sizing: border-box;
      z-index: 2;
    }
    .meeting-room-title {
      font-size: 11px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
    }
    .meeting-table-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 10px;
    }
    .meeting-table {
      width: 170px;
      height: 80px;
      background: linear-gradient(135deg, #334155, #1e293b);
      border: 2px solid #64748b;
      border-radius: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
      color: #cbd5e1;
      font-size: 10px;
      font-weight: 700;
      position: relative;
    }
    .meeting-chairs-top, .meeting-chairs-bottom {
      display: flex;
      gap: 24px;
    }
    .meeting-chair {
      width: 20px;
      height: 18px;
      background: #475569;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .smart-board {
      background: #0f172a;
      border: 1.5px solid #38bdf8;
      border-radius: 8px;
      padding: 6px 12px;
      color: #38bdf8;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* QA & Server Lab 2D */
    .floorplan-qa-lab {
      position: absolute;
      top: 20px;
      right: 20px;
      width: calc(48% - 50px);
      height: 255px;
      background: rgba(5, 150, 105, 0.03);
      border: 2px solid rgba(5, 150, 105, 0.35);
      border-radius: 16px;
      padding: 16px;
      box-sizing: border-box;
      z-index: 2;
    }
    .qa-lab-title {
      font-size: 11px;
      font-weight: 800;
      color: var(--success);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
    }
    .server-racks-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .server-rack {
      width: 55px;
      height: 65px;
      background: #0f172a;
      border: 1.5px solid #334155;
      border-radius: 6px;
      padding: 4px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .rack-unit {
      height: 10px;
      background: #1e293b;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 4px;
      gap: 3px;
    }
    .led-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
      animation: blink-led 1.2s infinite alternate ease-in-out;
    }
    .led-dot.blue { background: #38bdf8; box-shadow: 0 0 6px #38bdf8; animation-delay: 0.3s; }
    .led-dot.red { background: #ef4444; box-shadow: 0 0 6px #ef4444; animation-delay: 0.6s; }
    @keyframes blink-led {
      0% { opacity: 0.3; }
      100% { opacity: 1; }
    }

    /* Engineering Bays 2D Floorplan */
    .floorplan-engineering-bay {
      position: absolute;
      top: 385px;
      left: 20px;
      width: calc(60% - 65px);
      height: 275px;
      background: rgba(124, 58, 237, 0.03);
      border: 2px solid rgba(124, 58, 237, 0.3);
      border-radius: 16px;
      padding: 14px;
      box-sizing: border-box;
      z-index: 2;
    }
    .engineering-bay-title {
      font-size: 11px;
      font-weight: 800;
      color: var(--purple);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
    }
    .workstations-grid-2d {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 14px;
    }

    /* 2D Workstation */
    .floorplan-workstation {
      background: var(--card-bg);
      border: 1.5px solid var(--card-border);
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .floorplan-workstation:hover {
      border-color: var(--primary);
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 20px rgba(2, 132, 199, 0.2);
    }
    .floorplan-workstation.status-coding {
      border-color: rgba(2, 132, 199, 0.6);
      box-shadow: 0 0 12px rgba(2, 132, 199, 0.2);
    }
    .floorplan-workstation.status-red_tested {
      border-color: rgba(220, 38, 38, 0.7);
      animation: desk-alert-pulse 1.8s infinite;
    }
    .floorplan-workstation.status-green {
      border-color: rgba(5, 150, 105, 0.6);
      box-shadow: 0 0 12px rgba(5, 150, 105, 0.2);
    }
    .floorplan-workstation.status-merged {
      border-color: rgba(124, 58, 237, 0.4);
    }

    /* Top-Down Desk Components */
    .workstation-desk-surface {
      width: 100%;
      height: 36px;
      background: linear-gradient(180deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.25));
      border: 1px solid var(--card-border);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      position: relative;
      margin-bottom: 6px;
    }
    .topdown-monitors {
      display: flex;
      gap: 4px;
    }
    .topdown-screen {
      width: 36px;
      height: 8px;
      background: #0f172a;
      border: 1.5px solid #334155;
      border-radius: 2px;
      position: relative;
    }
    .status-coding .topdown-screen {
      border-color: #38bdf8;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
    }
    .status-red_tested .topdown-screen {
      border-color: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    }
    .status-green .topdown-screen {
      border-color: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
    }
    .topdown-keyboard {
      width: 22px;
      height: 9px;
      background: #334155;
      border-radius: 2px;
      border: 1px solid #475569;
    }
    .topdown-mouse {
      width: 5px;
      height: 8px;
      background: #64748b;
      border-radius: 3px;
    }

    /* Top-Down Person Avatar */
    .floorplan-person {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      margin-top: -8px;
      z-index: 3;
    }
    .person-head {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      position: relative;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      border: 1.5px solid rgba(255,255,255,0.7);
    }
    .person-headphones {
      position: absolute;
      top: -3px; left: -3px; right: -3px; bottom: -3px;
      border: 2px solid #1e293b;
      border-radius: 50%;
      pointer-events: none;
    }
    .person-shoulders {
      width: 36px;
      height: 12px;
      background: #38bdf8;
      border-radius: 6px;
      margin-top: -4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    .person-chair {
      width: 42px;
      height: 14px;
      background: #334155;
      border-radius: 8px;
      margin-top: -3px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.2);
    }
    .person-typing {
      animation: person-typing-motion 1.2s infinite alternate ease-in-out;
    }
    @keyframes person-typing-motion {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-2px); }
    }

    .workstation-nametag {
      font-size: 10px;
      font-weight: 800;
      color: var(--text);
      margin-top: 6px;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .workstation-status-pill {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      margin-top: 3px;
      white-space: nowrap;
    }

    /* Breakroom / Pantry Lounge 2D */
    .floorplan-pantry {
      position: absolute;
      top: 385px;
      right: 20px;
      width: calc(40% - 50px);
      height: 275px;
      background: rgba(234, 88, 12, 0.03);
      border: 2px solid rgba(234, 88, 12, 0.35);
      border-radius: 16px;
      padding: 14px;
      box-sizing: border-box;
      z-index: 2;
    }
    .pantry-title {
      font-size: 11px;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
    }
    .pantry-bar-counter {
      width: 100%;
      height: 38px;
      background: linear-gradient(135deg, #78350f, #92400e);
      border: 1.5px solid #b45309;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      color: #fff;
      font-size: 14px;
    }
    .pantry-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .coffee-machine-steam {
      font-size: 14px;
      animation: steam-rise 1.5s infinite ease-out;
    }
    @keyframes steam-rise {
      0% { opacity: 0.2; transform: translateY(0); }
      50% { opacity: 0.9; transform: translateY(-3px); }
      100% { opacity: 0.1; transform: translateY(-6px); }
    }
    .pantry-stools-row {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
    }
    .pantry-stool {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #64748b;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .pantry-break-agents {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .pantry-break-agent-chip {
      background: var(--nav-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .potted-plant {
      font-size: 16px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }

    /* ==========================================================================
       GATHER.TOWN STYLE 2.5D RPG 3/4 VIRTUAL OFFICE WORKSPACE
       ========================================================================== */
    .gather-office {
      position: relative;
      background: var(--card-bg);
      border: 2px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      margin-bottom: 24px;
      user-select: none;
    }
    .gather-map {
      position: relative;
      width: 100%;
      min-width: 900px;
      height: 600px;
      background-color: #f8fafc;
      background-image: 
        radial-gradient(circle at 50% 50%, rgba(2, 132, 199, 0.04) 0%, transparent 80%),
        linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px);
      background-size: 100% 100%, 32px 32px, 32px 32px;
    }
    [data-theme="dark"] .gather-map {
      background-color: #0d1322;
      background-image: 
        radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 80%),
        linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    }
    .gather-corridor-h {
      position: absolute;
      left: 0; right: 0;
      top: 255px; height: 80px;
      background: rgba(2, 132, 199, 0.06);
      border-top: 2px dashed rgba(2, 132, 199, 0.18);
      border-bottom: 2px dashed rgba(2, 132, 199, 0.18);
      z-index: 2;
    }
    .gather-corridor-v {
      position: absolute;
      top: 0; bottom: 0;
      left: 450px; width: 80px;
      background: rgba(2, 132, 199, 0.06);
      border-left: 2px dashed rgba(2, 132, 199, 0.18);
      border-right: 2px dashed rgba(2, 132, 199, 0.18);
      z-index: 2;
    }
    .gather-carpet-runner-h {
      position: absolute;
      top: 14px; bottom: 14px;
      left: 0; right: 0;
      background: linear-gradient(180deg, #38bdf8 0%, #0284c7 100%);
      opacity: 0.15;
      border-radius: 4px;
    }
    .gather-carpet-runner-v {
      position: absolute;
      left: 14px; right: 14px;
      top: 0; bottom: 0;
      background: linear-gradient(90deg, #38bdf8 0%, #0284c7 100%);
      opacity: 0.15;
      border-radius: 4px;
    }
    .gather-room {
      position: absolute;
      border-radius: 12px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06);
      z-index: 5;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .gather-wall-top {
      height: 20px;
      background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
      border-bottom: 2px solid #475569;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
      font-size: 10px;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    [data-theme="dark"] .gather-wall-top {
      background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
      border-bottom: 2px solid #0f172a;
    }
    .gather-room-war {
      top: 14px; left: 14px;
      width: 422px; height: 228px;
      background: radial-gradient(circle at 50% 30%, rgba(2, 132, 199, 0.05) 0%, var(--card-bg) 100%);
    }
    .gather-room-qa {
      top: 14px; right: 14px;
      width: 422px; height: 228px;
      background: radial-gradient(circle at 50% 30%, rgba(5, 150, 105, 0.05) 0%, var(--card-bg) 100%);
    }
    .gather-room-eng {
      bottom: 14px; left: 14px;
      width: 532px; height: 228px;
      background: radial-gradient(circle at 50% 30%, rgba(124, 58, 237, 0.05) 0%, var(--card-bg) 100%);
    }
    .gather-room-pantry {
      bottom: 14px; right: 14px;
      width: 312px; height: 228px;
      background: radial-gradient(circle at 50% 30%, rgba(217, 119, 6, 0.05) 0%, var(--card-bg) 100%);
    }
    .gather-room-body {
      padding: 10px 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .gather-smartboard {
      background: #0f172a;
      border: 2px solid #334155;
      border-radius: 8px;
      padding: 8px 12px;
      color: #38bdf8;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .gather-smartboard-title {
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .gather-smartboard-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
    }
    .gather-conf-table {
      margin: auto auto 4px auto;
      width: 82%;
      height: 70px;
      background: linear-gradient(180deg, #9a3412 0%, #7c2d12 70%, #451a03 100%);
      border: 2px solid #ea580c;
      border-radius: 20px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fed7aa;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .gather-server-area {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 4px;
    }
    .gather-server-rack {
      width: 58px;
      height: 95px;
      background: #0f172a;
      border: 2px solid #334155;
      border-radius: 8px;
      padding: 5px 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.2);
    }
    .gather-server-unit {
      height: 14px;
      background: #1e293b;
      border-radius: 3px;
      display: flex;
      align-items: center;
      padding: 0 4px;
      gap: 4px;
    }
    .gather-workstations-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 4px;
    }
    .gather-desk {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.06);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .gather-desk:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px -2px rgba(2, 132, 199, 0.25);
      border-color: var(--primary);
    }
    .gather-desk.state-claimed { border-left: 3px solid var(--primary); }
    .gather-desk.state-red { border-left: 3px solid var(--danger); background: var(--danger-dim); }
    .gather-desk.state-green { border-left: 3px solid var(--success); }
    .gather-desk.state-merged { border-left: 3px solid var(--purple); opacity: 0.85; }
    .gather-monitors {
      display: flex;
      gap: 4px;
      margin-bottom: 4px;
    }
    .gather-monitor {
      width: 44px;
      height: 26px;
      background: #020617;
      border: 2px solid #334155;
      border-radius: 4px;
      position: relative;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-size: 8px;
      font-weight: 800;
      color: #38bdf8;
      overflow: hidden;
    }
    .gather-desk-surface {
      width: 100%;
      height: 14px;
      background: linear-gradient(180deg, #d97706 0%, #b45309 80%, #78350f 100%);
      border-radius: 3px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
      margin-bottom: 4px;
      position: relative;
    }
    .gather-keyboard {
      position: absolute;
      top: 2px; left: 50%;
      transform: translateX(-50%);
      width: 26px; height: 5px;
      background: #334155;
      border-radius: 1px;
    }
    .gather-character-area {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      justify-content: flex-start;
    }
    .gather-character {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      position: relative;
      flex-shrink: 0;
    }
    .gather-character.typing::after {
      content: '⌨️';
      position: absolute;
      bottom: -6px;
      right: -6px;
      font-size: 10px;
      animation: bounce-typing 0.8s infinite alternate;
    }
    .gather-worker-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.1;
      overflow: hidden;
    }
    .gather-worker-name {
      font-size: 9px;
      font-weight: 800;
      color: var(--text);
      white-space: nowrap;
    }
    .gather-worker-task {
      font-size: 8px;
      font-weight: 700;
      white-space: nowrap;
    }
    .gather-bar-counter {
      display: flex;
      gap: 8px;
      background: linear-gradient(180deg, #78350f 0%, #451a03 100%);
      border: 2px solid #b45309;
      border-radius: 8px;
      padding: 6px 8px;
      color: #fef3c7;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .gather-walking-agent {
      position: absolute;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--card-bg);
      border: 1px solid var(--primary);
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      animation: gather-patrol 20s ease-in-out infinite;
    }
    @keyframes gather-patrol {
      0%   { top: 275px; left: 60px; }
      25%  { top: 275px; left: 460px; }
      50%  { top: 80px;  left: 460px; }
      75%  { top: 275px; left: 460px; }
      100% { top: 275px; left: 60px; }
    }

    /* ==========================================================================
       2.5D ISOMETRIC VIRTUAL OFFICE ARCHITECTURAL STYLES
       ========================================================================== */
    .iso-scene {
      position: relative;
      background: var(--card-bg);
      border: 2px solid var(--card-border);
      border-radius: 20px;
      min-height: 720px;
      box-shadow: var(--card-shadow);
      margin-bottom: 24px;
      overflow: hidden;
      perspective: 1400px;
      perspective-origin: 50% 30%;
      transform-style: preserve-3d;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 10px;
      user-select: none;
      box-sizing: border-box;
    }

    .iso-controls {
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      background: var(--nav-bg);
      padding: 6px 10px;
      border-radius: 12px;
      border: 1px solid var(--card-border);
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .iso-ctrl-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .iso-ctrl-btn:hover {
      background: var(--card-hover);
      border-color: var(--primary);
      transform: translateY(-1px);
    }

    .iso-stage {
      position: relative;
      width: 860px;
      height: 580px;
      background: var(--card-subtle-bg);
      border: 2px solid var(--card-border);
      border-radius: 14px;
      transform: rotateX(56deg) rotateZ(-38deg) scale(0.92);
      transform-style: preserve-3d;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 
        -25px 25px 50px rgba(0, 0, 0, 0.25),
        -5px 5px 15px rgba(0, 0, 0, 0.15),
        0 0 0 1px var(--card-border);
      background-image:
        linear-gradient(var(--card-subtle-border) 1px, transparent 1px),
        linear-gradient(90deg, var(--card-subtle-border) 1px, transparent 1px);
      background-size: 30px 30px;
      margin: 40px auto;
    }

    /* 3D Elevated Room Zones */
    .iso-room {
      position: absolute;
      border-radius: 14px;
      transform-style: preserve-3d;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }

    .iso-room-war {
      top: 15px;
      left: 15px;
      width: 440px;
      height: 240px;
      background: rgba(2, 132, 199, 0.04);
      border: 2px solid rgba(2, 132, 199, 0.4);
      transform: translateZ(8px);
      box-shadow: -4px 6px 14px rgba(0,0,0,0.12);
      padding: 12px;
    }

    .iso-room-qa {
      top: 15px;
      right: 15px;
      width: 360px;
      height: 240px;
      background: rgba(5, 150, 105, 0.04);
      border: 2px solid rgba(5, 150, 105, 0.4);
      transform: translateZ(8px);
      box-shadow: -4px 6px 14px rgba(0,0,0,0.12);
      padding: 12px;
    }

    .iso-room-eng {
      bottom: 15px;
      left: 15px;
      width: 520px;
      height: 270px;
      background: rgba(124, 58, 237, 0.04);
      border: 2px solid rgba(124, 58, 237, 0.35);
      transform: translateZ(8px);
      box-shadow: -4px 6px 14px rgba(0,0,0,0.12);
      padding: 12px;
    }

    .iso-room-pantry {
      bottom: 15px;
      right: 15px;
      width: 280px;
      height: 270px;
      background: rgba(234, 88, 12, 0.04);
      border: 2px solid rgba(234, 88, 12, 0.4);
      transform: translateZ(8px);
      box-shadow: -4px 6px 14px rgba(0,0,0,0.12);
      padding: 12px;
    }

    /* 3D Corridors */
    .iso-hallway-h {
      position: absolute;
      top: 268px;
      left: 0;
      right: 0;
      height: 48px;
      background: rgba(148, 163, 184, 0.08);
      border-top: 1px dashed var(--card-border);
      border-bottom: 1px dashed var(--card-border);
      transform: translateZ(2px);
    }
    .iso-hallway-v {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 470px;
      width: 48px;
      background: rgba(148, 163, 184, 0.08);
      border-left: 1px dashed var(--card-border);
      border-right: 1px dashed var(--card-border);
      transform: translateZ(2px);
    }

    /* 3D Meeting Table in War Room */
    .iso-meeting-table {
      position: absolute;
      top: 75px;
      left: 110px;
      width: 220px;
      height: 100px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 2px solid #475569;
      border-radius: 50px;
      transform: translateZ(24px);
      transform-style: preserve-3d;
      box-shadow: -8px 12px 20px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 11px;
      font-weight: 800;
    }
    .iso-smartboard-3d {
      position: absolute;
      top: 8px;
      left: 100px;
      width: 240px;
      height: 28px;
      background: #0f172a;
      border: 1.5px solid #38bdf8;
      border-radius: 6px;
      transform: translateZ(32px) rotateX(-20deg);
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
      color: #38bdf8;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 10px;
    }

    /* 3D Server Racks in QA Lab */
    .iso-server-cluster {
      display: flex;
      gap: 16px;
      transform: translateZ(10px);
      transform-style: preserve-3d;
    }
    .iso-server-rack-3d {
      width: 58px;
      height: 90px;
      background: #0f172a;
      border: 1.5px solid #334155;
      border-radius: 6px;
      transform: translateZ(28px) rotateX(-25deg);
      box-shadow: -6px 10px 18px rgba(0,0,0,0.35);
      padding: 5px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* 3D Workstation Desks */
    .iso-workstations-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      transform-style: preserve-3d;
    }
    .iso-workstation {
      position: relative;
      background: var(--card-bg);
      border: 1.5px solid var(--card-border);
      border-radius: 12px;
      padding: 10px 8px;
      transform: translateZ(22px);
      transform-style: preserve-3d;
      box-shadow: -6px 8px 16px rgba(0,0,0,0.18);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .iso-workstation:hover {
      transform: translateZ(35px) scale(1.05);
      box-shadow: -10px 16px 28px rgba(2, 132, 199, 0.35);
      border-color: var(--primary);
    }
    .iso-desk-3d {
      width: 100%;
      height: 48px;
      background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.35));
      border: 1px solid var(--card-border);
      border-radius: 6px;
      transform-style: preserve-3d;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    /* 3D Monitors standing upright */
    .iso-monitors-row {
      display: flex;
      gap: 6px;
      transform: translateZ(16px) rotateX(-50deg);
      transform-origin: bottom center;
      transform-style: preserve-3d;
    }
    .iso-screen-3d {
      width: 44px;
      height: 22px;
      background: #090d16;
      border: 1.5px solid #334155;
      border-radius: 3px;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #38bdf8;
      font-family: monospace;
      position: relative;
    }
    .status-coding .iso-screen-3d {
      border-color: #38bdf8;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
    }
    .status-red_tested .iso-screen-3d {
      border-color: #ef4444;
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
    }
    .status-green .iso-screen-3d {
      border-color: #22c55e;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
    }
    .status-merged .iso-screen-3d {
      border-color: #a855f7;
      box-shadow: 0 0 12px rgba(168, 85, 247, 0.5);
    }

    /* 3D Seated Personnel Avatar */
    .iso-person-3d {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translateZ(26px);
      transform-style: preserve-3d;
      margin-top: -6px;
    }
    .iso-person-head {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #0284c7;
      border: 2px solid rgba(255,255,255,0.8);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      position: relative;
      transform: rotateX(-35deg);
    }
    .iso-person-body {
      width: 32px;
      height: 14px;
      background: #38bdf8;
      border-radius: 6px;
      margin-top: -3px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .iso-chair-3d {
      width: 28px;
      height: 18px;
      background: #334155;
      border-radius: 8px;
      margin-top: -6px;
      transform: translateZ(-8px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    /* Walking Personnel 2.5D */
    .iso-walking-agent {
      position: absolute;
      transform: translateZ(18px);
      transform-style: preserve-3d;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      animation: iso-walk 24s infinite linear;
      z-index: 50;
    }
    @keyframes iso-walk {
      0% { left: 40px; top: 280px; }
      35% { left: 480px; top: 280px; }
      40% { left: 480px; top: 280px; }
      50% { left: 480px; top: 480px; }
      55% { left: 480px; top: 480px; }
      65% { left: 480px; top: 280px; }
      70% { left: 480px; top: 60px; }
      80% { left: 480px; top: 280px; }
      100% { left: 40px; top: 280px; }
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
      <button class="btn" id="btn-refresh" onclick="handleRefreshClick()" title="Tải lại ngay">🔄 Làm mới</button>
      <button class="btn" id="btn-copy-state" onclick="copyStateJson()" title="Sao chép toàn bộ state JSON">📋 Copy State</button>
      <button class="btn btn-primary" id="btn-init-demo" onclick="initDemoMission()" style="display: none;">🚀 Khởi tạo Demo Mission</button>
      <button class="btn btn-danger" id="btn-reset" onclick="handleResetClick()" style="display: none;">🗑️ Reset Mission</button>
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
      <button class="tab-btn active" id="tab-btn-office" onclick="switchTab('office')">🏢 Văn Phòng Team</button>
      <button class="tab-btn" id="tab-btn-dag" onclick="switchTab('dag')">🌊 Sóng DAG</button>
      <button class="tab-btn" id="tab-btn-workers" onclick="switchTab('workers')">🤖 Agents &amp; Worktrees</button>
      <button class="tab-btn" id="tab-btn-logs" onclick="switchTab('logs')">📜 Dòng Nhật Ký</button>
    </div>
    <div class="filter-area" id="filter-area">
      <input
        type="text"
        id="search-input"
        class="search-input"
        placeholder="Tìm kiếm theo mã task, tên, worker..."
        oninput="renderActiveTab()"
      />
      <select id="status-filter" class="status-select" onchange="renderActiveTab()">
        <option value="ALL">Tất cả trạng thái</option>
        <option value="ready">Sẵn sàng (Ready)</option>
        <option value="claimed">Đang làm (Claimed)</option>
        <option value="red_tested">Đang test RED</option>
        <option value="green">Test GREEN xong</option>
        <option value="merged">Đã Merge</option>
      </select>
    </div>
  </div>

  <!-- Tab Content: Virtual Office -->
  <div id="content-office">
    <!-- War Room Strategy Board -->
    <div class="office-war-room" id="office-war-room">
      <div>
        <div class="war-room-title">🎯 PHÒNG CHỈ HUY CHIẾN LƯỢC SPRINT</div>
        <div class="war-room-meta" id="office-objective-text">Đang đồng bộ mục tiêu sứ mệnh...</div>
      </div>
      <div class="war-room-stats" id="office-quick-stats">
        <span class="war-stat-badge" style="color:var(--primary);"><span class="live-dot"></span> Sóng Hiện Tại: <span id="office-current-wave">Wave 1</span></span>
        <span class="war-stat-badge" style="color:var(--success);">✅ Đã Hoàn Thành: <span id="office-progress-percent">0%</span></span>
      </div>
    </div>

    <!-- Office View Mode Toggle -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div class="office-view-toggle">
        <button id="btn-view-gather" class="view-toggle-btn active" onclick="setOfficeView('gather')">🎮 Văn Phòng 2.5D RPG</button>
        <button id="btn-view-floorplan" class="view-toggle-btn" onclick="setOfficeView('floorplan')">🗺️ Mặt Bằng 2D</button>
        <button id="btn-view-iso" class="view-toggle-btn" onclick="setOfficeView('iso')">🏛️ 3D Nghiêng</button>
        <button id="btn-view-pods" class="view-toggle-btn" onclick="setOfficeView('pods')">💻 Bàn Chi Tiết</button>
      </div>
      <span class="office-tagline" id="office-active-count">Đang hiển thị không gian văn phòng ảo</span>
    </div>

    <!-- VIEW 0: GATHER.TOWN STYLE 2.5D RPG 3/4 VIRTUAL OFFICE -->
    <div id="office-gather-wrapper" style="display: block;">
      <div class="gather-office">
        <div class="gather-map">
          <!-- Corridors with runner carpets -->
          <div class="gather-corridor-h">
            <div class="gather-carpet-runner-h"></div>
          </div>
          <div class="gather-corridor-v">
            <div class="gather-carpet-runner-v"></div>
          </div>

          <!-- Animated Walking Personnel -->
          <div class="gather-walking-agent">
            <span>🏃</span>
            <span>Sprint Runner</span>
          </div>

          <!-- Room 1: War Room (Top-Left) -->
          <div class="gather-room gather-room-war">
            <div class="gather-wall-top">
              <span>🎯 Phòng Chỉ Huy Chiến Lược (War Room)</span>
              <span id="gather-smartboard-wave" class="gather-smartboard-badge">Wave 1</span>
            </div>
            <div class="gather-room-body">
              <div class="gather-smartboard">
                <div class="gather-smartboard-title">
                  <span>📋</span>
                  <span id="gather-smartboard-title">Sprint Strategic Board</span>
                </div>
                <div id="gather-meeting-percent" class="gather-smartboard-badge" style="color:var(--primary); font-size:11px;">0% Hoàn thành</div>
              </div>

              <div class="gather-conf-table">
                <span>BOARDROOM</span>
                <!-- Chairs around conference table -->
                <div class="gather-conf-chair" style="top:-14px; left:20%;"></div>
                <div class="gather-conf-chair" style="top:-14px; left:50%;"></div>
                <div class="gather-conf-chair" style="top:-14px; left:80%;"></div>
                <div class="gather-conf-chair" style="bottom:-14px; left:20%;"></div>
                <div class="gather-conf-chair" style="bottom:-14px; left:50%;"></div>
                <div class="gather-conf-chair" style="bottom:-14px; left:80%;"></div>
              </div>

              <!-- Seated Lead Architect -->
              <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                <div class="gather-character" style="background:linear-gradient(135deg, #0284c7, #38bdf8);">📐</div>
                <div style="font-size:10px; font-weight:800;">
                  @architect <span style="font-size:9px; color:var(--text-muted);">(Lead Architect)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Room 2: QA & Server Lab (Top-Right) -->
          <div class="gather-room gather-room-qa">
            <div class="gather-wall-top">
              <span>🧪 Phòng Kiểm Thử &amp; Server (QA Lab)</span>
              <span style="font-size:9px; color:#a7f3d0;">60 FPS CDP</span>
            </div>
            <div class="gather-room-body">
              <div class="gather-server-area">
                <div class="gather-server-rack">
                  <div class="gather-server-unit"><span class="led-dot"></span></div>
                  <div class="gather-server-unit"><span class="led-dot blue"></span></div>
                  <div class="gather-server-unit"><span class="led-dot red"></span></div>
                  <div class="gather-server-unit"><span class="led-dot"></span></div>
                </div>
                <div class="gather-server-rack">
                  <div class="gather-server-unit"><span class="led-dot blue"></span></div>
                  <div class="gather-server-unit"><span class="led-dot"></span></div>
                  <div class="gather-server-unit"><span class="led-dot"></span></div>
                  <div class="gather-server-unit"><span class="led-dot blue"></span></div>
                </div>
                <div style="flex:1; font-size:11px; display:flex; flex-direction:column; gap:4px;">
                  <div><strong>Browser Agent:</strong> Native CDP</div>
                  <div><strong>Axe-core:</strong> WCAG 2.1 Pass</div>
                  <div><strong>Tracing:</strong> Zero Playwright</div>
                </div>
              </div>

              <!-- QA Tester -->
              <div style="display:flex; align-items:center; gap:8px; margin-top:12px; background:var(--nav-bg); padding:6px 10px; border-radius:8px; border:1px solid var(--card-border);">
                <div class="gather-character" style="background:linear-gradient(135deg, #059669, #34d399);">🧪</div>
                <div>
                  <div style="font-size:10px; font-weight:800;">@tester-qa <span style="font-size:9px; color:var(--success);">(QA Lead)</span></div>
                  <div id="gather-qa-status-text" style="font-size:9px; color:var(--text-muted);">Sẵn sàng kiểm thử</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Room 3: Engineering Bay (Bottom-Left) -->
          <div class="gather-room gather-room-eng">
            <div class="gather-wall-top">
              <span>💻 Cụm Bàn Kỹ Thuật (Engineering Desks)</span>
              <span style="font-size:9px; color:#ddd6fe;">Dual-Monitors</span>
            </div>
            <div class="gather-room-body">
              <div class="gather-workstations-grid" id="gather-workstations-container">
                <!-- Dynamically populated Gather workstations -->
              </div>
            </div>
          </div>

          <!-- Room 4: Pantry & Coffee Bar (Bottom-Right) -->
          <div class="gather-room gather-room-pantry">
            <div class="gather-wall-top">
              <span>☕ Căng-tin &amp; Cafe (Pantry)</span>
              <span style="font-size:9px; color:#fde68a;">Free Coffee</span>
            </div>
            <div class="gather-room-body">
              <div class="gather-bar-counter">
                <div>☕ Barista</div>
                <div>🧊 Tủ lạnh</div>
                <div>💧 Nước uống</div>
              </div>
              <div style="font-size:10px; font-weight:700; color:var(--text-muted); margin-top:10px;">
                Standby Pool:
              </div>
              <div class="pantry-break-agents" id="gather-break-agents" style="margin-top:6px;">
                <!-- Dynamically populated Standby agents -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 0B: 2.5D ISOMETRIC VIRTUAL OFFICE ARCHITECTURAL SCENE -->
    <div id="office-iso-wrapper" style="display: none;">
      <div class="iso-scene" id="iso-scene">
        <!-- Interactive 3D Camera / Angle Controls -->
        <div class="iso-controls">
          <button class="iso-ctrl-btn" onclick="adjustIso('tilt', 5)" title="Tăng góc nghiêng">📐 Nghiêng +</button>
          <button class="iso-ctrl-btn" onclick="adjustIso('tilt', -5)" title="Giảm góc nghiêng">📐 Nghiêng -</button>
          <button class="iso-ctrl-btn" onclick="adjustIso('rot', 10)" title="Xoay góc trái">🔄 Xoay Trái</button>
          <button class="iso-ctrl-btn" onclick="adjustIso('rot', -10)" title="Xoay góc phải">🔄 Xoay Phải</button>
          <button class="iso-ctrl-btn" onclick="adjustIso('zoom', 0.08)" title="Phóng to">🔍 Phóng to</button>
          <button class="iso-ctrl-btn" onclick="adjustIso('zoom', -0.08)" title="Thu nhỏ">🔎 Thu nhỏ</button>
          <button class="iso-ctrl-btn" onclick="adjustIso('reset')" title="Về góc mặc định">🎯 Mặc định</button>
        </div>

        <div class="iso-stage" id="iso-stage">
          <!-- 3D Corridors with depth -->
          <div class="iso-hallway-h">
            <div class="hallway-carpet" style="top:8px; bottom:8px;"></div>
          </div>
          <div class="iso-hallway-v">
            <div class="hallway-carpet" style="top:0; bottom:0; left:8px; right:8px;"></div>
          </div>

          <!-- 2.5D Walking Personnel along corridor -->
          <div class="iso-walking-agent" id="iso-walking-agent">
            <div class="walking-agent-avatar" style="transform: rotateX(-35deg);">🏃</div>
            <div class="walking-agent-tag" style="transform: rotateX(-35deg);">Tuần tra Sprint</div>
          </div>

          <!-- Corner Foliage in 3D -->
          <div style="position: absolute; top: 250px; left: 440px; transform: translateZ(20px); z-index: 10;" class="potted-plant">🪴</div>
          <div style="position: absolute; top: 320px; left: 440px; transform: translateZ(20px); z-index: 10;" class="potted-plant">🪴</div>
          <div style="position: absolute; top: 250px; left: 525px; transform: translateZ(20px); z-index: 10;" class="potted-plant">🪴</div>
          <div style="position: absolute; top: 320px; left: 525px; transform: translateZ(20px); z-index: 10;" class="potted-plant">🪴</div>

          <!-- Room 1: War Room (Phòng Chỉ Huy Chiến Lược) 2.5D -->
          <div class="iso-room iso-room-war">
            <div class="meeting-room-title" style="transform: translateZ(14px);">🎯 Phòng Chiến Lược (War Room 2.5D)</div>
            <div class="iso-smartboard-3d">
              <span id="iso-smartboard-title">Sprint Strategic Board</span>
              <span id="iso-smartboard-wave" style="color:#f59e0b;">Wave 1</span>
            </div>
            <div class="iso-meeting-table">
              <span>BOARDROOM 2.5D</span>
              <span id="iso-meeting-percent" style="font-size:9px; color:#38bdf8;">0% Hoàn thành</span>
            </div>
            <!-- Seated Lead Architect in 2.5D -->
            <div style="position: absolute; top: 40px; left: 24px; transform: translateZ(22px); display:flex; align-items:center; gap:8px;">
              <div class="iso-person-head" style="background:#0284c7;">📐</div>
              <div style="font-size:9px; font-weight:800; color:var(--text); transform: rotateX(-35deg);">@architect<br><span style="color:var(--text-muted); font-size:8px;">Lead Architect</span></div>
            </div>
          </div>

          <!-- Room 2: QA & Server Lab 2.5D -->
          <div class="iso-room iso-room-qa">
            <div class="qa-lab-title" style="transform: translateZ(14px);">🧪 Phòng Kiểm Thử &amp; Server (QA Lab 2.5D)</div>
            <div class="iso-server-cluster">
              <div class="iso-server-rack-3d">
                <div class="rack-unit"><span class="led-dot"></span></div>
                <div class="rack-unit"><span class="led-dot blue"></span></div>
                <div class="rack-unit"><span class="led-dot red"></span></div>
                <div class="rack-unit"><span class="led-dot"></span></div>
              </div>
              <div class="iso-server-rack-3d">
                <div class="rack-unit"><span class="led-dot blue"></span></div>
                <div class="rack-unit"><span class="led-dot"></span></div>
                <div class="rack-unit"><span class="led-dot"></span></div>
                <div class="rack-unit"><span class="led-dot blue"></span></div>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:4px; font-size:10px; transform: translateZ(16px);">
                <div><strong>Rust CDP:</strong> Active</div>
                <div><strong>Axe-core:</strong> AA Pass</div>
                <div><strong>Vitals:</strong> 60 FPS</div>
              </div>
            </div>
            <!-- QA Tester seated in 2.5D -->
            <div style="display:flex; align-items:center; gap:10px; background:var(--nav-bg); padding:6px 10px; border-radius:8px; border:1px solid var(--card-border); margin-top:16px; transform: translateZ(20px);">
              <div class="iso-person-head" style="background:#059669;">🧪</div>
              <div style="font-size:10px; font-weight:800; transform: rotateX(-35deg);">
                @tester-qa <span style="font-size:9px; color:var(--success); font-weight:600;">(QA Lead)</span>
                <div id="iso-qa-status-text" style="font-size:9px; color:var(--text-muted); font-weight:normal;">Sẵn sàng chạy test suite</div>
              </div>
            </div>
          </div>

          <!-- Room 3: Engineering Bay 2.5D -->
          <div class="iso-room iso-room-eng">
            <div class="engineering-bay-title" style="transform: translateZ(14px);">💻 Cụm Bàn Kỹ Thuật 2.5D (Engineering Workstations)</div>
            <div class="iso-workstations-grid" id="iso-workstations-container">
              <!-- Dynamically populated 2.5D workstations -->
            </div>
          </div>

          <!-- Room 4: Pantry & Coffee Bar 2.5D -->
          <div class="iso-room iso-room-pantry">
            <div class="pantry-title" style="transform: translateZ(14px);">☕ Căng-tin &amp; Cafe (Pantry 2.5D)</div>
            <div class="pantry-bar-counter" style="transform: translateZ(20px);">
              <div class="pantry-item"><span class="coffee-machine-steam">☕</span> Barista</div>
              <div class="pantry-item">🧊 Tủ mát</div>
              <div class="pantry-item">💧 Bình lọc</div>
            </div>
            <div style="font-size:10px; font-weight:700; color:var(--text-muted); margin-top:14px; transform: translateZ(14px);">
              Standby Pool:
            </div>
            <div class="pantry-break-agents" id="iso-break-agents" style="transform: translateZ(16px); margin-top:8px;">
              <!-- Dynamically populated standby personnel -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 1: REALISTIC 2D ARCHITECTURAL FLOORPLAN -->
    <div id="office-floorplan-wrapper" style="display: none;">
      <div class="floorplan-container" id="floorplan-container">
        <!-- Corridors / Lối đi -->
        <div class="floorplan-hallway floorplan-hallway-h">
          <div class="hallway-carpet"></div>
          <div class="hallway-guide-line"></div>
          <span class="hallway-direction-arrow" style="left: 20px; top: 25px;">➜ LỐI ĐI CHÍNH</span>
          <span class="hallway-direction-arrow" style="right: 20px; top: 25px;">➜ KHU CAFE &amp; GIẢI LAO</span>
        </div>
        <div class="floorplan-hallway floorplan-hallway-v">
          <div class="hallway-carpet" style="top:0; bottom:0; left:15px; right:15px;"></div>
          <div class="hallway-guide-line" style="top:0; bottom:0; left:50%; width:2px; border-left:2px dashed rgba(2,132,199,0.25); border-top:none;"></div>
        </div>

        <!-- Walking Agent along corridor -->
        <div class="walking-agent" id="corridor-walking-agent">
          <div class="walking-agent-avatar">🏃</div>
          <div class="walking-agent-tag">Tuần tra &amp; Thư giãn</div>
        </div>

        <!-- Corner Foliage / Plants -->
        <div style="position: absolute; top: 275px; left: calc(52% - 55px); z-index: 3;" class="potted-plant">🪴</div>
        <div style="position: absolute; top: 370px; left: calc(52% - 55px); z-index: 3;" class="potted-plant">🪴</div>
        <div style="position: absolute; top: 275px; right: calc(48% - 55px); z-index: 3;" class="potted-plant">🪴</div>
        <div style="position: absolute; top: 370px; right: calc(48% - 55px); z-index: 3;" class="potted-plant">🪴</div>

        <!-- 1. War Room / Conference Room -->
        <div class="floorplan-meeting-room">
          <div class="meeting-room-title">🎯 Phòng Chỉ Huy Chiến Lược (War Room)</div>
          <div class="smart-board">
            <span id="fp-smartboard-title">Sprint Strategic Board</span>
            <span id="fp-smartboard-wave" style="color:#f59e0b;">Wave 1</span>
          </div>
          <div class="meeting-table-wrapper">
            <div class="meeting-chairs-top">
              <div class="meeting-chair"></div>
              <div class="meeting-chair"></div>
              <div class="meeting-chair"></div>
            </div>
            <div class="meeting-table">
              <span>BOARDROOM</span>
              <span id="fp-meeting-percent" style="font-size:9px; color:#38bdf8;">0% Hoàn thành</span>
            </div>
            <div class="meeting-chairs-bottom" style="margin-top:4px;">
              <div class="meeting-chair"></div>
              <div class="meeting-chair"></div>
              <div class="meeting-chair"></div>
            </div>
          </div>
          <!-- Lead Architect seated at the top -->
          <div style="position: absolute; top: 58px; left: 24px; display:flex; align-items:center; gap:8px;">
            <div class="person-head" style="background:#0284c7;">📐</div>
            <div style="font-size:9px; font-weight:800; color:var(--text);">@architect<br><span style="color:var(--text-muted); font-size:8px;">Lead Architect</span></div>
          </div>
        </div>

        <!-- 2. QA & Server Lab -->
        <div class="floorplan-qa-lab">
          <div class="qa-lab-title">🧪 Phòng Kiểm Thử &amp; Server Rack (QA Lab)</div>
          <div class="server-racks-row">
            <div class="server-rack">
              <div class="rack-unit"><span class="led-dot"></span></div>
              <div class="rack-unit"><span class="led-dot blue"></span></div>
              <div class="rack-unit"><span class="led-dot red"></span></div>
              <div class="rack-unit"><span class="led-dot"></span></div>
            </div>
            <div class="server-rack">
              <div class="rack-unit"><span class="led-dot blue"></span></div>
              <div class="rack-unit"><span class="led-dot"></span></div>
              <div class="rack-unit"><span class="led-dot"></span></div>
              <div class="rack-unit"><span class="led-dot blue"></span></div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:4px; font-size:10px;">
              <div><strong>Core:</strong> Rust Native CDP</div>
              <div><strong>Audit:</strong> Axe-core 2.2 AA</div>
              <div><strong>Vitals:</strong> LCP / CLS Pass</div>
            </div>
          </div>
          <!-- QA Agent Station -->
          <div style="display:flex; align-items:center; gap:10px; background:var(--nav-bg); padding:6px 10px; border-radius:8px; border:1px solid var(--card-border);">
            <div class="person-head" style="background:#059669;">🧪</div>
            <div style="font-size:10px; font-weight:800;">
              @tester-qa <span style="font-size:9px; color:var(--success); font-weight:600;">(QA &amp; Browser Agent)</span>
              <div id="fp-qa-status-text" style="font-size:9px; color:var(--text-muted); font-weight:normal;">Sẵn sàng chạy test suite</div>
            </div>
          </div>
        </div>

        <!-- 3. Engineering Bays (Workstations Grid) -->
        <div class="floorplan-engineering-bay">
          <div class="engineering-bay-title">💻 Cụm Bàn Kỹ Thuật (Workstation Desks)</div>
          <div class="workstations-grid-2d" id="floorplan-workstations-container">
            <!-- Dynamically populated workstations -->
          </div>
        </div>

        <!-- 4. Pantry & Coffee Lounge -->
        <div class="floorplan-pantry">
          <div class="pantry-title">☕ Khu Căng-tin &amp; Cafe (Breakroom Lounge)</div>
          <div class="pantry-bar-counter">
            <div class="pantry-item"><span class="coffee-machine-steam">☕</span> Espresso Bar</div>
            <div class="pantry-item">🧊 Tủ lạnh</div>
            <div class="pantry-item">💧 Bình lọc nước</div>
          </div>
          <div class="pantry-stools-row">
            <div class="pantry-stool"></div>
            <div class="pantry-stool"></div>
            <div class="pantry-stool"></div>
            <div class="pantry-stool"></div>
          </div>
          <div style="font-size:10px; font-weight:700; color:var(--text-muted); margin-top:12px;">
            Nhân sự đang nghỉ ngơi (Standby Pool):
          </div>
          <div class="pantry-break-agents" id="floorplan-break-agents">
            <!-- Dynamically populated idle members -->
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW 2: DETAILED PODS LIST -->
    <div id="office-pods-wrapper" style="display: none;">
      <!-- Office Floor -->
      <div class="office-floor" id="office-floor">
        <div class="office-section-header">
          <h2>💻 Khu Bàn Làm Việc Team (Engineering Pods)</h2>
        </div>
        
        <!-- Desks Grid -->
        <div class="office-desks-grid" id="office-desks-grid">
          <!-- Injected dynamically by renderOffice() -->
        </div>

        <!-- Lower Office Zones: QA Lab & Coffee Lounge -->
        <div class="office-lower-grid">
          <div class="office-qa-zone" id="office-qa-zone">
            <div class="zone-title">🧪 Phòng Kiểm Thử &amp; Browser Agent QA</div>
            <div class="qa-spec-grid">
              <div class="qa-metric-card">
                <div class="qa-metric-val" id="qa-stat-cdp">Native CDP</div>
                <div class="qa-metric-lbl">Rust Core (No Playwright)</div>
              </div>
              <div class="qa-metric-card">
                <div class="qa-metric-val" id="qa-stat-a11y">WCAG 2.2 AA</div>
                <div class="qa-metric-lbl">Axe-core Audit Gate</div>
              </div>
              <div class="qa-metric-card">
                <div class="qa-metric-val" id="qa-stat-vitals">Core Vitals</div>
                <div class="qa-metric-lbl">LCP / CLS / INP Pass</div>
              </div>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); display:flex; align-items:center; gap:6px;">
              <span>🤖 Trạng thái:</span> <strong style="color:var(--success);" id="qa-engine-status">Sẵn sàng chạy test suite</strong>
            </div>
          </div>

          <div class="office-lounge-zone" id="office-lounge-zone">
            <div class="zone-title">☕ Khu Căng-tin &amp; Nghỉ Ngơi (Standby Lounge)</div>
            <div class="lounge-avatars-row" id="lounge-avatars-container">
              <!-- Idle members populated by renderOffice() -->
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
              Các AI Agent dự bị đang nghỉ giải lao và sẵn sàng nhận task khi Wave phụ thuộc mở khóa.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Tab Content: DAG -->
  <div id="content-dag" style="display: none;">
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

  <!-- JSON Export Modal -->
  <div class="modal-backdrop" id="json-modal" onclick="if(event.target===this)closeJsonModal()">
    <div class="modal-box" style="max-width: 680px;">
      <div class="modal-header">
        <div>
          <div class="modal-title">📋 Supergraph Team State JSON</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Sao chép trực tiếp nội dung state hoặc tải file JSON về máy</div>
        </div>
        <button class="close-btn" onclick="closeJsonModal()">&times;</button>
      </div>
      <div class="modal-body">
        <textarea id="json-export-textarea" class="code-block" style="width: 100%; height: 320px; resize: vertical; font-size: 11px; padding: 12px;" readonly></textarea>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
          <button class="btn btn-primary" id="btn-modal-copy" onclick="copyFromModalTextarea()">📋 Copy từ ô này</button>
          <button class="btn" onclick="downloadStateJson()">💾 Tải file JSON</button>
          <button class="btn" onclick="closeJsonModal()">Đóng</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentData = null;
    let currentTab = 'office';
    let currentModalTaskId = null;

    function renderActiveTab() {
      if (currentTab === 'office') renderOffice();
      else if (currentTab === 'dag') renderDag();
      else if (currentTab === 'workers') renderWorkers();
      else if (currentTab === 'logs') renderLogs();
    }

    function switchTab(tab) {
      currentTab = tab;
      document.getElementById('tab-btn-office').classList.toggle('active', tab === 'office');
      document.getElementById('tab-btn-dag').classList.toggle('active', tab === 'dag');
      document.getElementById('tab-btn-workers').classList.toggle('active', tab === 'workers');
      document.getElementById('tab-btn-logs').classList.toggle('active', tab === 'logs');

      document.getElementById('content-office').style.display = tab === 'office' ? 'block' : 'none';
      document.getElementById('content-dag').style.display = tab === 'dag' ? 'block' : 'none';
      document.getElementById('content-workers').style.display = tab === 'workers' ? 'block' : 'none';
      document.getElementById('content-logs').style.display = tab === 'logs' ? 'block' : 'none';
      document.getElementById('filter-area').style.display = (tab === 'dag' || tab === 'office') ? 'flex' : 'none';

      renderActiveTab();
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
          document.getElementById('content-office').style.display = 'none';
          document.getElementById('content-dag').style.display = 'none';
          document.getElementById('content-workers').style.display = 'none';
          document.getElementById('content-logs').style.display = 'none';
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

        document.getElementById('content-office').style.display = currentTab === 'office' ? 'block' : 'none';
        document.getElementById('content-dag').style.display = currentTab === 'dag' ? 'block' : 'none';
        document.getElementById('content-workers').style.display = currentTab === 'workers' ? 'block' : 'none';
        document.getElementById('content-logs').style.display = currentTab === 'logs' ? 'block' : 'none';

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

        renderActiveTab();
      } catch (e) {
        console.error(e);
      }
    }

    let currentOfficeView = 'gather';
    let isoRotX = 56;
    let isoRotZ = -38;
    let isoScale = 0.92;

    function updateIsoTransform() {
      const stage = document.getElementById('iso-stage');
      if (stage) {
        stage.style.transform = 'rotateX(' + isoRotX + 'deg) rotateZ(' + isoRotZ + 'deg) scale(' + isoScale + ')';
      }
    }

    function adjustIso(action, val) {
      if (action === 'tilt') isoRotX = Math.max(25, Math.min(80, isoRotX + val));
      if (action === 'rot') isoRotZ = (isoRotZ + val) % 360;
      if (action === 'zoom') isoScale = Math.max(0.6, Math.min(1.5, Math.round((isoScale + val) * 100) / 100));
      if (action === 'reset') { isoRotX = 56; isoRotZ = -38; isoScale = 0.92; }
      updateIsoTransform();
    }

    function setOfficeView(mode) {
      currentOfficeView = mode;
      const btnGather = document.getElementById('btn-view-gather');
      const btnFp = document.getElementById('btn-view-floorplan');
      const btnIso = document.getElementById('btn-view-iso');
      const btnPods = document.getElementById('btn-view-pods');
      const wrapGather = document.getElementById('office-gather-wrapper');
      const wrapFp = document.getElementById('office-floorplan-wrapper');
      const wrapIso = document.getElementById('office-iso-wrapper');
      const wrapPods = document.getElementById('office-pods-wrapper');
      if (btnGather) btnGather.classList.toggle('active', mode === 'gather');
      if (btnFp) btnFp.classList.toggle('active', mode === 'floorplan');
      if (btnIso) btnIso.classList.toggle('active', mode === 'iso');
      if (btnPods) btnPods.classList.toggle('active', mode === 'pods');
      if (wrapGather) wrapGather.style.display = mode === 'gather' ? 'block' : 'none';
      if (wrapFp) wrapFp.style.display = mode === 'floorplan' ? 'block' : 'none';
      if (wrapIso) wrapIso.style.display = mode === 'iso' ? 'block' : 'none';
      if (wrapPods) wrapPods.style.display = mode === 'pods' ? 'block' : 'none';
    }

    function renderOffice() {
      if (!currentData || !currentData.tasks) return;
      const tasks = currentData.tasks;
      const mission = currentData.mission || {};
      const query = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
      const statusFilter = document.getElementById('status-filter')?.value || 'ALL';

      // 1. Update War Room Strategy Wall
      const objEl = document.getElementById('office-objective-text');
      if (objEl) {
        objEl.innerHTML = '<strong>Sứ mệnh:</strong> ' + escapeHtml(mission.objective || 'Chưa thiết lập') +
          ' &bull; <strong>Nhánh cơ sở:</strong> <code style="color:var(--primary);">' + escapeHtml(mission.baseBranch || 'master') + '</code>';
      }

      const mergedCount = tasks.filter(t => t.status === 'merged').length;
      const percent = tasks.length > 0 ? Math.round((mergedCount / tasks.length) * 100) : 0;
      const percentEl = document.getElementById('office-progress-percent');
      if (percentEl) percentEl.textContent = percent + '%';

      // Compute current active wave
      const activeTasks = tasks.filter(t => t.status === 'claimed' || t.status === 'red_tested' || t.status === 'green');
      const activeWave = activeTasks.length > 0 ? activeTasks[0].wave : (tasks.find(t => t.status === 'pending')?.wave || 1);
      const waveEl = document.getElementById('office-current-wave');
      if (waveEl) waveEl.textContent = 'Wave ' + (activeWave || 1);

      // Update Gather.town War Room Smartboard
      const gatherSbTitle = document.getElementById('gather-smartboard-title');
      if (gatherSbTitle) gatherSbTitle.textContent = mission.objective ? (mission.objective.length > 36 ? mission.objective.slice(0, 36) + '...' : mission.objective) : 'Sprint Strategic Board';
      const gatherSbWave = document.getElementById('gather-smartboard-wave');
      if (gatherSbWave) gatherSbWave.textContent = 'Wave ' + (activeWave || 1);
      const gatherMeetingPercent = document.getElementById('gather-meeting-percent');
      if (gatherMeetingPercent) gatherMeetingPercent.textContent = percent + '% Hoàn thành';

      // Update 2D Floorplan War Room Smartboard
      const fpSbTitle = document.getElementById('fp-smartboard-title');
      if (fpSbTitle) fpSbTitle.textContent = mission.objective ? (mission.objective.length > 36 ? mission.objective.slice(0, 36) + '...' : mission.objective) : 'Sprint Strategic Board';
      const fpSbWave = document.getElementById('fp-smartboard-wave');
      if (fpSbWave) fpSbWave.textContent = 'Wave ' + (activeWave || 1);
      const fpMeetingPercent = document.getElementById('fp-meeting-percent');
      if (fpMeetingPercent) fpMeetingPercent.textContent = percent + '% Hoàn thành';

      // Update 2.5D Isometric War Room Smartboard
      const isoSbTitle = document.getElementById('iso-smartboard-title');
      if (isoSbTitle) isoSbTitle.textContent = mission.objective ? (mission.objective.length > 36 ? mission.objective.slice(0, 36) + '...' : mission.objective) : 'Sprint Strategic Board';
      const isoSbWave = document.getElementById('iso-smartboard-wave');
      if (isoSbWave) isoSbWave.textContent = 'Wave ' + (activeWave || 1);
      const isoMeetingPercent = document.getElementById('iso-meeting-percent');
      if (isoMeetingPercent) isoMeetingPercent.textContent = percent + '% Hoàn thành';

      // 2. Prepare team members & desks
      const teamArchetypes = {
        'architect': { role: 'Lead Architect', icon: '📐', bg: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
        'frontend-dev': { role: 'Frontend Engineer', icon: '🎨', bg: 'linear-gradient(135deg, #0d9488, #2dd4bf)' },
        'backend-dev': { role: 'Backend Engineer', icon: '⚙️', bg: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
        'tester-qa': { role: 'QA & Browser Agent', icon: '🧪', bg: 'linear-gradient(135deg, #059669, #34d399)' },
        'git-ops': { role: 'Git Ops Coordinator', icon: '🔀', bg: 'linear-gradient(135deg, #ea580c, #fb923c)' }
      };

      const workerDeskMap = new Map();
      for (const t of tasks) {
        if (t.assignedTo) {
          const wId = t.assignedTo;
          if (!workerDeskMap.has(wId)) {
            workerDeskMap.set(wId, { workerId: wId, task: t });
          } else {
            const existing = workerDeskMap.get(wId);
            if (existing.task.status === 'merged' && t.status !== 'merged') {
              workerDeskMap.set(wId, { workerId: wId, task: t });
            }
          }
        }
      }

      for (const [key, meta] of Object.entries(teamArchetypes)) {
        if (!workerDeskMap.has(key)) {
          workerDeskMap.set(key, { workerId: key, task: null, archetype: meta });
        }
      }

      const desksGrid = document.getElementById('office-desks-grid');
      if (desksGrid) desksGrid.innerHTML = '';

      const fpWsContainer = document.getElementById('floorplan-workstations-container');
      if (fpWsContainer) fpWsContainer.innerHTML = '';

      const isoWsContainer = document.getElementById('iso-workstations-container');
      if (isoWsContainer) isoWsContainer.innerHTML = '';

      const gatherWsContainer = document.getElementById('gather-workstations-container');
      if (gatherWsContainer) gatherWsContainer.innerHTML = '';

      let displayedDeskCount = 0;
      const idleMembers = [];

      for (const [wId, info] of workerDeskMap.entries()) {
        const task = info.task;
        const archetype = teamArchetypes[wId] || {
          role: 'Fullstack Agent',
          icon: '🤖',
          bg: 'linear-gradient(135deg, #0284c7, #7c3aed)'
        };

        if (query) {
          const matchWorker = wId.toLowerCase().includes(query);
          const matchRole = archetype.role.toLowerCase().includes(query);
          const matchTaskId = task ? task.id.toLowerCase().includes(query) : false;
          const matchTitle = task ? (task.title || '').toLowerCase().includes(query) : false;
          if (!matchWorker && !matchRole && !matchTaskId && !matchTitle) continue;
        }

        if (statusFilter !== 'ALL') {
          if (!task && statusFilter !== 'ready') continue;
          if (task && statusFilter !== task.status) continue;
        }

        displayedDeskCount++;

        let deskStateClass = 'status-idle';
        let statusBadgeHtml = '<span class="desk-status" style="background:var(--nav-bg); color:var(--text-muted); border:1px solid var(--card-border);">☕ Nghỉ giải lao</span>';
        let avatarIndicatorClass = 'idle';
        let codeScreenTab = 'standby.sh';
        let activeLineClass = '';
        let taskTitlePreview = 'Sẵn sàng nhận nhiệm vụ mới khi có phân công.';
        let noteText = 'Standby Pool';

        if (task) {
          noteText = 'Wave ' + (task.wave || 1);
          taskTitlePreview = escapeHtml(task.title || task.id);
          codeScreenTab = (task.writeScopes && task.writeScopes[0]) ? escapeHtml(task.writeScopes[0].split('/').pop()) : (task.id + '.ts');

          if (task.status === 'claimed') {
            deskStateClass = 'status-coding';
            avatarIndicatorClass = 'active';
            activeLineClass = 'active';
            statusBadgeHtml = '<span class="desk-status badge badge-claimed"><span class="live-dot" style="background:#0284c7;"></span> 💻 Đang code</span>';
          } else if (task.status === 'red_tested') {
            deskStateClass = 'status-red_tested';
            avatarIndicatorClass = 'warning';
            activeLineClass = 'active';
            codeScreenTab = 'test-fail.log';
            statusBadgeHtml = '<span class="desk-status badge badge-red"><span class="live-dot" style="background:#dc2626;"></span> 🚨 TDD RED</span>';
          } else if (task.status === 'green') {
            deskStateClass = 'status-green';
            avatarIndicatorClass = 'active';
            activeLineClass = 'active';
            codeScreenTab = 'test-pass.log';
            statusBadgeHtml = '<span class="desk-status badge badge-green"><span class="live-dot" style="background:#059669;"></span> 🟢 TDD GREEN</span>';
          } else if (task.status === 'merged') {
            deskStateClass = 'status-merged';
            avatarIndicatorClass = 'idle';
            statusBadgeHtml = '<span class="desk-status badge badge-merged">🔀 Đã Merge</span>';
          }
        } else {
          idleMembers.push({ id: wId, archetype });
        }

        // --- 2D Architectural Workstation ---
        if (fpWsContainer) {
          const fpWs = document.createElement('div');
          fpWs.className = 'floorplan-workstation ' + deskStateClass;
          if (task) {
            fpWs.onclick = () => openTaskModal(task.id);
            fpWs.title = 'Click để xem task ' + task.id;
          } else {
            fpWs.onclick = () => showToast('info', 'Thành viên @' + wId + ' (' + archetype.role + ') đang ở chế độ chờ.');
            fpWs.title = '@' + wId + ' đang sẵn sàng';
          }

          fpWs.innerHTML =
            '<div class="workstation-desk-surface">' +
              '<div class="topdown-monitors">' +
                '<div class="topdown-screen"></div>' +
                '<div class="topdown-screen"></div>' +
              '</div>' +
              '<div class="topdown-keyboard"></div>' +
              '<div class="topdown-mouse"></div>' +
            '</div>' +
            '<div class="floorplan-person ' + (task && (task.status === 'claimed' || task.status === 'red_tested') ? 'person-typing' : '') + '">' +
              '<div class="person-head" style="background:' + archetype.bg + ';">' +
                archetype.icon +
                '<div class="person-headphones"></div>' +
              '</div>' +
              '<div class="person-shoulders" style="background:' + (wId === 'architect' ? '#38bdf8' : wId === 'frontend-dev' ? '#2dd4bf' : wId === 'backend-dev' ? '#a855f7' : wId === 'tester-qa' ? '#34d399' : '#fb923c') + ';"></div>' +
              '<div class="person-chair"></div>' +
            '</div>' +
            '<div class="workstation-nametag">@' + escapeHtml(wId) + '</div>' +
            '<div class="workstation-status-pill ' + (task ? ('badge-' + (task.status === 'merged' ? 'merged' : task.status === 'green' ? 'green' : task.status === 'red_tested' ? 'red' : 'claimed')) : 'badge-claimed') + '" style="font-size:8px;">' +
              (task ? escapeHtml(task.id) : 'Standby') +
            '</div>';

          fpWsContainer.appendChild(fpWs);
        }

        // --- Gather.town 2.5D RPG Workstation ---
        if (gatherWsContainer) {
          const gatherWs = document.createElement('div');
          gatherWs.className = 'gather-desk ' + deskStateClass;
          if (task) {
            gatherWs.onclick = () => openTaskModal(task.id);
            gatherWs.title = 'Click để xem task ' + task.id;
          } else {
            gatherWs.onclick = () => showToast('info', 'Thành viên @' + wId + ' (' + archetype.role + ') đang ở chế độ chờ.');
            gatherWs.title = '@' + wId + ' đang sẵn sàng';
          }

          gatherWs.innerHTML =
            '<div class="gather-monitors">' +
              '<div class="gather-monitor">' + (task ? (task.status === 'red_tested' ? 'ERR!' : task.status === 'green' ? 'PASS' : 'DEV') : 'IDLE') + '</div>' +
              '<div class="gather-monitor" style="color:#a855f7;">' + (task ? escapeHtml(task.id.slice(0, 7)) : '---') + '</div>' +
            '</div>' +
            '<div class="gather-desk-surface">' +
              '<div class="gather-keyboard"></div>' +
            '</div>' +
            '<div class="gather-character-area">' +
              '<div class="gather-character ' + (task && (task.status === 'claimed' || task.status === 'red_tested') ? 'typing' : '') + '" style="background:' + archetype.bg + ';">' +
                archetype.icon +
              '</div>' +
              '<div class="gather-worker-meta">' +
                '<span class="gather-worker-name">@' + escapeHtml(wId) + '</span>' +
                '<span class="gather-worker-task badge-' + (task ? (task.status === 'merged' ? 'merged' : task.status === 'green' ? 'green' : task.status === 'red_tested' ? 'red' : 'claimed') : 'claimed') + '">' +
                  (task ? escapeHtml(task.id) : 'Standby') +
                '</span>' +
              '</div>' +
            '</div>';

          gatherWsContainer.appendChild(gatherWs);
        }

        // --- 2.5D Isometric Workstation ---
        if (isoWsContainer) {
          const isoWs = document.createElement('div');
          isoWs.className = 'iso-workstation ' + deskStateClass;
          if (task) {
            isoWs.onclick = () => openTaskModal(task.id);
            isoWs.title = 'Click để xem task ' + task.id;
          } else {
            isoWs.onclick = () => showToast('info', 'Thành viên @' + wId + ' (' + archetype.role + ') đang ở chế độ chờ.');
            isoWs.title = '@' + wId + ' đang sẵn sàng';
          }

          isoWs.innerHTML =
            '<div class="iso-desk-3d">' +
              '<div class="iso-monitors-row">' +
                '<div class="iso-screen-3d">' + (task ? (task.status === 'red_tested' ? 'ERR!' : task.status === 'green' ? 'PASS' : 'DEV') : 'IDLE') + '</div>' +
                '<div class="iso-screen-3d" style="color:#a855f7;">' + (task ? escapeHtml(task.id.slice(0, 7)) : '---') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="iso-person-3d ' + (task && (task.status === 'claimed' || task.status === 'red_tested') ? 'person-typing' : '') + '">' +
              '<div class="iso-person-head" style="background:' + archetype.bg + ';">' +
                archetype.icon +
              '</div>' +
              '<div class="iso-person-body" style="background:' + (wId === 'architect' ? '#38bdf8' : wId === 'frontend-dev' ? '#2dd4bf' : wId === 'backend-dev' ? '#a855f7' : wId === 'tester-qa' ? '#34d399' : '#fb923c') + ';"></div>' +
              '<div class="iso-chair-3d"></div>' +
            '</div>' +
            '<div class="workstation-nametag" style="transform:translateZ(18px);">@' + escapeHtml(wId) + '</div>' +
            '<div class="workstation-status-pill ' + (task ? ('badge-' + (task.status === 'merged' ? 'merged' : task.status === 'green' ? 'green' : task.status === 'red_tested' ? 'red' : 'claimed')) : 'badge-claimed') + '" style="font-size:8px; transform:translateZ(18px);">' +
              (task ? escapeHtml(task.id) : 'Standby') +
            '</div>';

          isoWsContainer.appendChild(isoWs);
        }

        // --- Detailed Pods Card ---
        if (desksGrid) {
          const deskCard = document.createElement('div');
          deskCard.className = 'office-desk ' + deskStateClass;
          if (task) {
            deskCard.onclick = () => openTaskModal(task.id);
            deskCard.title = 'Click để xem chi tiết task ' + task.id;
          } else {
            deskCard.onclick = () => showToast('info', 'Thành viên @' + wId + ' (' + archetype.role + ') đang ở chế độ chờ.');
            deskCard.title = 'Thành viên đang sẵn sàng';
          }

          deskCard.innerHTML =
            '<div class="desk-lamp-cone"></div>' +
            '<div class="desk-header">' +
              '<div class="desk-member-info">' +
                '<div class="desk-avatar-wrapper">' +
                  '<div class="desk-avatar" style="background:' + archetype.bg + '; color:#fff;">' + archetype.icon + '</div>' +
                  '<span class="desk-avatar-indicator ' + avatarIndicatorClass + '"></span>' +
                '</div>' +
                '<div class="desk-member-names">' +
                  '<h3>@' + escapeHtml(wId) + '</h3>' +
                  '<div class="desk-member-role">' + escapeHtml(archetype.role) + '</div>' +
                '</div>' +
              '</div>' +
              statusBadgeHtml +
            '</div>' +
            '<div class="desk-surface">' +
              '<div class="desk-dual-monitors">' +
                '<div class="desk-screen">' +
                  '<div class="desk-screen-titlebar">' +
                    '<div class="desk-screen-dots">' +
                      '<span class="desk-screen-dot red"></span>' +
                      '<span class="desk-screen-dot yellow"></span>' +
                      '<span class="desk-screen-dot green"></span>' +
                    '</div>' +
                    '<span class="desk-screen-tab">' + codeScreenTab + '</span>' +
                  '</div>' +
                  '<div class="desk-code-lines">' +
                    '<div class="desk-code-line ' + activeLineClass + '"></div>' +
                    '<div class="desk-code-line" style="width:70%;"></div>' +
                    '<div class="desk-code-line" style="width:50%;"></div>' +
                    '<div class="desk-code-line" style="width:80%;"></div>' +
                  '</div>' +
                '</div>' +
                '<div class="desk-screen desk-status-screen">' +
                  (task ?
                    '<span class="desk-status-badge badge-' + (task.status === 'merged' ? 'merged' : task.status === 'green' ? 'green' : task.status === 'red_tested' ? 'red' : 'claimed') + '">' + escapeHtml(task.id) + '</span>' +
                    '<div style="font-size:9px; color:#cbd5e1; font-weight:600; line-height:1.2; overflow:hidden; max-height:24px;">' + (task.worktreeBranch ? escapeHtml(task.worktreeBranch) : 'Worktree') + '</div>'
                    :
                    '<span style="font-size:16px;">💤</span><span style="font-size:10px; color:#94a3b8;">Chế độ nghỉ</span>'
                  ) +
                '</div>' +
              '</div>' +
              '<div style="font-size:11px; font-weight:600; color:var(--text); line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' +
                taskTitlePreview +
              '</div>' +
              '<div class="desk-accessories">' +
                '<div class="desk-coffee">☕ <span class="steam-icon">~</span> <span style="font-size:10px;">Cafe nóng</span></div>' +
                '<span class="desk-note">' + noteText + '</span>' +
              '</div>' +
            '</div>';

          desksGrid.appendChild(deskCard);
        }
      }

      const activeDeskCount = tasks.filter(t => t.assignedTo && t.status !== 'merged').length;
      const countEl = document.getElementById('office-active-count');
      if (countEl) {
        countEl.textContent = 'Đang có ' + activeDeskCount + ' nhân sự đang tập trung xử lý nhiệm vụ';
      }

      // Update 2D Pantry Break Agents
      const fpBreakContainer = document.getElementById('floorplan-break-agents');
      if (fpBreakContainer) {
        fpBreakContainer.innerHTML = '';
        if (idleMembers.length === 0) {
          fpBreakContainer.innerHTML = '<span style="font-size:10px; color:var(--text-muted); font-style:italic;">Toàn bộ team đang làm việc tại bàn.</span>';
        } else {
          for (const m of idleMembers) {
            const chip = document.createElement('div');
            chip.className = 'pantry-break-agent-chip';
            chip.innerHTML = '<span style="font-size:12px;">' + m.archetype.icon + '</span> <span>@' + escapeHtml(m.id) + '</span>';
            fpBreakContainer.appendChild(chip);
          }
        }
      }

      // Update Gather Pantry Break Agents
      const gatherBreakContainer = document.getElementById('gather-break-agents');
      if (gatherBreakContainer) {
        gatherBreakContainer.innerHTML = '';
        if (idleMembers.length === 0) {
          gatherBreakContainer.innerHTML = '<span style="font-size:10px; color:var(--text-muted); font-style:italic;">Toàn bộ team đang làm việc tại bàn.</span>';
        } else {
          for (const m of idleMembers) {
            const chip = document.createElement('div');
            chip.className = 'pantry-break-agent-chip';
            chip.innerHTML = '<span style="font-size:12px;">' + m.archetype.icon + '</span> <span>@' + escapeHtml(m.id) + '</span>';
            gatherBreakContainer.appendChild(chip);
          }
        }
      }

      // Update 2.5D Pantry Break Agents
      const isoBreakContainer = document.getElementById('iso-break-agents');
      if (isoBreakContainer) {
        isoBreakContainer.innerHTML = '';
        if (idleMembers.length === 0) {
          isoBreakContainer.innerHTML = '<span style="font-size:10px; color:var(--text-muted); font-style:italic;">Toàn bộ team đang làm việc tại bàn.</span>';
        } else {
          for (const m of idleMembers) {
            const chip = document.createElement('div');
            chip.className = 'pantry-break-agent-chip';
            chip.innerHTML = '<span style="font-size:12px;">' + m.archetype.icon + '</span> <span>@' + escapeHtml(m.id) + '</span>';
            isoBreakContainer.appendChild(chip);
          }
        }
      }

      const loungeContainer = document.getElementById('lounge-avatars-container');
      if (loungeContainer) {
        loungeContainer.innerHTML = '';
        if (idleMembers.length === 0) {
          loungeContainer.innerHTML = '<span style="font-size:11px; color:var(--text-muted); font-style:italic;">Toàn bộ team đang tích cực làm việc tại bàn.</span>';
        } else {
          for (const m of idleMembers) {
            const item = document.createElement('div');
            item.className = 'lounge-avatar-item';
            item.innerHTML = '<span style="font-size:14px;">' + m.archetype.icon + '</span> <span>@' + escapeHtml(m.id) + '</span>';
            loungeContainer.appendChild(item);
          }
        }
      }

      const redTasks = tasks.filter(t => t.status === 'red_tested').length;
      const greenTasks = tasks.filter(t => t.status === 'green').length;
      const qaStatusEl = document.getElementById('qa-engine-status');
      const fpQaStatusEl = document.getElementById('fp-qa-status-text');
      const isoQaStatusEl = document.getElementById('iso-qa-status-text');
      const gatherQaStatusEl = document.getElementById('gather-qa-status-text');

      if (redTasks > 0) {
        const text = 'Đang theo dõi ' + redTasks + ' bài test RED';
        if (qaStatusEl) { qaStatusEl.textContent = text; qaStatusEl.style.color = 'var(--danger)'; }
        if (fpQaStatusEl) { fpQaStatusEl.textContent = text; fpQaStatusEl.style.color = 'var(--danger)'; }
        if (isoQaStatusEl) { isoQaStatusEl.textContent = text; isoQaStatusEl.style.color = 'var(--danger)'; }
        if (gatherQaStatusEl) { gatherQaStatusEl.textContent = text; gatherQaStatusEl.style.color = 'var(--danger)'; }
      } else if (greenTasks > 0) {
        const text = greenTasks + ' test suite đã GREEN - Sẵn sàng merge';
        if (qaStatusEl) { qaStatusEl.textContent = text; qaStatusEl.style.color = 'var(--success)'; }
        if (fpQaStatusEl) { fpQaStatusEl.textContent = text; fpQaStatusEl.style.color = 'var(--success)'; }
        if (isoQaStatusEl) { isoQaStatusEl.textContent = text; isoQaStatusEl.style.color = 'var(--success)'; }
        if (gatherQaStatusEl) { gatherQaStatusEl.textContent = text; gatherQaStatusEl.style.color = 'var(--success)'; }
      } else {
        const text = 'Hệ thống kiểm thử native CDP sẵn sàng';
        if (qaStatusEl) { qaStatusEl.textContent = text; qaStatusEl.style.color = 'var(--success)'; }
        if (fpQaStatusEl) { fpQaStatusEl.textContent = text; fpQaStatusEl.style.color = 'var(--success)'; }
        if (isoQaStatusEl) { isoQaStatusEl.textContent = text; isoQaStatusEl.style.color = 'var(--success)'; }
        if (gatherQaStatusEl) { gatherQaStatusEl.textContent = text; gatherQaStatusEl.style.color = 'var(--success)'; }
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

    function showToast(message, type) {
      type = type || 'info';
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'toast-item toast-' + type;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
      }, 3000);
    }

    async function handleRefreshClick() {
      const btn = document.getElementById('btn-refresh');
      if (!btn) return;
      const origHtml = btn.innerHTML;
      btn.innerHTML = '<span class="spin">🔄</span> Đang tải...';
      btn.disabled = true;
      try {
        await updateDashboard();
        btn.innerHTML = '✓ Đã tải';
        showToast('✓ Đã cập nhật dữ liệu mới nhất từ server!', 'success');
      } catch (e) {
        btn.innerHTML = '⚠️ Lỗi tải';
        showToast('Lỗi khi làm mới: ' + e.message, 'danger');
      } finally {
        setTimeout(() => {
          btn.innerHTML = origHtml;
          btn.disabled = false;
        }, 800);
      }
    }

    function openJsonModal() {
      if (!currentData) {
        showToast('Chưa có dữ liệu state để hiển thị', 'warning');
        return;
      }
      const ta = document.getElementById('json-export-textarea');
      if (ta) {
        ta.value = JSON.stringify(currentData, null, 2);
        const modal = document.getElementById('json-modal');
        if (modal) modal.classList.add('open');
        setTimeout(() => {
          ta.focus();
          ta.select();
        }, 100);
      }
    }

    function closeJsonModal() {
      const modal = document.getElementById('json-modal');
      if (modal) modal.classList.remove('open');
    }

    function copyFromModalTextarea() {
      const ta = document.getElementById('json-export-textarea');
      if (!ta) return;
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand('copy');
        if (ok) {
          showToast('✓ Đã sao chép vào clipboard!', 'success');
        } else {
          showToast('Nhấn Ctrl+C (hoặc ⌘C) để sao chép', 'info');
        }
      } catch (e) {
        showToast('Nhấn Ctrl+C (hoặc ⌘C) để sao chép', 'info');
      }
    }

    function downloadStateJson() {
      if (!currentData) return;
      const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supergraph-team-state.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✓ Đã tải file supergraph-team-state.json', 'success');
    }

    async function copyStateJson() {
      if (!currentData) {
        showToast('Chưa có dữ liệu state để sao chép', 'warning');
        return;
      }
      const jsonStr = JSON.stringify(currentData, null, 2);
      let ok = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(jsonStr);
          ok = true;
        } catch (e) {
          ok = false;
        }
      }
      if (!ok) {
        try {
          const ta = document.createElement('textarea');
          ta.value = jsonStr;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          ta.style.top = '-9999px';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          ok = document.execCommand('copy');
          document.body.removeChild(ta);
        } catch (e) {
          ok = false;
        }
      }

      const btn = document.getElementById('btn-copy-state');
      if (ok) {
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '✓ Đã copy!';
          setTimeout(() => { btn.innerHTML = orig; }, 1200);
        }
        showToast('✓ Đã sao chép State JSON vào clipboard!', 'success');
      } else {
        openJsonModal();
        showToast('Đã mở cửa sổ State JSON để bạn sao chép hoặc tải về!', 'info');
      }
    }

    let resetTimeoutId = null;
    async function handleResetClick() {
      const btn = document.getElementById('btn-reset');
      if (!btn) return;

      if (!btn.dataset.confirming) {
        btn.dataset.confirming = 'true';
        btn.dataset.origText = btn.innerHTML;
        btn.innerHTML = '⚠️ Xác nhận Reset? (Click lại)';
        btn.classList.add('btn-warning');
        btn.classList.remove('btn-danger');

        showToast('Bấm "Xác nhận Reset" thêm một lần nữa trong 4 giây để xóa dữ liệu.', 'warning');

        if (resetTimeoutId) clearTimeout(resetTimeoutId);
        resetTimeoutId = setTimeout(() => {
          btn.removeAttribute('data-confirming');
          btn.innerHTML = btn.dataset.origText || '🗑️ Reset Mission';
          btn.classList.remove('btn-warning');
          btn.classList.add('btn-danger');
        }, 4000);
        return;
      }

      if (resetTimeoutId) clearTimeout(resetTimeoutId);
      btn.removeAttribute('data-confirming');
      btn.disabled = true;
      btn.innerHTML = '<span class="spin">⏳</span> Đang xóa...';

      try {
        const queryParams = new URLSearchParams();
        if (currentSessionId) queryParams.set("sessionId", currentSessionId);
        if (currentCwd) queryParams.set("cwd", currentCwd);
        const qs = queryParams.toString() ? "?" + queryParams.toString() : "";

        const res = await fetch('/api/reset' + qs, { method: 'POST' });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        await updateDashboard();
        showToast('✓ Đã reset mission và tasks thành công!', 'success');
      } catch (err) {
        showToast('Lỗi khi reset: ' + err.message, 'danger');
      } finally {
        btn.innerHTML = btn.dataset.origText || '🗑️ Reset Mission';
        btn.classList.remove('btn-warning');
        btn.classList.add('btn-danger');
        btn.disabled = false;
      }
    }

    async function initDemoMission() {
      try {
        const queryParams = new URLSearchParams();
        if (currentSessionId) queryParams.set("sessionId", currentSessionId);
        if (currentCwd) queryParams.set("cwd", currentCwd);
        const qs = queryParams.toString() ? "?" + queryParams.toString() : "";
        const res = await fetch('/api/init-demo' + qs, { method: 'POST' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        await updateDashboard();
        showToast('✓ Đã khởi tạo Demo Mission thành công!', 'success');
      } catch (e) {
        showToast('Lỗi: ' + e.message, 'danger');
      }
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
  <div class="toast-container" id="toast-container"></div>
</body>
</html>`;
}
