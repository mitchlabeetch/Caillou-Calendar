import React, { useEffect, useState } from 'react';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { id: 'intro', label: 'Introduction', num: '01' },
      { id: 'features', label: 'Feature Matrix', num: '02' },
      { id: 'tech-stack', label: 'Tech Stack', num: '03' },
    ],
  },
  {
    title: 'Architecture',
    items: [
      { id: 'architecture', label: 'System Architecture', num: '04' },
      { id: 'data-flow', label: 'Data Flow', num: '05' },
      { id: 'sync-strategy', label: 'Sync Strategy', num: '06' },
      { id: 'state-management', label: 'State Management', num: '07' },
    ],
  },
  {
    title: 'Modules',
    items: [
      { id: 'entry', label: 'Entry & Root', num: '08' },
      { id: 'lib-modules', label: 'Library Modules', num: '09' },
      { id: 'components', label: 'UI Components', num: '10' },
      { id: 'types', label: 'Type Definitions', num: '11' },
    ],
  },
  {
    title: 'Design System',
    items: [
      { id: 'design-system', label: 'Neo-Brutalist Style', num: '12' },
      { id: 'i18n', label: 'Internationalization', num: '13' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'running', label: 'Running the Project', num: '14' },
      { id: 'env', label: 'Environment Variables', num: '15' },
      { id: 'deploy', label: 'Build & Deploy', num: '16' },
      { id: 'gotchas', label: 'Common Pitfalls', num: '17' },
    ],
  },
];

