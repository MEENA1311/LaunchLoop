import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../api';
import { Card, Pill, SectionHead, Empty, relative, roleLabel } from '../components/UI';

const roleMeta = {
  student: {
    eyebrow: 'STUDENT INNOVATOR COCKPIT',
    title: 'Turn bold ideas into reality',
    sub: 'Explore problem statements, assemble a team, consult mentors, and build validated prototypes.',
    stats: [
      { key: 'ideas', label: 'Community Ideas', icon: '✦', path: '/ideas' },
      { key: 'projects', label: 'Active Projects', icon: '▣', path: '/projects' },
      { key: 'mentors', label: 'Verified Mentors', icon: '♙', path: '/mentors' },
      { key: 'challenges', label: 'Open Challenges', icon: '◇', path: '/challenges' }
    ],
    focus: [
      { title: 'Idea Lab', desc: 'Publish a problem statement or refine existing ideas.', path: '/ideas' },
      { title: 'Collaborative Projects', desc: 'Work with peers on Kanban boards and issue tracking.', path: '/projects' },
      { title: 'Mentor Network', desc: 'Connect with seasoned industry veterans for 1-on-1 guidance.', path: '/mentors' },
      { title: 'Innovation Challenges', desc: 'Solve sponsored challenges and win awards.', path: '/challenges' }
    ]
  },
  mentor: {
    eyebrow: 'MENTOR WORKSPACE',
    title: 'Empower student founders',
    sub: 'Review founder guidance requests, schedule advising sessions, and evaluate startup readiness.',
    stats: [
      { key: 'mentorships', label: 'Active Mentees', icon: '◍', path: '/requests' },
      { key: 'startups', label: 'Startups in Network', icon: '◆', path: '/startups' },
      { key: 'projects', label: 'Student Projects', icon: '▣', path: '/projects' },
      { key: 'challenges', label: 'Active Challenges', icon: '◇', path: '/challenges' }
    ],
    focus: [
      { title: 'Mentorship Requests', desc: 'Review and accept pending guidance requests from founders.', path: '/requests' },
      { title: 'Advisory Sessions', desc: 'Schedule check-ins and document action items.', path: '/sessions' },
      { title: 'Startup Evaluations', desc: 'Score founder readiness across 8 core product and business vectors.', path: '/evaluations' },
      { title: 'Startup Directory', desc: 'Discover high-potential university startups.', path: '/startups' }
    ]
  },
  startup: {
    eyebrow: 'FOUNDER CONTROL CENTER',
    title: 'Scale your venture',
    sub: 'Manage company metrics, apply for university incubation, and prepare for investor due diligence.',
    stats: [
      { key: 'projects', label: 'Internal Projects', icon: '▣', path: '/projects' },
      { key: 'applications', label: 'Cohort Applications', icon: '✓', path: '/incubators' },
      { key: 'deals', label: 'Investor Conversations', icon: '◫', path: '/deals' },
      { key: 'mentorships', label: 'Advisor Sessions', icon: '♙', path: '/mentors' }
    ],
    focus: [
      { title: 'Startup Profile & Metrics', desc: 'Keep traction, revenue, and funding requirements updated.', path: '/startups' },
      { title: 'Incubation Programs', desc: 'Apply to top cohorts and university innovation accelerators.', path: '/incubators' },
      { title: 'Fundraising & Deal Room', desc: 'Manage your pitch deck, cap table, and investor diligence folder.', path: '/fundraising' },
      { title: 'Founder Support', desc: 'Request legal, cloud credits, or technical infrastructure support.', path: '/support' }
    ]
  },
  investor: {
    eyebrow: 'INVESTOR DEAL ROOM',
    title: 'Back top university innovation',
    sub: 'Screen new venture opportunities, evaluate due diligence documents, and track portfolio returns.',
    stats: [
      { key: 'startups', label: 'Discoverable Startups', icon: '◆', path: '/startups' },
      { key: 'deals', label: 'Active Deals', icon: '◫', path: '/deals' },
      { key: 'applications', label: 'Incubated Ventures', icon: '✓', path: '/startups' },
      { key: 'users', label: 'Ecosystem Founders', icon: '♟', path: '/startups' }
    ],
    focus: [
      { title: 'Discover Startups', desc: 'Filter companies matching your sector thesis and check size.', path: '/startups' },
      { title: 'Deal Flow Pipeline', desc: 'Move deals from Screening to Term Sheet and Investment.', path: '/deals' },
      { title: 'Due Diligence Room', desc: 'Review financial summaries, legal incorporation, and product tech.', path: '/due-diligence' },
      { title: 'Portfolio Management', desc: 'Track ownership percentages, runway, and revenue growth.', path: '/portfolio' }
    ]
  },
  incubator: {
    eyebrow: 'INCUBATOR OPERATIONS',
    title: 'Accelerate the next cohort',
    sub: 'Launch founder programs, screen incoming applications, and track startup milestones.',
    stats: [
      { key: 'applications', label: 'Cohort Applications', icon: '✓', path: '/applications' },
      { key: 'startups', label: 'Incubated Startups', icon: '◆', path: '/startups' },
      { key: 'mentors', label: 'Program Mentors', icon: '♙', path: '/mentors' },
      { key: 'challenges', label: 'Campus Challenges', icon: '◇', path: '/challenges' }
    ],
    focus: [
      { title: 'Incubation Programs', desc: 'Create and launch cohorts with customized eligibility rules.', path: '/programs' },
      { title: 'Application Review', desc: 'Screen, shortlist, and interview applicants through structured stages.', path: '/applications' },
      { title: 'Cohort Management', desc: 'Track startup milestones and founder-mentor pairings.', path: '/cohorts' },
      { title: 'Innovation Challenges', desc: 'Post problem statements for student solvers.', path: '/challenges' }
    ]
  },
  admin: {
    eyebrow: 'ADMINISTRATION & COMPLIANCE',
    title: 'Ecosystem health & governance',
    sub: 'Manage user access, verify founder credentials, monitor deal flow, and audit system events.',
    stats: [
      { key: 'users', label: 'Total Users', icon: '♟', path: '/users' },
      { key: 'startups', label: 'Registered Startups', icon: '◆', path: '/startups' },
      { key: 'deals', label: 'Deals in Motion', icon: '◫', path: '/deals' },
      { key: 'projects', label: 'Projects Built', icon: '▣', path: '/projects' }
    ],
    focus: [
      { title: 'User Verification', desc: 'Review and approve university founder and mentor identities.', path: '/users' },
      { title: 'Program & Deal Oversight', desc: 'Audit incubation applications and investor negotiations.', path: '/deals' },
      { title: 'Audit Trail', desc: 'Inspect chronological database audit logs for all critical actions.', path: '/audit' },
      { title: 'Ecosystem Directory', desc: 'Manage all platform entities and relational associations.', path: '/startups' }
    ]
  }
};

