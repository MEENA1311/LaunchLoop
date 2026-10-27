
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { get } from '../api';
import { roleLabel } from './UI';
import { useToast } from './Toast';

const icon = {
  dashboard: '⌂',
  ideas: '✦',
  projects: '▣',
  mentors: '♙',
  startups: '◆',
  incubators: '◈',
  challenges: '◇',
  messages: '▱',
  notifications: '◉',
  profile: '◎',
  deals: '◫',
  due: '◌',
  portfolio: '▰',
  applications: '✓',
  users: '♟',
  audit: '≡',
  requests: '◍',
  sessions: '◷',
  evaluations: '★',
  programs: '▤',
  cohorts: '▥',
  support: '✚',
  team: '♧',
  fundraising: '↗'
};

export const menus = {
  student: [
    ['/dashboard', 'Dashboard', 'dashboard'],
    ['/ideas', 'Ideas Lab', 'ideas'],
    ['/projects', 'Projects', 'projects'],
    ['/mentors', 'Mentor Network', 'mentors'],
    ['/startups', 'Startups', 'startups'],
    ['/incubators', 'Incubators', 'incubators'],
    ['/challenges', 'Challenges', 'challenges']
  ],

  mentor: [
    ['/dashboard', 'Dashboard', 'dashboard'],
    ['/requests', 'Mentorship Requests', 'requests'],
    ['/sessions', 'Sessions', 'sessions'],
    ['/evaluations', 'Startup Evaluations', 'evaluations'],
    ['/startups', 'Startups', 'startups'],
    ['/messages', 'Messages', 'messages']
  ],

  startup: [
    ['/dashboard', 'Dashboard', 'dashboard'],
    ['/startups', 'Startup Workspace', 'startups'],
    ['/team', 'Team', 'team'],
    ['/projects', 'Projects', 'projects'],
    ['/incubators', 'Incubation', 'incubators'],
    ['/support', 'Support Requests', 'support'],
    ['/fundraising', 'Fundraising', 'fundraising'],
    ['/deals', 'Deal Room', 'deals']
  ],

  investor: [
    ['/dashboard', 'Dashboard', 'dashboard'],
    ['/startups', 'Discover Startups', 'startups'],
    ['/deals', 'Deal Flow', 'deals'],
    ['/due-diligence', 'Due Diligence', 'due'],
    ['/portfolio', 'Portfolio', 'portfolio']
  ],

  incubator: [
    ['/dashboard', 'Dashboard', 'dashboard'],
    ['/programs', 'Programs', 'programs'],
    ['/applications', 'Applications', 'applications'],
    ['/cohorts', 'Cohorts', 'cohorts'],
    ['/startups', 'Startups', 'startups'],
    ['/mentors', 'Mentors', 'mentors'],
    ['/challenges', 'Challenges', 'challenges']
  ],

  admin: [
    ['/dashboard', 'Dashboard', 'dashboard'],
    ['/users', 'Users & Access', 'users'],
    ['/startups', 'Startups', 'startups'],
    ['/projects', 'Projects', 'projects'],
    ['/programs', 'Programs', 'programs'],
    ['/applications', 'Applications', 'applications'],
    ['/deals', 'Deals', 'deals'],
    ['/challenges', 'Challenges', 'challenges'],
    ['/audit', 'Audit Logs', 'audit']
  ]
};