export default function App() {
  const [activeId, setActiveId] = useState<string>('intro');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    NAV_SECTIONS.flatMap((s) => s.items).forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="app">
      {/* ===== Sidebar Navigation ===== */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div></div><div></div><div></div><div></div>
          </div>
          <div className="brand-text">
            <h1>Caillou Wiki</h1>
            <p>Code Documentation</p>
          </div>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div className="nav-section" key={section.title}>
            <div className="nav-title">{section.title}</div>
            <ul className="nav-list">
              {section.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`nav-link${activeId === item.id ? ' active' : ''}`}
                  >
                    <span className="nav-num">{item.num}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{ marginTop: 24, padding: '12px', background: 'var(--bg-app)', border: '2px solid var(--ink)', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>📍 Live preview</div>
          <div style={{ color: 'var(--muted)' }}>
            Use the sidebar to jump to any section. Print-friendly (Ctrl/⌘+P).
          </div>
        </div>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="main">
        {/* HERO */}
        <section className="hero" id="intro">
          <div className="hero-tag">
            <span>📅 v0.0.0</span> React 19 · TypeScript · Vite
          </div>
          <h1 className="hero-title">
            Caillou <span className="accent">Family Calendar</span>
          </h1>
          <p className="hero-subtitle">
            A neo-brutalist family calendar applet for Google AI Studio — supports month,
            week and agenda views, drag-and-drop events, family member tracking, Google
            Calendar sync, push notifications and 6-language i18n. Built to run both with
            Supabase auth/sync <em>and</em> in a fully local/offline mode.
          </p>

          <div className="hero-stats">
            <div className="stat-card accent-primary">
              <div className="stat-num">15+</div>
              <div className="stat-label">React Components</div>
            </div>
            <div className="stat-card accent-mem2">
              <div className="stat-num">11</div>
              <div className="stat-label">Library Modules</div>
            </div>
            <div className="stat-card accent-mem3">
              <div className="stat-num">6</div>
              <div className="stat-label">Locales</div>
            </div>
            <div className="stat-card accent-mem4">
              <div className="stat-num">100%</div>
              <div className="stat-label">Offline Capable</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="section" id="features">
          <div className="section-eyebrow"><span className="dot"></span>02 · Feature Matrix</div>
          <h2 className="section-title">What it does</h2>
          <p className="section-desc">
            Caillou is opinionated about visual style and UX. Below is a complete inventory
            of the user-facing features supported by the current code base.
          </p>

          <div className="feature-grid">
            <div className="feature"><div className="feature-icon">📅</div><div><b>Month view</b><br/>Full month grid with overflowed events and recurrence expansion.</div></div>
            <div className="feature"><div className="feature-icon">🗓️</div><div><b>Week view</b><br/>Time-grid with overlap clustering and resize handles.</div></div>
            <div className="feature"><div className="feature-icon">📜</div><div><b>Agenda view</b><br/>Mobile-first list of upcoming events grouped by day.</div></div>
            <div className="feature"><div className="feature-icon">👪</div><div><b>Family members</b><br/>Reorderable sidebar with color, icon, and last-seen status.</div></div>
            <div className="feature"><div className="feature-icon">🎂</div><div><b>Birthdays</b><br/>Auto-yearly recurrence with gift icon and pinned events.</div></div>
            <div className="feature"><div className="feature-icon">🔁</div><div><b>Recurrence</b><br/>Daily / weekly / monthly / yearly + exception dates.</div></div>
            <div className="feature"><div className="feature-icon">🔔</div><div><b>Reminders</b><br/>15m / 1h / 1d with Web Push via Supabase Edge Function.</div></div>
            <div className="feature"><div className="feature-icon">🖐️</div><div><b>Drag &amp; drop</b><br/>Move events between days, swap on overlap, resize duration.</div></div>
            <div className="feature"><div className="feature-icon">🔍</div><div><b>Quick add</b><br/>Double-click day cells. Chrono NLP parses dates from titles.</div></div>
            <div className="feature"><div className="feature-icon">📍</div><div><b>Locations</b><br/>Named places with icons used as status presets.</div></div>
            <div className="feature"><div className="feature-icon">🌐</div><div><b>Google sync</b><br/>Push all events to user's primary Google Calendar.</div></div>
            <div className="feature"><div className="feature-icon">📤</div><div><b>ICS export</b><br/>Download full calendar as <code>.ics</code> for any client.</div></div>
            <div className="feature"><div className="feature-icon">🖨️</div><div><b>Print mode</b><br/>Dedicated print stylesheet strips neo shadows & chrome.</div></div>
            <div className="feature"><div className="feature-icon">⌨️</div><div><b>Keyboard</b><br/>Arrows, Shift+arrows, M/W/T, 1–9 to filter members.</div></div>
            <div className="feature"><div className="feature-icon">📱</div><div><b>Touch DnD</b><br/>mobile-drag-drop polyfill with hold-to-drag=300ms.</div></div>
            <div className="feature"><div className="feature-icon">💾</div><div><b>IndexedDB</b><br/>Local persistence via <code>idb</code> with localStorage fallback.</div></div>
          </div>
        </section>

        {/* TECH STACK */}
        <section className="section" id="tech-stack">
          <div className="section-eyebrow"><span className="dot"></span>03 · Tech Stack</div>
          <h2 className="section-title">Languages, libraries, runtime</h2>
          <p className="section-desc">
            All listed dependencies are pinned in <code>package.json</code>; the project
            intentionally avoids Redux/Zustand in favor of a single React Context.
          </p>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Technology</th>
                  <th>Version</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="pill">UI</span></td>
                  <td>React + ReactDOM</td>
                  <td><code>^19.0.1</code></td>
                  <td>Component model &amp; concurrent rendering.</td>
                </tr>
                <tr>
                  <td><span className="pill">Lang</span></td>
                  <td>TypeScript</td>
                  <td><code>~5.8.2</code></td>
                  <td>Strict-ish typing; <code>tsc --noEmit</code> via <code>npm run lint</code>.</td>
                </tr>
                <tr>
                  <td><span className="pill">Build</span></td>
                  <td>Vite + @tailwindcss/vite</td>
                  <td><code>^6.2.3</code> / <code>^4.1.14</code></td>
                  <td>HMR dev server, Tailwind v4 plugin (no <code>tailwind.config.js</code>).</td>
                </tr>
                <tr>
                  <td><span className="pill">Style</span></td>
                  <td>Tailwind CSS</td>
                  <td><code>^4.1.14</code></td>
                  <td>Tokens defined in <code>@theme</code> inside <code>index.css</code>.</td>
                </tr>
                <tr>
                  <td><span className="pill">Anim</span></td>
                  <td>Framer Motion / motion</td>
                  <td><code>^12.40</code></td>
                  <td>Modal transitions, layout animations, drag gestures.</td>
                </tr>
                <tr>
                  <td><span className="pill">Date</span></td>
                  <td>date-fns / date-fns-tz</td>
                  <td><code>^4.3</code></td>
                  <td>All date math. ISO <code>YYYY-MM-DD</code> strings as canonical form.</td>
                </tr>
                <tr>
                  <td><span className="pill">i18n</span></td>
                  <td>i18next + react-i18next</td>
                  <td><code>^26</code></td>
                  <td>6 bundled locales with browser language detection.</td>
                </tr>
                <tr>
                  <td><span className="pill">Backend</span></td>
                  <td>@supabase/supabase-js</td>
                  <td><code>^2.106</code></td>
                  <td>Realtime + auth + Postgres (mis-named Firestore in code).</td>
                </tr>
                <tr>
                  <td><span className="pill">Storage</span></td>
                  <td>idb</td>
                  <td><code>^8.0.3</code></td>
                  <td>IndexedDB wrapper for local persistence + sync queue.</td>
                </tr>
                <tr>
                  <td><span className="pill">DnD</span></td>
                  <td>mobile-drag-drop</td>
                  <td><code>^3.0.0-rc</code></td>
                  <td>Touch/hold-to-drag polyfill initialized in <code>main.tsx</code>.</td>
                </tr>
                <tr>
                  <td><span className="pill">NLP</span></td>
                  <td>chrono-node</td>
                  <td><code>^2.9</code></td>
                  <td>Parses natural-language dates in event titles.</td>
                </tr>
                <tr>
                  <td><span className="pill">Icons</span></td>
                  <td>lucide-react</td>
                  <td><code>^0.546</code></td>
                  <td>Icon library used everywhere.</td>
                </tr>
                <tr>
                  <td><span className="pill">Test</span></td>
                  <td>Puppeteer + tsx</td>
                  <td><code>^25</code> / <code>^4.21</code></td>
                  <td>Browser smoke tests + ad-hoc TypeScript execution.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ARCHITECTURE */}
        <section className="section" id="architecture">
          <div className="section-eyebrow"><span className="dot"></span>04 · System Architecture</div>
          <h2 className="section-title">How the pieces fit together</h2>
          <p className="section-desc">
            The app is a single-page React 19 application served by Vite. State lives in a
            single <code>EventsContext</code> provider mounted in <code>App.tsx</code>. Every
            backend module is <b>lazy-imported</b> so the app boots even with no Supabase
            configuration.
          </p>

          <div className="flow-diagram">
            <div className="flow-tier">
              <div className="tier-label">Presentation Layer</div>
              <div className="tier-row">
                <div className="tier-box accent">CalendarMonth</div>
                <div className="tier-box accent">CalendarWeek</div>
                <div className="tier-box accent">CalendarAgenda</div>
                <div className="tier-box accent">Sidebar</div>
                <div className="tier-box accent">MemberFilterBar</div>
              </div>
              <div className="tier-row">
                <div className="tier-box">AddEventModal</div>
                <div className="tier-box">EventDetailModal</div>
                <div className="tier-box">DayEventsModal</div>
                <div className="tier-box">FamilyModal</div>
                <div className="tier-box">PlacesModal</div>
                <div className="tier-box">SettingsModal</div>
                <div className="tier-box">SetStatusModal</div>
                <div className="tier-box">ReminderSystem</div>
                <div className="tier-box">EventHoverCard</div>
              </div>
            </div>

            <div className="flow-arrow">▼</div>

            <div className="flow-tier">
              <div className="tier-label">State Container (React Context)</div>
              <div className="tier-row">
                <div className="tier-box primary">EventsContext</div>
                <div className="tier-box">useEvents()</div>
              </div>
            </div>

            <div className="flow-arrow">▼</div>

            <div className="flow-tier">
              <div className="tier-label">Application Logic</div>
              <div className="tier-row">
                <div className="tier-box tone-2">syncEngine.ts</div>
                <div className="tier-box tone-2">permissions.ts</div>
                <div className="tier-box tone-2">exportIcs.ts</div>
                <div className="tier-box tone-2">googleCalendar.ts</div>
                <div className="tier-box tone-2">pushNotifications.ts</div>
              </div>
            </div>

            <div className="flow-arrow">▼</div>

            <div className="flow-tier">
              <div className="tier-label">Persistence Adapters</div>
              <div className="tier-row">
                <div className="tier-box tone-3">localDb.ts (IndexedDB)</div>
                <div className="tier-box tone-3">supabase.ts (remote)</div>
                <div className="tier-box">localStorage (fallback)</div>
              </div>
            </div>

            <div className="flow-arrow">▼</div>

            <div className="flow-tier">
              <div className="tier-label">External Services</div>
              <div className="tier-row">
                <div className="tier-box">Supabase (Postgres + Auth + Realtime)</div>
                <div className="tier-box">Google Calendar API</div>
                <div className="tier-box">Web Push / Service Worker</div>
              </div>
            </div>
          </div>
        </section>

        {/* DATA FLOW */}
        <section className="section" id="data-flow">
          <div className="section-eyebrow"><span className="dot"></span>05 · Data Flow</div>
          <h2 className="section-title">From user click to disk</h2>
          <p className="section-desc">
            All mutations follow the same three-step pattern: update React state → enqueue
            sync → write to IndexedDB. The UI never blocks on the network.
          </p>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">⚡</div>
              <div>
                <div className="card-title">Write path</div>
                <div className="card-subtitle">add / update / delete an event</div>
              </div>
            </div>
            <ol className="steps">
              <li>User action (drag, click, submit) triggers a callback from a component.</li>
              <li>
                Callback calls a setter like <code>setEvents</code> / <code>setFamilyMembersState</code>
                or one of the typed context helpers (<code>addFamilyMember</code>, etc.).
              </li>
              <li>
                A <code>useEffect</code> mirror persists the new state to IndexedDB via
                <code>localDb.setEvents(...)</code> and to <code>localStorage</code> as a
                compatibility fallback.
              </li>
              <li>
                In parallel, <code>syncInsert</code> / <code>syncUpdate</code> /
                <code>syncDelete</code> is invoked from <code>syncEngine.ts</code>:
                <br />
                · if Supabase is configured <em>and</em> online → direct REST write<br />
                · otherwise → push to <code>outbound_sync_queue</code> in IndexedDB
              </li>
              <li>
                When the browser fires <code>online</code>, <code>flushOutboundSyncQueue()</code>
                drains the queue and clears successful entries.
              </li>
            </ol>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">📥</div>
              <div>
                <div className="card-title">Read path</div>
                <div className="card-subtitle">initial load + realtime</div>
              </div>
            </div>
            <ol className="steps">
              <li>
                On mount, <code>App.tsx</code> reads <code>localDb.getEvents()</code> first
                (fast, offline-safe).
              </li>
              <li>
                If a Supabase session exists, a fetch from the <code>events</code> table
                is performed and reconciled with the local snapshot via <code>dbRowToEvent</code>.
              </li>
              <li>
                A <code>postgres_changes</code> channel subscription is opened with the filter
                <code>owner_id=eq.&lt;user.id&gt;</code>. Each insert/update/delete triggers a
                re-fetch so all open tabs stay in sync.
              </li>
              <li>
                <code>getDayEvents()</code> in <code>CalendarMonth</code> and
                <code>CalendarWeek</code> filters the in-memory list, expanding recurring
                events on the fly (no pre-computed instances).
              </li>
            </ol>
          </div>
        </section>

        {/* SYNC STRATEGY */}
        <section className="section" id="sync-strategy">
          <div className="section-eyebrow"><span className="dot"></span>06 · Sync Strategy</div>
          <h2 className="section-title">Supabase-first, Local fallback</h2>
          <p className="section-desc">
            The app is designed to function <em>identically</em> with or without a backend.
            When <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code> are
            absent or malformed, <code>getSupabase()</code> returns <code>null</code> and the
            app runs in <b>local-user</b> mode against IndexedDB + localStorage.
          </p>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr><th>Mode</th><th>Trigger</th><th>Storage</th><th>Realtime</th><th>Auth</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="pill">Local-only</span></td>
                  <td>Missing/invalid Supabase env vars</td>
                  <td>IndexedDB (<code>caillou-calendar</code>)</td>
                  <td>None</td>
                  <td>Synthetic <code>local-user</code></td>
                </tr>
                <tr>
                  <td><span className="pill primary">Supabase</span></td>
                  <td>Both env vars set and look like a URL</td>
                  <td>IndexedDB <em>and</em> Postgres tables</td>
                  <td><code>postgres_changes</code> channel</td>
                  <td>Email/password or Google OAuth</td>
                </tr>
                <tr>
                  <td><span className="pill outline">Offline + queued</span></td>
                  <td>Supabase present but <code>navigator.onLine === false</code></td>
                  <td>IndexedDB + <code>outbound_sync_queue</code></td>
                  <td>Paused</td>
                  <td>Last known session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 20 }}>
            <b>Important:</b> All modules that talk to Supabase are imported <em>inside</em>
            effects or callbacks via <code>import('./lib/supabase')</code>. A top-level
            import would crash the app if env vars were missing.
          </p>

          <div className="code-wrap">
            <div className="code-label">// Lazy import pattern</div>
            <pre>{`useEffect(() => {
  import('./lib/supabase').then(s => {
    const sb = s.getSupabase();
    if (!sb) {
      setUser({ uid: 'local-user', email: 'local@example.com' });
      return;
    }
    sb.auth.getSession().then(/* ... */);
  });
}, []);`}</pre>
          </div>
        </section>

        {/* STATE MANAGEMENT */}
        <section className="section" id="state-management">
          <div className="section-eyebrow"><span className="dot"></span>07 · State Management</div>
          <h2 className="section-title">EventsContext — the single source of truth</h2>
          <p className="section-desc">
            <code>src/App.tsx</code> owns all core state (<code>events</code>,
            <code>familyMembers</code>, <code>places</code>, <code>settings</code>,
            <code>user</code>, <code>selectedMembers</code>, multi-select flags, etc.) and
            exposes mutators through <code>EventsContext</code>. Components always consume it
            via the <code>useEvents()</code> hook — never via direct props.
          </p>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🧠</div>
              <div>
                <div className="card-title">EventsContextType surface</div>
                <div className="card-subtitle">src/lib/eventsContext.tsx</div>
              </div>
            </div>
            <p>
              The contract combines events CRUD, family CRUD, places CRUD, settings updates,
              drag-and-drop helpers (<code>moveEvent</code>, <code>swapEvents</code>),
              multi-select management, drop animation trigger, and the role-based
              <code>userRole</code> flag.
            </p>

            <div className="code-wrap">
              <div className="code-label">// src/lib/eventsContext.tsx</div>
              <pre>{`export interface EventsContextType {
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newDate: string, newTime?: string) => void;
  swapEvents: (idA: string, idB: string) => void;

  familyMembers: FamilyMember[];
  addFamilyMember: (m: FamilyMember) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteFamilyMember: (id: string) => void;
  reorderFamilyMembers: (members: FamilyMember[]) => void;

  places: Place[];
  addPlace / updatePlace / deletePlace: ...

  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  showToast: (msg: string) => void;
  selectedMembers: string[];
  toggleMember: (id: string) => void;
  setSelectedEventId: (id: string | null) => void;
  isMultiSelectMode: boolean;
  selectedEventIdsForDelete: string[];
  toggleEventSelectionForDelete: (id: string) => void;
  droppedEventId: string | null;
  triggerDropAnimation: (id: string) => void;

  userRole: UserRole;
}`}</pre>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🔐</div>
              <div>
                <div className="card-title">Permissions matrix</div>
                <div className="card-subtitle">src/lib/permissions.ts</div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>Action</th><th>admin</th><th>member</th><th>child</th></tr>
                </thead>
                <tbody>
                  <tr><td>Create event</td><td>✅</td><td>✅</td><td>❌</td></tr>
                  <tr><td>Edit / delete own event</td><td>✅</td><td>✅</td><td>only if tagged</td></tr>
                  <tr><td>Bulk delete</td><td>✅</td><td>❌</td><td>❌</td></tr>
                  <tr><td>Manage family</td><td>✅</td><td>❌</td><td>❌</td></tr>
                  <tr><td>Manage places</td><td>✅</td><td>✅</td><td>❌</td></tr>
                  <tr><td>Manage settings</td><td>✅</td><td>❌</td><td>❌</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ENTRY */}
        <section className="section" id="entry">
          <div className="section-eyebrow"><span className="dot"></span>08 · Entry & Root</div>
          <h2 className="section-title">Bootstrap sequence</h2>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🚪</div>
              <div>
                <div className="card-title">main.tsx</div>
                <div className="card-subtitle">src/main.tsx — entry point</div>
              </div>
            </div>
            <p>
              Performs four one-time side effects before mounting <code>App</code>:
            </p>
            <ol className="steps">
              <li>Imports <code>./lib/i18n</code> to initialise i18next synchronously.</li>
              <li>Initialises the <code>mobile-drag-drop</code> polyfill with <code>holdToDrag: 300ms</code>.</li>
              <li>Adds a passive <code>touchmove</code> listener — required to make drag-and-drop work on some mobile browsers.</li>
              <li>Registers <code>/sw.js</code> as a service worker (push notifications only — no caching).</li>
            </ol>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🏠</div>
              <div>
                <div className="card-title">App.tsx</div>
                <div className="card-subtitle">src/App.tsx — root component</div>
              </div>
            </div>
            <p>
              The default export. It accepts an optional <code>timeZone</code> prop (default
              <code>'Europe/Paris'</code>) and is responsible for:
            </p>
            <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.7 }}>
              <li>Owning global state (view, currentDate, modals, multi-select, toast).</li>
              <li>Bootstrapping Supabase auth + realtime subscriptions.</li>
              <li>Hydrating IndexedDB → state, then migrating localStorage entries.</li>
              <li>Wiring keyboard shortcuts (←/→, Shift+←/→, M/W/T, 1–9).</li>
              <li>Rendering header, sidebar, calendar views, modals and the global toast.</li>
              <li>Wrapping everything in <code>EventsContext.Provider</code>.</li>
            </ul>
          </div>
        </section>

        {/* LIB MODULES */}
        <section className="section" id="lib-modules">
          <div className="section-eyebrow"><span className="dot"></span>09 · Library Modules</div>
          <h2 className="section-title">src/lib/* — the domain core</h2>

          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <div className="card-icon">🗄️</div>
                <div>
                  <div className="card-title">supabase.ts</div>
                  <div className="card-subtitle">Lazy client + row mappers</div>
                </div>
              </div>
              <p>
                Exposes a memoised <code>getSupabase()</code> singleton that returns
                <code>null</code> when env vars are missing. Provides snake_case ↔
                camelCase mappers for every persisted table:
                <code>eventToDbRow / dbRowToEvent</code>, <code>memberToDbRow / dbRowToMember</code>,
                <code>settingsToDbRow / dbRowToSettings</code>. Auth helpers:
                <code>signInWithGoogle</code>, <code>signInWithEmail</code>,
                <code>signUpWithEmail</code>, <code>signOut</code>.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">💾</div>
                <div>
                  <div className="card-title">localDb.ts</div>
                  <div className="card-subtitle">IndexedDB wrapper + outbound queue</div>
                </div>
              </div>
              <p>
                Opens the <code>caillou-calendar</code> database (version 1) with 5 object
                stores: <code>events</code>, <code>family_members</code>, <code>places</code>,
                <code>settings</code>, <code>outbound_sync_queue</code>. Exposes typed CRUD
                helpers and <code>enqueueSync / getOutboundQueue / clearOutboundQueue</code>
                for offline write buffering. <code>flushOutboundSyncQueue()</code> drains the
                queue when the browser comes back online.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">🔄</div>
                <div>
                  <div className="card-title">syncEngine.ts</div>
                  <div className="card-subtitle">The write pipeline</div>
                </div>
              </div>
              <p>
                Three core helpers — <code>syncInsert / syncUpdate / syncDelete</code> — and
                a re-export of <code>flushOutboundSyncQueue</code>. Each helper attempts a
                direct REST call first and falls back to the IndexedDB queue if Supabase is
                absent, offline, or rejects the request. Handles both full payloads and
                partial updates for events / family_members / settings.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">🔐</div>
                <div>
                  <div className="card-title">permissions.ts</div>
                  <div className="card-subtitle">Role-based capability checks</div>
                </div>
              </div>
              <p>
                Pure functions over the <code>UserRole</code> enum:
                <code>canCreateEvent</code>, <code>canEditEvent / canDeleteEvent</code>
                (children can only edit events that include them),
                <code>canManageFamily / canManagePlaces / canManageSettings</code>, and
                <code>canBulkDelete</code>.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">📤</div>
                <div>
                  <div className="card-title">exportIcs.ts</div>
                  <div className="card-subtitle">RFC 5545 ICS export</div>
                </div>
              </div>
              <p>
                Builds an RFC 5545 compliant VCALENDAR with one VEVENT per record, escapes
                commas / semicolons / newlines, expands member IDs to a comma-separated
                description, and triggers a browser download named
                <code>family_calendar.ics</code>. All-day events use <code>DTSTART;VALUE=DATE</code>.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">📅</div>
                <div>
                  <div className="card-title">googleCalendar.ts</div>
                  <div className="card-subtitle">Push to user's primary GCal</div>
                </div>
              </div>
              <p>
                <code>pushEventsToGoogleCalendar(events)</code> reads the Supabase session's
                <code>provider_token</code> (scoped to
                <code>https://www.googleapis.com/auth/calendar.events</code>) and POSTs each
                event to <code>/calendar/v3/calendars/primary/events</code>. All-day events
                are converted to Google&apos;s exclusive end-date format by adding one day.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">🔔</div>
                <div>
                  <div className="card-title">pushNotifications.ts</div>
                  <div className="card-subtitle">Web Push subscription helpers</div>
                </div>
              </div>
              <p>
                Uses the VAPID public key (<code>VITE_VAPID_PUBLIC_KEY</code>) to subscribe
                via <code>PushManager</code> and persists the subscription in
                <code>user_subscriptions</code>. The matching Supabase Edge Function at
                <code>supabase/functions/push-notification/index.ts</code> reads new events
                and dispatches web-push messages to all subscribers.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">🌐</div>
                <div>
                  <div className="card-title">i18n.ts</div>
                  <div className="card-subtitle">i18next bootstrap</div>
                </div>
              </div>
              <p>
                Configures <code>i18next</code> with <code>LanguageDetector</code> and
                <code>initReactI18next</code>; bundles 6 translations from
                <code>src/locales/*.json</code>. <code>fallbackLng</code> is English.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">📆</div>
                <div>
                  <div className="card-title">dateLocale.ts</div>
                  <div className="card-subtitle">date-fns locale mapper</div>
                </div>
              </div>
              <p>
                <code>getDateLocale(lang)</code> returns the matching <code>date-fns</code>
                locale object based on the prefix of the active language, falling back to
                <code>enUS</code>.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">🛠️</div>
                <div>
                  <div className="card-title">utils.ts</div>
                  <div className="card-subtitle">Shared helpers</div>
                </div>
              </div>
              <p>
                <code>cn(...inputs)</code> — clsx + tailwind-merge. Conflict detection:
                <code>hasSchedulingConflict(a, b)</code> (same-day, overlapping time, shared
                member) and <code>getConflictsForEvent(draft, all)</code> for live conflict
                warnings inside <code>AddEventModal</code>.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">🪝</div>
                <div>
                  <div className="card-title">eventsContext.tsx</div>
                  <div className="card-subtitle">React Context contract</div>
                </div>
              </div>
              <p>
                Defines <code>EventsContextType</code>, exports <code>EventsContext</code>
                and the <code>useEvents()</code> hook (which throws if used outside the
                provider). <strong>Always</strong> use this hook — never pass calendar data
                down through props.
              </p>
            </div>

            <div className="card">
              <div className="card-head">
                <div className="card-icon">📐</div>
                <div>
                  <div className="card-title">hooks/useIsMobile.ts</div>
                  <div className="card-subtitle">Responsive helper</div>
                </div>
              </div>
              <p>
                Returns a boolean reflecting the <code>(max-width: 640px)</code> media query.
                Used to switch between <code>CalendarAgenda</code> (mobile) and the month /
                week grid (desktop).
              </p>
            </div>
          </div>
        </section>

        {/* COMPONENTS */}
        <section className="section" id="components">
          <div className="section-eyebrow"><span className="dot"></span>10 · UI Components</div>
          <h2 className="section-title">src/components/* — what the user sees</h2>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">📅</div>
              <div>
                <div className="card-title">Calendar views</div>
                <div className="card-subtitle">Month / Week / Agenda</div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>Component</th><th>Responsibility</th><th>Key behaviours</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>CalendarMonth</code></td>
                    <td>Month grid (7×5/6 cells) with per-day event pills.</td>
                    <td>Single-click → DayEventsModal; double-click → inline quick-add; drag events to move dates; drop on another event to swap.</td>
                  </tr>
                  <tr>
                    <td><code>CalendarWeek</code></td>
                    <td>Time-grid (7 AM – 9 PM, 60-min rows) with absolute-positioned events.</td>
                    <td>Cluster + side-by-side layout for overlapping events; resize bottom handle; double-click hour → quick-add.</td>
                  </tr>
                  <tr>
                    <td><code>CalendarAgenda</code></td>
                    <td>Mobile list grouped by date with primary-member color.</td>
                    <td>Today / tomorrow header chips; shows startTime + location + member avatars.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🪟</div>
              <div>
                <div className="card-title">Modal dialogs</div>
                <div className="card-subtitle">All use AnimatePresence + role=&quot;dialog&quot;</div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>Component</th><th>Triggered by</th><th>Capabilities</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>AddEventModal</code></td>
                    <td>Floating "+" button (admin only).</td>
                    <td>Title, location, start/end date, time, recurrence, reminder, birthday flag, member picker, driver, conflict warning, event-suggestion auto-complete. Chrono-node parses dates from the title.</td>
                  </tr>
                  <tr>
                    <td><code>EventDetailModal</code></td>
                    <td>Clicking an event pill.</td>
                    <td>Read-only view with quick edit, per-event ICS download, delete.</td>
                  </tr>
                  <tr>
                    <td><code>DayEventsModal</code></td>
                    <td>Single-click on a day cell.</td>
                    <td>Scrollable list of that day&apos;s events sorted by start time.</td>
                  </tr>
                  <tr>
                    <td><code>FamilyModal</code></td>
                    <td>Sidebar &quot;Manage Family&quot;.</td>
                    <td>Add / rename / recolor / reicon / delete members.</td>
                  </tr>
                  <tr>
                    <td><code>PlacesModal</code></td>
                    <td>Sidebar &quot;Manage Locations&quot;.</td>
                    <td>Add / rename / reicon named places.</td>
                  </tr>
                  <tr>
                    <td><code>SettingsModal</code></td>
                    <td>Sidebar &quot;Settings&quot;.</td>
                    <td>Language, start-of-week, time format, push toggle.</td>
                  </tr>
                  <tr>
                    <td><code>SetStatusModal</code></td>
                    <td>Sidebar status tile or context menu.</td>
                    <td>Preset locations (Home, School, Work, Gym…) or custom text + icon.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🧩</div>
              <div>
                <div className="card-title">Auxiliary UI</div>
                <div className="card-subtitle">Sidebar, filter bar, hover card, reminders</div>
              </div>
            </div>
            <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.7 }}>
              <li><b>Sidebar</b> — collapsible (90 ↔ 280 px), shows reorderable family member chips (Reorder.Group), a status grid, latest-news strip, settings/places/family/logout buttons. Right-click opens a context menu for edit/icon/delete.</li>
              <li><b>MemberFilterBar</b> — sticky horizontal filter strip above the calendar; clicking toggles a member.</li>
              <li><b>EventHoverCard</b> — absolutely-positioned tooltip on every event pill; shows time, location, members, recurrence and reminder count.</li>
              <li><b>ReminderSystem</b> — polls every 10s, fires OS / service-worker notifications when a reminder window crosses the current time, and surfaces an in-app toast stack.</li>
            </ul>
          </div>
        </section>

        {/* TYPES */}
        <section className="section" id="types">
          <div className="section-eyebrow"><span className="dot"></span>11 · Type Definitions</div>
          <h2 className="section-title">src/types.ts — the canonical model</h2>

          <div className="code-wrap">
            <div className="code-label">// src/types.ts (excerpt)</div>
            <pre>{`export type FamilyMember = {
  id: string;
  name: string;
  color: string;        // legacy key like 'bg-mem-1'
  bgClass: string;      // tailwind background class
  icon: string;         // lucide-react component name
  currentLocation?: { text: string; icon: string; updatedAt?: string };
};

export type Place = { id: string; name: string; icon?: string };

export type Recurrence = {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string;     // YYYY-MM-DD
  count?: number;
};

export type Reminder = '15m' | '1h' | '1d';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;                   // YYYY-MM-DD, INCLUSIVE
  endDate?: string;               // YYYY-MM-DD, INCLUSIVE in UI
  startTime?: string;             // HH:mm
  endTime?: string;               // HH:mm
  memberIds: string[];
  thumbnailUrl?: string;
  location?: string;
  recurrence?: Recurrence;
  reminders?: Reminder[];
  isBirthday?: boolean;           // forces recurrence.type = 'yearly'
  driverId?: string;
  exceptionDates?: string[];      // dates skipped from a recurring pattern
};

export type AppSettings = {
  startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;   // 0 = Sunday
  timeFormat: '12h' | '24h';
};

export type UserRole = 'admin' | 'member' | 'child';`}</pre>
          </div>

          <p style={{ marginTop: 16 }}>
            <b>Conventions:</b> all dates are ISO strings, all times are <code>HH:mm</code>,
            event IDs use <code>Math.random().toString(36).substring(7)</code> — not UUIDs.
            <code>endDate</code> is inclusive in the UI; the Google Calendar adapter adds one
            day to convert to Google&apos;s exclusive form. Setting <code>isBirthday: true</code>
            forces <code>recurrence.type === 'yearly'</code> in the UI.
          </p>
        </section>

        {/* DESIGN SYSTEM */}
        <section className="section" id="design-system">
          <div className="section-eyebrow"><span className="dot"></span>12 · Neo-Brutalist Design System</div>
          <h2 className="section-title">Visual language</h2>
          <p className="section-desc">
            The entire UI is built on a small set of rules: thick black borders, offset
            hard shadows, saturated colors, and an off-white yellow-green background. All
            tokens live in <code>@theme</code> inside <code>src/index.css</code>.
          </p>

          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Color tokens</h3>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Token</th><th>Value</th><th>Usage</th></tr></thead>
              <tbody>
                <tr><td><code>primary</code></td><td><code>#ff4d15</code></td><td>Primary actions, today highlight, active filter.</td></tr>
                <tr><td><code>bg-app</code></td><td><code>#fcffe4</code></td><td>Page background.</td></tr>
                <tr><td><code>surface</code></td><td><code>#FFFFFF</code></td><td>Cards, modals, sidebar.</td></tr>
                <tr><td><code>ink</code></td><td><code>#1A1A1A</code></td><td>Borders, text, shadows.</td></tr>
                <tr><td><code>mem-1</code></td><td><code>#B39DDB</code></td><td>Family member 1.</td></tr>
                <tr><td><code>mem-2</code></td><td><code>#80CBC4</code></td><td>Family member 2.</td></tr>
                <tr><td><code>mem-3</code></td><td><code>#FFAB91</code></td><td>Family member 3.</td></tr>
                <tr><td><code>mem-4</code></td><td><code>#F48FB1</code></td><td>Family member 4.</td></tr>
              </tbody>
            </table>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 28, marginBottom: 8 }}>Member color swatches</h3>
          <div className="member-row">
            <div className="member-swatch">
              <div className="swatch-chip" style={{ background: 'var(--mem-1)' }}></div>
              <div className="swatch-name">Mom</div>
              <div className="swatch-tok">mem-1</div>
            </div>
            <div className="member-swatch">
              <div className="swatch-chip" style={{ background: 'var(--mem-2)' }}></div>
              <div className="swatch-name">Dad</div>
              <div className="swatch-tok">mem-2</div>
            </div>
            <div className="member-swatch">
              <div className="swatch-chip" style={{ background: 'var(--mem-3)' }}></div>
              <div className="swatch-name">Leo</div>
              <div className="swatch-tok">mem-3</div>
            </div>
            <div className="member-swatch">
              <div className="swatch-chip" style={{ background: 'var(--mem-4)' }}></div>
              <div className="swatch-name">Mia</div>
              <div className="swatch-tok">mem-4</div>
            </div>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 28, marginBottom: 8 }}>Shadow & border conventions</h3>
          <ul style={{ paddingLeft: 20, fontSize: 15, lineHeight: 1.8 }}>
            <li><code>shadow-neo</code> = <code>4px 4px 0 #1A1A1A</code> (resting)</li>
            <li><code>shadow-neo-hover</code> = <code>6px 6px 0 #1A1A1A</code> (hovered)</li>
            <li>Borders are <code>border-[3px]</code> / <code>border-[4px]</code> / <code>border-thick</code> (4px).</li>
            <li>Buttons always have <code>hover:-translate-y-1 active:translate-y-1</code>.</li>
            <li>Multi-member events use a striped CSS gradient:
              <div style={{ height: 24, marginTop: 8, border: '3px solid var(--ink)', borderRadius: 8, boxShadow: '3px 3px 0 var(--ink)', background: 'repeating-linear-gradient(45deg, var(--mem-1) 0 10px, var(--mem-2) 10px 20px, var(--mem-3) 20px 30px, var(--mem-4) 30px 40px)' }}></div>
            </li>
          </ul>

          <h3 style={{ fontSize: 18, fontWeight: 800, marginTop: 28, marginBottom: 8 }}>Print stylesheet</h3>
          <p>
            <code>@media print</code> rules in <code>index.css</code> hide the sidebar,
            modals, FAB and headers; strip shadows; flatten colors so the printed page is
            purely informational. Call <code>window.print()</code> from the header.
          </p>
        </section>

        {/* I18N */}
        <section className="section" id="i18n">
          <div className="section-eyebrow"><span className="dot"></span>13 · Internationalization</div>
          <h2 className="section-title">Six bundled locales</h2>
          <p className="section-desc">
            Translations live in <code>src/locales/*.json</code> under the <code>app</code>
            namespace. Adding a new key requires updating all six files in lock-step.
          </p>

          <div className="grid-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>🇬🇧</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>English</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>en.json</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>🇫🇷</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>Français</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>fr.json</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>🇪🇸</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>Español</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>es.json</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>🇩🇪</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>Deutsch</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>de.json</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>🇮🇹</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>Italiano</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>it.json</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>🇵🇹</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 8 }}>Português</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>pt.json</div>
            </div>
          </div>

          <div className="code-wrap">
            <div className="code-label">// Adding a new key — must touch all 6 files</div>
            <pre>{`// 1. en.json
{ "app": { "myKey": "Hello, world!" } }

// 2. fr.json
{ "app": { "myKey": "Bonjour le monde !" } }

// ... es.json, de.json, it.json, pt.json

// 3. Use it in any component:
const { t } = useTranslation();
return <p>{t('app.myKey')}</p>;`}</pre>
          </div>
        </section>

        {/* RUNNING */}
        <section className="section" id="running">
          <div className="section-eyebrow"><span className="dot"></span>14 · Running the Project</div>
          <h2 className="section-title">Local development</h2>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">⚙️</div>
              <div>
                <div className="card-title">Prerequisites</div>
                <div className="card-subtitle">Node 18+, npm 9+</div>
              </div>
            </div>
            <ol className="steps">
              <li>Clone the repository and open a terminal in the project root.</li>
              <li>Run <code>npm install</code> — installs React 19, Vite 6, Tailwind v4, Supabase, etc.</li>
              <li>(Optional) Copy <code>.env.example</code> to <code>.env.local</code> and fill in the Supabase + VAPID keys. Without these the app boots in local-only mode.</li>
              <li>Start the dev server with <code>npm run dev</code> → open <code>http://localhost:3000</code>.</li>
            </ol>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🛠️</div>
              <div>
                <div className="card-title">npm scripts</div>
                <div className="card-subtitle">From package.json</div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Command</th><th>Purpose</th></tr></thead>
                <tbody>
                  <tr><td><code>npm run dev</code></td><td>Start Vite dev server on <code>0.0.0.0:3000</code>.</td></tr>
                  <tr><td><code>npm run build</code></td><td>Production build into <code>dist/</code>.</td></tr>
                  <tr><td><code>npm run preview</code></td><td>Preview the production build.</td></tr>
                  <tr><td><code>npm run lint</code></td><td>Type-check only (<code>tsc --noEmit</code>).</td></tr>
                  <tr><td><code>npm run clean</code></td><td>Remove <code>dist/</code> and <code>server.js</code> (Unix <code>rm -rf</code> — breaks on Windows).</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">🧪</div>
              <div>
                <div className="card-title">Ad-hoc testing scripts</div>
                <div className="card-subtitle">No Jest/Vitest configured</div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Script</th><th>What it does</th></tr></thead>
                <tbody>
                  <tr><td><code>node test-browser.cjs</code></td><td>Puppeteer smoke test against <code>localhost:3000</code>.</td></tr>
                  <tr><td><code>node test-browser-modal.cjs</code></td><td>Modal open / close flow.</td></tr>
                  <tr><td><code>node test-date.cjs</code></td><td>Date utility checks.</td></tr>
                  <tr><td><code>npx tsx test-date.ts</code></td><td>Same as above but TypeScript via <code>tsx</code>.</td></tr>
                  <tr><td><code>npx tsx test-render.tsx</code></td><td>React render smoke test (<code>tsx</code> + <code>esbuild</code>).</td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 12 }}>
              To run the browser tests, start <code>npm run dev</code> first, then run the
              <code>.cjs</code> script in another terminal.
            </p>
          </div>
        </section>

        {/* ENV */}
        <section className="section" id="env">
          <div className="section-eyebrow"><span className="dot"></span>15 · Environment Variables</div>
          <h2 className="section-title">All <code>VITE_*</code> vars are client-exposed</h2>

          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Variable</th><th>Required?</th><th>Effect</th></tr></thead>
              <tbody>
                <tr>
                  <td><code>VITE_SUPABASE_URL</code></td>
                  <td>optional</td>
                  <td>Enables Supabase client; without it the app runs in local-only mode.</td>
                </tr>
                <tr>
                  <td><code>VITE_SUPABASE_ANON_KEY</code></td>
                  <td>optional</td>
                  <td>Anon key paired with the URL.</td>
                </tr>
                <tr>
                  <td><code>VITE_VAPID_PUBLIC_KEY</code></td>
                  <td>optional</td>
                  <td>Enables Web Push subscription. Server-side <code>VAPID_PRIVATE_KEY</code> is used by the Edge Function.</td>
                </tr>
                <tr>
                  <td><code>DISABLE_HMR</code></td>
                  <td>internal</td>
                  <td>When <code>true</code>, Vite disables file watching to prevent flickering during AI Studio agent edits. Do not modify.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 16 }}>
            <b>Security note:</b> <code>VITE_*</code> vars are bundled into the client JS and
            are public. The anon key is safe to expose; never put service-role keys or
            private keys into a <code>VITE_*</code> variable.
          </p>
        </section>

        {/* BUILD / DEPLOY */}
        <section className="section" id="deploy">
          <div className="section-eyebrow"><span className="dot"></span>16 · Build & Deploy</div>
          <h2 className="section-title">Production bundle</h2>
          <ol className="steps">
            <li>
              <code>npm run build</code> — invokes <code>vite build</code>. Outputs an
              optimised static bundle into <code>dist/</code> with code-split chunks.
            </li>
            <li>
              <code>npm run preview</code> — locally serves the production bundle for a
              final smoke test.
            </li>
            <li>
              Upload the contents of <code>dist/</code> to any static host (Netlify, Vercel,
              Cloudflare Pages, S3 + CloudFront, GitHub Pages, Firebase Hosting).
            </li>
            <li>
              Ensure the host serves <code>/sw.js</code> with the correct MIME type so the
              service worker can register for push notifications.
            </li>
            <li>
              Set the <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>,
              and <code>VITE_VAPID_PUBLIC_KEY</code> at build time. Edge Function secrets
              (VAPID_PRIVATE, SUPABASE_SERVICE_ROLE) live in Supabase Secrets.
            </li>
            <li>
              Deploy the Edge Function in <code>supabase/functions/push-notification</code>
              via <code>supabase functions deploy push-notification</code>.
            </li>
            <li>
              (Optional) Apply the SQL in <code>supabase/rls.sql</code> to enable
              Row-Level Security on the events / family_members / places / settings tables.
            </li>
          </ol>
        </section>

        {/* GOTCHAS */}
        <section className="section" id="gotchas">
          <div className="section-eyebrow"><span className="dot"></span>17 · Common Pitfalls</div>
          <h2 className="section-title">Things that will bite you</h2>

          <div className="card">
            <div className="card-head">
              <div className="card-icon">⚠️</div>
              <div>
                <div className="card-title">Mistakes to avoid when modifying this codebase</div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>#</th><th>Pitfall</th><th>Correct approach</th></tr></thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Top-level <code>{'import { getSupabase } from "./lib/supabase"'}</code></td>
                    <td>Always lazy-import inside <code>useEffect</code> / callbacks — otherwise the app crashes without env vars.</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Treating <code>endDate</code> as exclusive</td>
                    <td>It is <b>inclusive</b> in the UI. Only the Google Calendar adapter converts to exclusive by adding one day.</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>Setting a recurrence type manually on a birthday event</td>
                    <td>Toggling the birthday checkbox forces <code>recurrence.type = 'yearly'</code>. The dropdown is disabled.</td>
                  </tr>
                  <tr>
                    <td>4</td>
                    <td>Removing <code>mobile-drag-drop</code> from <code>main.tsx</code></td>
                    <td>Touch drag-and-drop will break on mobile; the polyfill is required along with the passive <code>touchmove</code> listener.</td>
                  </tr>
                  <tr>
                    <td>5</td>
                    <td>Assuming <code>eventsService</code> uses Firebase</td>
                    <td>Despite the <code>*Firestore</code> suffix, it is a Supabase wrapper. Do not add real Firestore code.</td>
                  </tr>
                  <tr>
                    <td>6</td>
                    <td>Running <code>npm run clean</code> on Windows</td>
                    <td>It uses <code>rm -rf</code>. Use <code>rmdir /s /q dist</code> on Windows instead.</td>
                  </tr>
                  <tr>
                    <td>7</td>
                    <td>Persisting state changes before checking <code>user.uid !== 'local-user'</code></td>
                    <td>Local-only writes skip the sync engine entirely; there is no Supabase user to enqueue against.</td>
                  </tr>
                  <tr>
                    <td>8</td>
                    <td>Adding keys to one locale only</td>
                    <td>The app falls back to <code>en</code> when a key is missing in another locale — translations silently disappear. Update all 6 files.</td>
                  </tr>
                  <tr>
                    <td>9</td>
                    <td>Using <code>Date</code> objects for event dates</td>
                    <td>Events store ISO strings <code>YYYY-MM-DD</code>. Use <code>parseISO</code> from date-fns to hydrate them.</td>
                  </tr>
                  <tr>
                    <td>10</td>
                    <td>Modifying <code>vite.config.ts</code> HMR logic</td>
                    <td>The <code>DISABLE_HMR</code> switch exists to prevent flickering in AI Studio. Don&apos;t touch it.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', marginBottom: 6 }}>
            🎉 You&apos;ve reached the end of the wiki.
          </div>
          <div>
            Caillou Family Calendar · Code Wiki v1.0 · Built from
            <code style={{ margin: '0 4px' }}>AGENTS.md</code>+ source analysis.
          </div>
          <div style={{ marginTop: 12 }}>
            <a href="#intro" className="pill primary">↑ Back to top</a>
          </div>
        </footer>
      </main>
    </div>
  );
}