export default function Dashboard() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'student';
  const meta = roleMeta[role] || roleMeta.student;

  const [counts, setCounts] = useState({});
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get('/dashboard').then(setCounts).catch(() => {}),
      get('/notifications').then(setNotes).catch(() => {})
    ]).finally(() => setLoading(false));
  }, [role]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="eyebrow">{meta.eyebrow}</span>
          <h1>Welcome, {user.name ? user.name.split(' ')[0] : 'Innovator'}! 👋</h1>
          <p>{meta.sub}</p>
        </div>
      </div>

      {/* Ecosystem Lifecycle Roadmap Banner */}
      <div className="hero-banner">
        <div>
          <Pill>ECOSYSTEM ROADMAP</Pill>
          <h2>Idea <span>→</span> Project <span>→</span> Mentorship <span>→</span> Incubation <span>→</span> Investment <span>→</span> Scale</h2>
          <p>Seamlessly move from early student idea to a fully funded venture in one connected platform.</p>
        </div>
        <div className="hero-visual">
          <div className="mountain m1" />
          <div className="mountain m2" />
          <div className="sun" />
          <div className="person-figure">
            ●<br />
            <span>╱│╲</span><br />
            <span>╱ ╲</span>
          </div>
        </div>
      </div>

      {/* Live Workspace Signals (Dynamic Stats from DB) */}
      <div className="stat-grid">
        {meta.stats.map((s, i) => (
          <Card
            key={s.label}
            className="stat-card clickable"
            onClick={() => nav(s.path)}
          >
            <div className={`stat-icon s${i % 4}`}>
              {s.icon}
            </div>
            <div>
              <span>{s.label}</span>
              <strong>{counts[s.key] !== undefined ? counts[s.key] : (loading ? '...' : 0)}</strong>
              <small>live database record</small>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Core Role Cockpit Workflows */}
        <Card>
          <SectionHead
            eyebrow="YOUR WORKSPACE"
            title="What matters now"
          />
          <div className="focus-list">
            {meta.focus.map((item, i) => (
              <button
                key={item.title}
                type="button"
                className="focus-row focus-button"
                onClick={() => nav(item.path)}
              >
                <div className="num">0{i + 1}</div>
                <div>
                  <b>{item.title}</b>
                  <span>{item.desc}</span>
                </div>
                <span className="arrow">→</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Live Ecosystem Signals (Recent Activity / Notifications) */}
        <Card>
          <SectionHead
            eyebrow="LIVE ECOSYSTEM SIGNALS"
            title="Recent platform activity"
            action={
              <button
                type="button"
                className="text-btn"
                onClick={() => nav('/notifications')}
              >
                View all ({notes.length})
              </button>
            }
          />
          <div className="activity-list">
            {notes.slice(0, 5).map((n, i) => (
              <div
                className="activity clickable"
                key={n.id || i}
                onClick={() => nav('/notifications')}
              >
                <span className={`activity-dot d${i % 5}`} />
                <div>
                  <b>{n.title}</b>
                  <p>{n.message}</p>
                  <small>{relative(n.created_at)}</small>
                </div>
              </div>
            ))}
            {!notes.length && (
              <Empty
                title="No recent notifications"
                text="As you collaborate and move projects forward, updates will appear here."
              />
            )}
          </div>
        </Card>
      </div>

      {/* Lower Dashboard Grid */}
      <div className="dashboard-grid lower" style={{ marginTop: '16px' }}>
        <Card>
          <SectionHead
            eyebrow="QUICK WORKFLOW SHORTCUTS"
            title="Jump straight into action"
          />
          <div className="recommendations">
            {meta.focus.slice(0, 3).map(item => (
              <div className="recommend" key={item.title}>
                <div className="recommend-avatar">{item.title[0]}</div>
                <div>
                  <b>{item.title}</b>
                  <span>{roleLabel(role)}</span>
                  <p>{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => nav(item.path)}
                  title="Open"
                >
                  →
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="quote-card">
          <div className="quote-mark">“</div>
          <h3>From Student Project to Seed-Funded Company.</h3>
          <p>
            LaunchLoop unifies relational DBMS workflows, role-based governance, and real-time collaboration into one complete ecosystem.
          </p>
          <Pill>DEPLOY READY · 2026</Pill>
        </Card>
      </div>
    </div>
  );
}
