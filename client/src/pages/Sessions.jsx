import React, { useEffect, useState } from 'react';
import { get, post, patch } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Textarea, Empty, relative } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Sessions() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [sessions, setSessions] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSession, setEditSession] = useState(null);

  // Form
  const [form, setForm] = useState({
    topic: 'Product & Go-to-market review',
    scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    notes: 'Review user feedback and define traction milestones.'
  });

  const loadSessions = () => {
    get('/sessions')
      .then(setSessions)
      .catch(() => {});
  };

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await post('/sessions', form);
      toast.success('Mentorship session scheduled!');
      setCreateOpen(false);
      loadSessions();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule session');
    }
  }

  async function updateStatus(id, status, notes = null) {
    try {
      await patch(`/sessions/${id}`, { status, ...(notes !== null ? { notes } : {}) });
      toast.success(`Session marked as ${status}`);
      setEditSession(null);
      loadSessions();
    } catch (err) {
      toast.error('Failed to update session');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="ADVISORY CALENDAR"
        title="Mentorship Sessions"
        action={
          <Btn onClick={() => setCreateOpen(true)}>
            ＋ Schedule Session
          </Btn>
        }
      />

      <Card>
        <div className="workflow-table">
          {sessions.map(s => (
            <div className="workflow-table-row" key={s.id}>
              <div>
                <b>{s.topic}</b>
                <span>
                  With {currentUser.role === 'mentor' ? s.mentee_name : s.mentor_name} ·{' '}
                  {s.notes || 'No agenda notes attached.'}
                </span>
              </div>

              <div>
                <Pill tone={s.status === 'Completed' ? 'success' : (s.status === 'Scheduled' ? 'warning' : '')}>
                  {s.status}
                </Pill>
              </div>

              <small>
                {new Date(s.scheduled_at).toLocaleDateString()} at{' '}
                {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setEditSession(s)}
                >
                  Manage Notes
                </button>
                {s.status === 'Scheduled' && (
                  <Btn
                    variant="soft"
                    style={{ padding: '6px 10px', fontSize: '9px' }}
                    onClick={() => updateStatus(s.id, 'Completed')}
                  >
                    Complete ✓
                  </Btn>
                )}
              </div>
            </div>
          ))}

          {!sessions.length && (
            <Empty
              title="No mentorship sessions scheduled"
              text="Schedule a discussion session with your mentor or mentee to track progress."
              action={<Btn onClick={() => setCreateOpen(true)}>Schedule First Session</Btn>}
            />
          )}
        </div>
      </Card>

      {/* Schedule Session Modal */}
      {createOpen && (
        <Modal
          eyebrow="SESSION PLANNER"
          title="Schedule Mentorship Session"
          close={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <Input
              label="Session Topic"
              required
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
            />

            <Input
              label="Date & Time"
              type="datetime-local"
              required
              value={form.scheduled_at}
              onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
            />

            <Textarea
              label="Discussion Agenda / Notes"
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn type="submit">Confirm & Schedule</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Notes Modal */}
      {editSession && (
        <Modal
          eyebrow="SESSION REVIEW"
          title={`Notes: ${editSession.topic}`}
          close={() => setEditSession(null)}
        >
          <div style={{ display: 'grid', gap: '12px', padding: '10px 0' }}>
            <p className="muted" style={{ margin: 0 }}>
              Session scheduled for {new Date(editSession.scheduled_at).toLocaleString()}.
            </p>

            <Textarea
              label="Session Action Items & Summary"
              rows={4}
              value={editSession.notes || ''}
              onChange={e => setEditSession({ ...editSession, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <Btn
                variant="soft"
                onClick={() => updateStatus(editSession.id, 'Completed', editSession.notes)}
              >
                Mark as Completed ✓
              </Btn>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="outline" onClick={() => setEditSession(null)}>Close</Btn>
                <Btn onClick={() => updateStatus(editSession.id, editSession.status, editSession.notes)}>
                  Save Notes
                </Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
