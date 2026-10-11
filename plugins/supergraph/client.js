/**
 * Supergraph Client Plugin for DeepSeek Harness (DSH)
 * Web GUI Right Sidebar Panel for Supergraph Agent Team Wave DAG & Task Monitoring
 *
 * @module supergraph/client
 */

window.__ModuleLoader__.load({
  id: 'supergraph',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const TAB_ID = 'supergraph-team';
    const TAB_KIND = 'supergraph-team';

    // Inject stylesheet
    const STYLE_ID = 'supergraph-team-styles';
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      .sgt-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: var(--dto-bg, #0b0f19);
        color: var(--dto-text-primary, #f8fafc);
        font-family: var(--ds-font-family-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
        font-size: 12px;
        line-height: 1.5;
        box-sizing: border-box;
        overflow: hidden;
      }
      body:not([data-ds-dark-theme]) .sgt-container {
        background: #f8fafc;
        color: #0f172a;
      }
      .sgt-header {
        padding: 12px 16px;
        background: var(--dto-surface-nav, rgba(18, 24, 39, 0.8));
        border-bottom: 1px solid var(--dto-border, rgba(255, 255, 255, 0.08));
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      body:not([data-ds-dark-theme]) .sgt-header {
        background: #ffffff;
        border-bottom-color: #e2e8f0;
      }
      .sgt-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .sgt-title {
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sgt-dot {
        width: 8px;
        height: 8px;
        background: #34d399;
        border-radius: 50%;
        box-shadow: 0 0 8px #34d399;
        display: inline-block;
      }
      .sgt-objective {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.4;
      }
      body:not([data-ds-dark-theme]) .sgt-objective {
        color: #64748b;
      }
      .sgt-stats {
        display: flex;
        gap: 8px;
      }
      .sgt-stat-pill {
        flex: 1;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 6px;
        padding: 4px 8px;
        text-align: center;
      }
      body:not([data-ds-dark-theme]) .sgt-stat-pill {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }
      .sgt-stat-val {
        font-size: 13px;
        font-weight: 700;
        color: #38bdf8;
      }
      body:not([data-ds-dark-theme]) .sgt-stat-val {
        color: #0284c7;
      }
      .sgt-stat-lbl {
        font-size: 9px;
        text-transform: uppercase;
        color: #94a3b8;
      }
      .sgt-scrollable {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .sgt-wave-box {
        background: rgba(18, 24, 39, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      body:not([data-ds-dark-theme]) .sgt-wave-box {
        background: #ffffff;
        border-color: #e2e8f0;
      }
      .sgt-wave-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 700;
        color: #c084fc;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      body:not([data-ds-dark-theme]) .sgt-wave-head {
        color: #7e22ce;
        border-bottom-color: #f1f5f9;
      }
      .sgt-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      body:not([data-ds-dark-theme]) .sgt-card {
        background: #f8fafc;
        border-color: #e2e8f0;
      }
      .sgt-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .sgt-card-id {
        font-family: monospace;
        font-size: 10px;
        color: #94a3b8;
      }
      .sgt-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 9999px;
        text-transform: uppercase;
      }
      .sgt-badge-merged { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
      .sgt-badge-green { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
      .sgt-badge-red { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
      .sgt-badge-claimed { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
      .sgt-badge-pending { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
      .sgt-card-title {
        font-size: 11px;
        font-weight: 600;
      }
      .sgt-card-meta {
        font-size: 10px;
        color: #94a3b8;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .sgt-worker {
        color: #38bdf8;
        font-weight: 600;
      }
      .sgt-empty {
        padding: 40px 16px;
        text-align: center;
        color: #94a3b8;
        font-size: 11px;
      }
    `;

    function SupergraphTeamTitle() {
      return h('span', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
        h('span', null, '⚡'),
        h('span', null, 'Team Monitor')
      );
    }

    function SupergraphTeamPane() {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      const fetchData = React.useCallback(async () => {
        try {
          let res = await fetch('/api/supergraph/team/state').catch(() => null);
          if (!res || !res.ok) {
            res = await fetch('http://127.0.0.1:3333/api/state').catch(() => null);
          }
          if (res && res.ok) {
            const json = await res.json();
            setData(json);
          }
        } catch (e) {
          console.warn('[supergraph-team] fetch state error:', e);
        } finally {
          setLoading(false);
        }
      }, []);

      React.useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, 1500);
        return () => clearInterval(timer);
      }, [fetchData]);

      if (loading && !data) {
        return h('div', { className: 'sgt-container' },
          h('div', { className: 'sgt-empty' }, 'Đang tải dữ liệu Supergraph Team...')
        );
      }

      const mission = data && data.mission;
      const tasks = (data && data.tasks) || [];

      if (!mission) {
        return h('div', { className: 'sgt-container' },
          h('div', { className: 'sgt-header' },
            h('div', { className: 'sgt-title-row' },
              h('div', { className: 'sgt-title' },
                h('span', null, '⚡ Supergraph Team Monitor')
              )
            )
          ),
          h('div', { className: 'sgt-empty' },
            h('div', { style: { fontSize: '24px', marginBottom: '8px' } }, '🚀'),
            h('div', { style: { fontWeight: 600, marginBottom: '4px' } }, 'Chưa có mission nào'),
            h('div', null, 'Khởi tạo mission bằng tool sg_team_init hoặc lệnh /execute trong chat.')
          )
        );
      }

      const merged = tasks.filter(t => t.status === 'merged').length;
      const waves = {};
      for (const t of tasks) {
        const w = t.wave || 1;
        if (!waves[w]) waves[w] = [];
        waves[w].push(t);
      }
      const waveKeys = Object.keys(waves).sort((a, b) => Number(a) - Number(b));

      return h('div', { className: 'sgt-container' },
        h('div', { className: 'sgt-header' },
          h('div', { className: 'sgt-title-row' },
            h('div', { className: 'sgt-title' },
              h('span', { className: 'sgt-dot' }),
              h('span', null, 'Supergraph Team Monitor')
            ),
            h('button', {
              type: 'button',
              onClick: fetchData,
              style: {
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                fontSize: '11px'
              }
            }, '🔄')
          ),
          h('div', { className: 'sgt-objective' },
            h('strong', null, 'Mission: '), mission.objective,
            h('br', null),
            h('span', { style: { fontSize: '10px', opacity: 0.8 } }, 'Branch: ' + mission.baseBranch + ' • ID: ' + mission.id)
          ),
          h('div', { className: 'sgt-stats' },
            h('div', { className: 'sgt-stat-pill' },
              h('div', { className: 'sgt-stat-val' }, tasks.length),
              h('div', { className: 'sgt-stat-lbl' }, 'Tasks')
            ),
            h('div', { className: 'sgt-stat-pill' },
              h('div', { className: 'sgt-stat-val', style: { color: '#34d399' } }, merged),
              h('div', { className: 'sgt-stat-lbl' }, 'Merged')
            ),
            h('div', { className: 'sgt-stat-pill' },
              h('div', { className: 'sgt-stat-val', style: { color: '#c084fc' } }, waveKeys.length),
              h('div', { className: 'sgt-stat-lbl' }, 'Waves')
            )
          )
        ),
        h('div', { className: 'sgt-scrollable' },
          waveKeys.map(wKey => {
            const waveTasks = waves[wKey];
            return h('div', { key: wKey, className: 'sgt-wave-box' },
              h('div', { className: 'sgt-wave-head' },
                h('span', null, '🌊 Wave ' + wKey),
                h('span', { style: { fontSize: '10px', color: '#94a3b8' } }, waveTasks.length + ' tasks')
              ),
              waveTasks.map(t => {
                let badgeClass = 'sgt-badge-pending';
                if (t.status === 'merged') badgeClass = 'sgt-badge-merged';
                else if (t.status === 'green') badgeClass = 'sgt-badge-green';
                else if (t.status === 'red_tested') badgeClass = 'sgt-badge-red';
                else if (t.status === 'claimed') badgeClass = 'sgt-badge-claimed';

                return h('div', { key: t.id, className: 'sgt-card' },
                  h('div', { className: 'sgt-card-top' },
                    h('span', { className: 'sgt-card-id' }, t.id),
                    h('span', { className: 'sgt-badge ' + badgeClass }, t.status)
                  ),
                  h('div', { className: 'sgt-card-title' }, t.title),
                  h('div', { className: 'sgt-card-meta' },
                    t.assignedTo ? h('div', null, 'Worker: ', h('span', { className: 'sgt-worker' }, '@' + t.assignedTo)) : null,
                    t.dependencies && t.dependencies.length > 0 ? h('div', null, 'Deps: ' + t.dependencies.join(', ')) : null,
                    t.writeScopes && t.writeScopes.length > 0 ? h('div', null, 'Scopes: ' + t.writeScopes.join(', ')) : null
                  )
                );
              })
            );
          })
        )
      );
    }

    let globalCtx = null;

    function HeaderTeamButton(props) {
      const sessionId = props && props.sessionId;
      return h('button', {
        type: 'button',
        title: 'Open Supergraph Team Monitor',
        onClick: () => {
          if (!globalCtx || !globalCtx.sidebarRight) return;
          try {
            if (sessionId && typeof globalCtx.sidebarRight.openTabIn === 'function') {
              globalCtx.sidebarRight.openTabIn(sessionId, TAB_KIND);
            } else if (typeof globalCtx.sidebarRight.openTab === 'function') {
              globalCtx.sidebarRight.openTab(TAB_KIND);
            }
            if (sessionId && typeof globalCtx.sidebarRight.actionsFor === 'function') {
              const acts = globalCtx.sidebarRight.actionsFor(sessionId);
              if (acts && typeof acts.setExpanded === 'function') {
                acts.setExpanded(sessionId, true);
              }
            }
          } catch (e) {
            console.warn('[supergraph-team] open sidebar tab error:', e);
          }
        },
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: '5px',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          background: 'rgba(56, 189, 248, 0.15)',
          color: '#0284c7',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          marginRight: '6px'
        }
      },
        h('span', { style: { fontSize: '12px' } }, '⚡'),
        h('span', null, 'Team Monitor')
      );
    }

    return {
      inject: ['sidebarRight', 'sidebarRightTabs', 'slots'],
      apply(ctx) {
        globalCtx = ctx;

        // 1. Register Tab into Sidebar Right
        if (ctx.sidebarRightTabs && typeof ctx.sidebarRightTabs.register === 'function') {
          ctx.effect(() => {
            return ctx.sidebarRightTabs.register({
              id: TAB_ID,
              kind: TAB_KIND,
              priority: 'builtin',
              title: () => 'Team Monitor',
              guide: [{
                id: 'supergraph-team',
                order: 2,
                title: () => 'Team Monitor',
                description: () => 'Supergraph Multi-Agent Wave DAG & Task Monitor'
              }]
            });
          }, 'supergraph-team: tab registration');
        }

        // 2. Register tab body slot
        ctx.effect(() => {
          return ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
            name: 'sidebar.right.pane.tab',
            key: TAB_ID
          }, SupergraphTeamPane));
        }, 'supergraph-team: pane slot');

        // 3. Register tab title slot
        ctx.effect(() => {
          return ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
            name: 'sidebar.right.pane.tab.title',
            key: TAB_ID
          }, SupergraphTeamTitle));
        }, 'supergraph-team: title slot');

        // 4. Header action button in conversation header
        ctx.effect(() => {
          return ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
            name: 'conversation.session.header.actions',
            id: 'supergraph-team-header-button',
            order: 24
          }, HeaderTeamButton));
        }, 'supergraph-team: header action slot');

        // Auto-open and expand helper
        function autoOpenAndExpand(sid) {
          if (!ctx.sidebarRight) return;
          const targetSid = sid || (typeof ctx.sidebarRight.mounted?.getSnapshot === 'function' ? ctx.sidebarRight.mounted.getSnapshot() : null);
          if (!targetSid) return;
          try {
            if (typeof ctx.sidebarRight.openTabIn === 'function') {
              ctx.sidebarRight.openTabIn(targetSid, TAB_KIND);
            } else if (typeof ctx.sidebarRight.openTab === 'function') {
              ctx.sidebarRight.openTab(TAB_KIND);
            }
            if (typeof ctx.sidebarRight.actionsFor === 'function') {
              const acts = ctx.sidebarRight.actionsFor(targetSid);
              if (acts && typeof acts.setExpanded === 'function') {
                acts.setExpanded(targetSid, true);
              }
            }
          } catch (e) {
            console.warn('[supergraph-team] auto-open error:', e);
          }
        }

        // 5. Watcher to auto-open sidebar when mission is active
        let lastAutoOpenedMissionId = null;
        async function checkAndAutoOpen(sid) {
          try {
            let res = await fetch('/api/supergraph/team/state').catch(() => null);
            if (!res || !res.ok) {
              res = await fetch('http://127.0.0.1:3333/api/state').catch(() => null);
            }
            if (res && res.ok) {
              const json = await res.json();
              if (json && json.mission && json.mission.id) {
                if (lastAutoOpenedMissionId !== json.mission.id) {
                  lastAutoOpenedMissionId = json.mission.id;
                  autoOpenAndExpand(sid);
                }
              }
            }
          } catch {}
        }

        // On mount
        if (ctx.sidebarRight && ctx.sidebarRight.mounted) {
          ctx.effect(() => {
            const unsub = ctx.sidebarRight.mounted.subscribe(() => {
              const sid = ctx.sidebarRight.mounted.getSnapshot();
              if (sid) checkAndAutoOpen(sid);
            });
            const initialSid = ctx.sidebarRight.mounted.getSnapshot();
            if (initialSid) checkAndAutoOpen(initialSid);
            return () => {
              if (unsub) unsub();
            };
          }, 'supergraph-team: auto-open on mount');
        }

        // Polling loop to auto-open when a mission starts
        const pollInterval = setInterval(() => {
          const sid = ctx.sidebarRight?.mounted?.getSnapshot();
          if (sid) checkAndAutoOpen(sid);
        }, 2000);

        // Window event listener
        window.addEventListener('supergraph:team:open', () => {
          autoOpenAndExpand();
        });
      }
    };
  }
});
