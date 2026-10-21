/**
 * Supergraph Client Plugin for DeepSeek Harness (DSH)
 * Web GUI Right Sidebar Panel hosting the standalone Supergraph Team Monitor
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

    let globalCtx = null;

    function SupergraphTeamTitle() {
      return h('span', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
        h('span', null, '⚡'),
        h('span', null, 'Supergraph Team')
      );
    }

    function HeaderTeamButton(props) {
      const sessionId = props?.sessionId ||
        (typeof globalCtx?.sidebarRight?.mounted?.getSnapshot === 'function' ? globalCtx.sidebarRight.mounted.getSnapshot() : null);

      return h('button', {
        type: 'button',
        title: 'Open Supergraph Team Monitor (Click: DSH Sidebar, Cmd/Ctrl+Click: New Tab)',
        'aria-label': 'Supergraph Team Monitor',
        onClick: (e) => {
          if (e && (e.metaKey || e.ctrlKey)) {
            const host = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : '127.0.0.1';
            window.open(`http://${host}:3333/`, '_blank');
            return;
          }
          if (!globalCtx?.sidebarRight) return;
          try {
            const sid = sessionId ||
              (typeof globalCtx.sidebarRight.mounted?.getSnapshot === 'function' ? globalCtx.sidebarRight.mounted.getSnapshot() : null);
            if (sid && typeof globalCtx.sidebarRight.openTabIn === 'function') {
              globalCtx.sidebarRight.openTabIn(sid, TAB_KIND);
            } else if (typeof globalCtx.sidebarRight.openTab === 'function') {
              globalCtx.sidebarRight.openTab(TAB_KIND);
            }
            if (sid && typeof globalCtx.sidebarRight.actionsFor === 'function') {
              const acts = globalCtx.sidebarRight.actionsFor(sid);
              if (acts && typeof acts.setExpanded === 'function') {
                acts.setExpanded(sid, true);
              }
            }
          } catch (err) {
            console.warn('[supergraph-team] open sidebar tab error:', err);
          }
        },
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          height: '28px',
          padding: '0 9px',
          borderRadius: '6px',
          border: '1px solid var(--dsh-border, rgba(255,255,255,0.15))',
          background: 'var(--dsh-bg-secondary, rgba(255,255,255,0.06))',
          color: 'var(--dsh-text, #e6edf3)',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          lineHeight: '1',
          userSelect: 'none'
        }
      },
        h('span', { style: { fontSize: '13px', lineHeight: '1' } }, '⚡'),
        h('span', null, 'Team Monitor')
      );
    }

    function SupergraphTeamPane(props) {
      const sessionId = props?.sessionId ||
        (typeof globalCtx?.sidebarRight?.mounted?.getSnapshot === 'function' ? globalCtx.sidebarRight.mounted.getSnapshot() : null);
      const cwd = props?.useSessions && sessionId ? props.useSessions(s => s.byId[sessionId]?.cwd) : null;

      const params = new URLSearchParams();
      if (sessionId) params.set('sessionId', sessionId);
      if (cwd) params.set('cwd', cwd);
      const host = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : '127.0.0.1';
      const src = `http://${host}:3333/?${params.toString()}`;

      return h('div', {
        style: {
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#090d16',
          position: 'relative'
        }
      },
        h('iframe', {
          key: sessionId || 'default',
          src,
          title: 'Supergraph Agent Team Monitor',
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }
        })
      );
    }

    return {
      inject: ['sidebarRight', 'sidebarRightTabs', 'slots', 'sessions'],
      apply(ctx) {
        globalCtx = ctx;

        // 1. Register Dedicated Tab into Sidebar Right
        if (ctx.sidebarRightTabs && typeof ctx.sidebarRightTabs.register === 'function') {
          ctx.effect(() => {
            return ctx.sidebarRightTabs.register({
              id: TAB_ID,
              kind: TAB_KIND,
              priority: 'builtin',
              title: () => 'Supergraph Team',
              guide: [{
                id: 'supergraph-team',
                order: 2,
                title: () => 'Supergraph Team',
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

        // 4. Register header action button in conversation header
        ctx.effect(() => {
          return ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
            name: 'conversation.session.header.actions',
            id: 'supergraph-team-header-button',
            order: 24
          }, HeaderTeamButton));
        }, 'supergraph-team: header action slot');

        // Auto-open and expand helper scoped strictly to target session
        function autoOpenAndExpand(sid) {
          if (!ctx.sidebarRight || !sid) return;
          try {
            if (typeof ctx.sidebarRight.openTabIn === 'function') {
              ctx.sidebarRight.openTabIn(sid, TAB_KIND);
            } else if (typeof ctx.sidebarRight.openTab === 'function') {
              ctx.sidebarRight.openTab(TAB_KIND);
            }
            if (typeof ctx.sidebarRight.actionsFor === 'function') {
              const acts = ctx.sidebarRight.actionsFor(sid);
              if (acts && typeof acts.setExpanded === 'function') {
                acts.setExpanded(sid, true);
              }
            }
          } catch (e) {
            console.warn('[supergraph-team] auto-open error:', e);
          }
        }

        // 4. Track per-session tool executions: ONLY auto-open for the session calling Supergraph team tools
        const boundSessions = new Set();
        const autoOpenedSessions = new Set();

        function checkToolCall(sid, toolName) {
          if (!toolName || !sid) return;
          if (toolName === 'sg_team_init' || toolName.startsWith('sg_task_') || toolName.includes('supergraph-team')) {
            if (!autoOpenedSessions.has(sid)) {
              autoOpenedSessions.add(sid);
              autoOpenAndExpand(sid);
            }
          }
        }

        function bindSession(sid) {
          if (!sid || boundSessions.has(sid)) return;
          boundSessions.add(sid);
          try {
            const binding = ctx.sessions?.binding(sid);
            if (binding && binding.eventSource && typeof binding.eventSource.subscribe === 'function') {
              // Initial scan of historical entries for this specific session
              const initialSnapshot = binding.eventSource.getSnapshot();
              if (initialSnapshot && Array.isArray(initialSnapshot.entries)) {
                for (const entry of initialSnapshot.entries) {
                  if (entry?.type === 'event' && entry.event?.type === 'tool/call') {
                    checkToolCall(sid, entry.event.data?.name);
                  }
                }
              }

              // Listen to real-time events for this specific session
              binding.eventSource.subscribe(() => {
                const snapshot = binding.eventSource.getSnapshot();
                if (!snapshot) return;
                const change = snapshot.change;
                if (change && Array.isArray(change.entries)) {
                  for (const entry of change.entries) {
                    if (entry?.type === 'event' && entry.event?.type === 'tool/call') {
                      checkToolCall(sid, entry.event.data?.name);
                    }
                  }
                } else if (change && change.entry?.type === 'event' && change.entry.event?.type === 'tool/call') {
                  checkToolCall(sid, change.entry.event.data?.name);
                }
              });
            }
          } catch (e) {
            console.warn('[supergraph-team] Failed to bind session:', sid, e);
          }
        }

        function syncSessions() {
          try {
            const list = ctx.sessions?.list?.getSnapshot();
            if (list && list.byId) {
              for (const id in list.byId) {
                bindSession(id);
              }
            }
            const currentMounted = ctx.sidebarRight?.mounted?.getSnapshot();
            if (currentMounted) bindSession(currentMounted);
          } catch {}
        }

        // On session list changes
        if (ctx.sessions?.list) {
          ctx.effect(() => {
            const unsub = ctx.sessions.list.subscribe(() => {
              syncSessions();
            });
            syncSessions();
            return () => {
              if (unsub) unsub();
            };
          }, 'supergraph-team: session list sync');
        }

        if (ctx.sidebarRight?.mounted) {
          ctx.effect(() => {
            const unsub = ctx.sidebarRight.mounted.subscribe(() => {
              const sid = ctx.sidebarRight.mounted.getSnapshot();
              if (sid) bindSession(sid);
            });
            const current = ctx.sidebarRight.mounted.getSnapshot();
            if (current) bindSession(current);
            return () => {
              if (unsub) unsub();
            };
          }, 'supergraph-team: mounted session sync');
        }

        window.addEventListener('supergraph:team:open', (e) => {
          const sid = e?.detail?.sessionId || ctx.sidebarRight?.mounted?.getSnapshot();
          if (sid) autoOpenAndExpand(sid);
        });
      }
    };
  }
});