export default function Layout({ user, children, onUserChange }) {
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();

  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [notes, setNotes] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const role = user?.role || 'student';

  const loadNotes = () => {
    get('/notifications')
      .then(setNotes)
      .catch(() => {});
  };

  useEffect(() => {
    loadNotes();
    setMobileNavOpen(false);
    setUserMenuOpen(false);
  }, [loc.pathname]);

  const links = useMemo(
    () => menus[role] || menus.student,
    [role]
  );

  async function handleSearch(e) {
    e.preventDefault();

    if (!q.trim()) {
      return setResults(null);
    }

    try {
      const data = await get(
        '/search?q=' + encodeURIComponent(q.trim())
      );

      setResults(data);
    } catch {
      setResults(null);
    }
  }

  const unread = notes.filter(
    n => !n.is_read
  ).length;

  function logout() {
    localStorage.clear();

    toast.info('Logged out successfully');

    nav('/login', {
      replace: true
    });
  }

  return (
    <div
      className={`app-shell ${
        mobileNavOpen ? 'mobile-open' : ''
      }`}
    >

      {/* =========================
          SIDEBAR
          ========================= */}

      <aside
        className={`sidebar ${
          mobileNavOpen ? 'show' : ''
        }`}
      >

        {/* Brand */}

        <div
          className="brand"
          onClick={() => nav('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <div className="brand-icon">
            💡
          </div>

          <div>
            <strong>LaunchLoop</strong>

            <span>
              Startup & Innovation Hub
            </span>
          </div>
        </div>

        {/* Current Role */}

        <div className="role-chip">
          <span className="role-dot" />

          <span>
            {roleLabel(role)}
          </span>
        </div>

        {/* =========================
            ROLE-SPECIFIC NAVIGATION
            ========================= */}

        <nav>
          {links.map(
            ([path, label, key]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive ? 'active' : ''
                  }`
                }
              >
                <span className="nav-icon">
                  {icon[key] || '•'}
                </span>

                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}
        </nav>

        {/* Sidebar bottom links */}

        <div className="sidebar-bottom">

          <NavLink
            to="/messages"
            className="mini-link"
          >
            <span>▱</span>
            Messages
          </NavLink>

          <NavLink
            to="/notifications"
            className="mini-link"
          >
            <span>◉</span>
            Notifications

            {unread > 0 && (
              <b className="count">
                {unread}
              </b>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className="mini-link"
          >
            <span>◎</span>
            Profile
          </NavLink>

        </div>

        {/* Sidebar promo */}

        <div className="sidebar-promo">

          <div className="promo-icon">
            🚀
          </div>

          <b>
            Build. Collaborate.
            <br />
            Innovate.
          </b>

          <p>
            Deploy-ready university
            startup & innovation platform.
          </p>

        </div>

      </aside>

      {/* =========================
          MAIN AREA
          ========================= */}

      <main className="main-shell">

        {/* =========================
            TOPBAR
            ========================= */}

        <header className="topbar">

          {/* Mobile menu */}

          <button
            className="mobile-toggle"
            type="button"
            onClick={() =>
              setMobileNavOpen(!mobileNavOpen)
            }
            title="Toggle Menu"
          >
            ☰
          </button>

          {/* Global Search */}

          <form
            className="global-search"
            onSubmit={handleSearch}
          >
            <span>⌕</span>

            <input
              value={q}
              onChange={e =>
                setQ(e.target.value)
              }
              placeholder="Search ideas, projects, startups, mentors..."
            />

            {q && (
              <button
                type="button"
                style={{
                  border: 0,
                  background: 'none',
                  color: '#999',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setQ('');
                  setResults(null);
                }}
              >
                ×
              </button>
            )}

          </form>

          {/* Top actions */}

          <div className="top-actions">

            {/* Notifications */}

            <button
              className="icon-btn"
              type="button"
              onClick={() =>
                nav('/notifications')
              }
              title="Notifications"
            >
              ◉

              {unread > 0 && (
                <i>
                  {unread}
                </i>
              )}
            </button>

            {/* Messages */}

            <button
              className="icon-btn"
              type="button"
              onClick={() =>
                nav('/messages')
              }
              title="Messages"
            >
              ▱
            </button>

            {/* User menu */}

            <div className="user-dropdown-wrap">

              <button
                className="user-chip"
                type="button"
                onClick={() =>
                  setUserMenuOpen(!userMenuOpen)
                }
              >

                <span className="avatar">
                  {user?.name?.[0] || 'U'}
                </span>

                <span className="user-text">

                  <b>
                    {user?.name || 'User'}
                  </b>

                  <small>
                    {roleLabel(role)}
                  </small>

                </span>

                <em>
                  ⌄
                </em>

              </button>

              {/* User dropdown */}

              {userMenuOpen && (
                <div className="user-dropdown-menu">

                  <div className="dropdown-user-info">

                    <strong>
                      {user?.name}
                    </strong>

                    <span>
                      {user?.email}
                    </span>

                  </div>

                  <hr />

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      nav('/profile');
                    }}
                  >
                    <span>◎</span>
                    Profile & Settings
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      nav('/notifications');
                    }}
                  >
                    <span>◉</span>
                    Notifications

                    {unread > 0 &&
                      ` (${unread})`
                    }
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      nav('/messages');
                    }}
                  >
                    <span>▱</span>
                    Messages
                  </button>

                  <hr />

                  <button
                    className="dropdown-logout"
                    onClick={logout}
                  >
                    <span>⎋</span>
                    Sign Out
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* =========================
            GLOBAL SEARCH RESULTS
            ========================= */}

        {results && (
          <div className="search-panel">

            <div className="search-head">

              <b>
                Search Results for "{q}"
              </b>

              <button
                type="button"
                onClick={() =>
                  setResults(null)
                }
              >
                ×
              </button>

            </div>

            <div className="search-grid">

              {/* People */}

              <div>

                <small>
                  People
                </small>

                {results.users?.length ? (

                  results.users.map(u => (
                    <div
                      className="search-row clickable"
                      key={u.id}
                      onClick={() => {
                        setResults(null);
                        nav('/profile');
                      }}
                    >

                      <span className="tiny-avatar">
                        {u.name[0]}
                      </span>

                      <div>
                        <b>
                          {u.name}
                        </b>

                        <span>
                          {u.role}
                        </span>
                      </div>

                    </div>
                  ))

                ) : (

                  <p className="muted">
                    No matching users
                  </p>

                )}

              </div>

              {/* Startups */}

              <div>

                <small>
                  Startups
                </small>

                {results.startups?.length ? (

                  results.startups.map(s => (
                    <div
                      className="search-row clickable"
                      key={s.id}
                      onClick={() => {
                        setResults(null);
                        nav('/startups');
                      }}
                    >

                      <span className="tiny-avatar">
                        ◆
                      </span>

                      <div>

                        <b>
                          {s.name}
                        </b>

                        <span>
                          {s.industry} · {s.stage}
                        </span>

                      </div>

                    </div>
                  ))

                ) : (

                  <p className="muted">
                    No matching startups
                  </p>

                )}

              </div>

              {/* Projects & Ideas */}

              <div>

                <small>
                  Projects & Ideas
                </small>

                {results.projects?.length ||
                results.ideas?.length ? (

                  <>

                    {results.projects?.map(p => (
                      <div
                        className="search-row clickable"
                        key={`proj-${p.id}`}
                        onClick={() => {
                          setResults(null);
                          nav('/projects');
                        }}
                      >

                        <span className="tiny-avatar">
                          ▣
                        </span>

                        <div>

                          <b>
                            {p.name}
                          </b>

                          <span>
                            Project · {p.domain}
                          </span>

                        </div>

                      </div>
                    ))}

                    {results.ideas?.map(i => (
                      <div
                        className="search-row clickable"
                        key={`idea-${i.id}`}
                        onClick={() => {
                          setResults(null);
                          nav('/ideas');
                        }}
                      >

                        <span className="tiny-avatar">
                          ✦
                        </span>

                        <div>

                          <b>
                            {i.name}
                          </b>

                          <span>
                            Idea · {i.stage}
                          </span>

                        </div>

                      </div>
                    ))}

                  </>

                ) : (

                  <p className="muted">
                    No matching projects
                  </p>

                )}

              </div>

            </div>

          </div>
        )}

        {/* =========================
            PAGE CONTENT
            ========================= */}

        <div className="content-wrap">
          {children}
        </div>

      </main>

    </div>
  );
}
