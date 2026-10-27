import React, { useEffect, useState } from 'react';
import { get } from '../api';
import { Card, Pill, Toolbar, Empty, relative } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Audit() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  const loadLogs = () => {
    get('/audit')
      .then(setLogs)
      .catch(err => toast.error('Failed to load audit trail: ' + err.message));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.user_name?.toLowerCase().includes(term) ||
      l.entity_type?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page">
      <Toolbar
        eyebrow="SYSTEM ACCOUNTABILITY"
        title="Chronological Audit Logs"
        action={
          <Pill tone="soft">
            {logs.length} Recorded Events
          </Pill>
        }
      />

      <div className="filterbar">
        <div className="field" style={{ minWidth: '240px' }}>
          <span>Search Activity Trail</span>
          <input
            placeholder="Search action, user, or entity..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <div className="audit-list">
          {filtered.map(l => (
            <div className="audit-row" key={l.id}>
              <div className="audit-time">{relative(l.created_at)}</div>

              <div className="audit-avatar">
                {l.user_name?.[0] || 'S'}
              </div>

              <div>
                <b>{l.action}</b>
                <p>
                  By <strong>{l.user_name || 'System'}</strong> ({l.user_email || 'automated'}) · Entity: {l.entity_type || 'General'} {l.entity_id ? `#${l.entity_id}` : ''}
                </p>
                <small>{new Date(l.created_at).toLocaleString()}</small>
              </div>

              <Pill tone="success">Logged</Pill>
            </div>
          ))}

          {!filtered.length && (
            <Empty
              title="No audit logs found"
              text="Platform activity such as user logins, project creations, and deal updates will be logged here."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
