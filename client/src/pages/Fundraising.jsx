import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../api';
import { Card, Btn, Pill, Toolbar, SectionHead, formatCurrency } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Fundraising() {
  const nav = useNavigate();
  const toast = useToast();

  const [startups, setStartups] = useState([]);
  const [deals, setDeals] = useState([]);

  // Persisted checklist state
  const defaultChecklist = [
    'Traction & user engagement metrics updated',
    'Pitch deck uploaded to deal room',
    'Historical revenue & financial model prepared',
    'Founder cap table & shareholding documented',
    'Target angel and VC investor pipeline curated',
    'Due diligence compliance folder populated'
  ];

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('fundraising_checklist');
      return saved ? JSON.parse(saved) : defaultChecklist.slice(0, 3);
    } catch {
      return defaultChecklist.slice(0, 3);
    }
  });

  useEffect(() => {
    get('/startups').then(setStartups).catch(() => {});
    get('/deals').then(setDeals).catch(() => {});
  }, []);

  function toggleItem(item) {
    const updated = checklist.includes(item)
      ? checklist.filter(x => x !== item)
      : [...checklist, item];
    setChecklist(updated);
    localStorage.setItem('fundraising_checklist', JSON.stringify(updated));
    toast.success(checklist.includes(item) ? `Marked "${item}" as next step` : `Completed "${item}"!`);
  }

  const primaryStartup = startups[0] || { name: 'NeonLabs', funding_requirement: 1200000, stage: 'Traction' };
  const percentComplete = Math.round((checklist.length / defaultChecklist.length) * 100);

  return (
    <div className="page">
      <Toolbar
        eyebrow="CAPITAL RAISING"
        title="Seed Round Fundraising Workspace"
        action={
          <Btn onClick={() => nav('/due-diligence')}>
            Open Due Diligence Room →
          </Btn>
        }
      />

      <div className="fund-grid">
        {/* Left: Interactive Readiness Checklist */}
        <Card className="fund-main">
          <SectionHead
            eyebrow="ROUND READINESS CRITERIA"
            title={`Investor Due Diligence Readiness (${percentComplete}%)`}
            action={<Pill tone={percentComplete >= 80 ? 'success' : 'warning'}>{percentComplete}% Ready</Pill>}
          />

          <div className="checklist">
            {defaultChecklist.map(item => {
              const isDone = checklist.includes(item);
              return (
                <div key={item} className="clickable" onClick={() => toggleItem(item)}>
                  <span className={isDone ? 'checked' : ''}>
                    {isDone ? '✓' : '○'}
                  </span>
                  <div>
                    <b>{item}</b>
                    <small>{isDone ? 'Verified & Completed' : 'Pending action'}</small>
                  </div>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={e => { e.stopPropagation(); toggleItem(item); }}
                  >
                    {isDone ? 'Mark Incomplete' : 'Complete ✓'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: Round Financials & Metrics */}
        <Card>
          <SectionHead
            eyebrow={primaryStartup.name.toUpperCase()}
            title="Round Snapshot"
          />

          <div className="big-number">
            {formatCurrency(primaryStartup.funding_requirement || 1200000)}
          </div>
          <p className="muted" style={{ padding: '0 20px', margin: '4px 0' }}>
            Target Seed Allocation Ask
          </p>

          <div className="progress big">
            <span style={{ width: `${Math.min(100, Math.max(25, percentComplete))}%` }} />
          </div>

          <div className="metric-grid">
            <div>
              <span>Active Investor Leads</span>
              <b>{deals.length || 2} Conversations</b>
            </div>
            <div>
              <span>Current Runway</span>
              <b>9 Months</b>
            </div>
            <div>
              <span>Round Stage</span>
              <b>{primaryStartup.stage || 'Seed'}</b>
            </div>
            <div>
              <span>Commitments</span>
              <b>Term Sheet In Review</b>
            </div>
          </div>

          <div style={{ padding: '0 20px 20px' }}>
            <Btn
              variant="outline"
              style={{ width: '100%' }}
              onClick={() => nav('/deals')}
            >
              View Active Deal Pipeline ({deals.length}) →
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
