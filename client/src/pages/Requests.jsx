import React, { useEffect, useState } from 'react';
import { get, patch } from '../api';
import { Card, Btn, Pill, Toolbar, Empty, relative } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Requests() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isMentor = currentUser.role === 'mentor';

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [detailItem, setDetailItem] = useState(null);

  const loadRequests = () => {
    get('/mentorship-requests')
      .then(setRequests)
      .catch(err => toast.error('Failed to load requests: ' + err.message));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleStatus(id, status) {
    try {
      await patch(`/mentorship-requests/${id}`, { status });
      toast.success(`Mentorship request marked as ${status}!`);
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  }

  const filtered = requests.filter(r => {
    if (filter === 'All') return true;
    return r.status === filter;
  });

  return (
    <div className="page">
      <Toolbar
        eyebrow="ADVISORY PIPELINE"
        title={isMentor ? 'Incoming Mentorship Requests' : 'My Mentorship Requests'}
      />

      <div className="filterbar">
        <div className="field">
          <span>Filter Status</span>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="All">All Requests</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="workflow-table">
          {filtered.map(req => (
            <div className="workflow-table-row" key={req.id}>
              <div>
                <b>{isMentor ? req.requester_name : req.mentor_name}</b>
                <span>
                  {req.startup_name ? `Startup: ${req.startup_name} · ` : 'General Mentorship · '}
                  Goal: {req.goal}
                </span>
              </div>

              <div>
                <Pill tone={req.status === 'Accepted' ? 'success' : (req.status === 'Rejected' ? 'danger' : 'warning')}>
                  {req.status}
                </Pill>
              </div>

              <small>{relative(req.created_at)}</small>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setDetailItem(req)}
                >
                  View
                </button>

                {isMentor && req.status === 'Pending' && (
                  <>
                    <Btn
                      variant="soft"
                      style={{ padding: '6px 10px', fontSize: '10px' }}
                      onClick={() => handleStatus(req.id, 'Accepted')}
                    >
                      Accept ✓
                    </Btn>
                    <Btn
                      variant="outline"
                      style={{ padding: '6px 10px', fontSize: '10px', color: '#e45454', borderColor: '#f2cccc' }}
                      onClick={() => handleStatus(req.id, 'Rejected')}
                    >
                      Decline
                    </Btn>
                  </>
                )}
              </div>
            </div>
          ))}

          {!filtered.length && (
            <Empty
              title="No mentorship requests found"
              text={isMentor ? "You do not have any mentorship requests in this view." : "You haven't submitted any mentorship requests yet."}
            />
          )}
        </div>
      </Card>

      {/* Details Modal */}
      {detailItem && (
        <Modal
          eyebrow="MENTORSHIP REQUEST"
          title={`Request from ${detailItem.requester_name || detailItem.mentor_name}`}
          close={() => setDetailItem(null)}
        >
          <div style={{ display: 'grid', gap: '12px', padding: '10px 0' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill tone={detailItem.status === 'Accepted' ? 'success' : ''}>{detailItem.status}</Pill>
              <small className="muted">{new Date(detailItem.created_at).toLocaleString()}</small>
            </div>

            <div>
              <small className="muted">Goal & Discussion Topics</small>
              <p style={{ margin: '4px 0', fontSize: '12px', lineHeight: 1.6 }}>{detailItem.goal}</p>
            </div>

            {detailItem.startup_name && (
              <div>
                <small className="muted">Associated Startup</small>
                <b style={{ display: 'block', fontSize: '12px' }}>{detailItem.startup_name}</b>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setDetailItem(null)}>Close</Btn>
              {isMentor && detailItem.status === 'Pending' && (
                <Btn onClick={() => { handleStatus(detailItem.id, 'Accepted'); setDetailItem(null); }}>
                  Accept Mentorship →
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
