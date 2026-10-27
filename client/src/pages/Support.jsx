import React, { useEffect, useState } from 'react';
import { get, post, patch } from '../api';
import { Card, Btn, Pill, Toolbar, Select, Textarea, Empty } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Support() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    category: 'Cloud Credits',
    description: 'Request AWS/Google Cloud development credits for student MVP hosting.'
  });

  const loadRequests = () => {
    get('/support-requests').then(setRequests).catch(() => {});
  };

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await post('/support-requests', form);
      toast.success('Support request submitted to incubation staff!');
      setCreateOpen(false);
      loadRequests();
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  }

  async function updateStatus(id, status) {
    try {
      await patch(`/support-requests/${id}`, { status });
      toast.success(`Request marked as ${status}`);
      loadRequests();
    } catch (err) {
      toast.error('Failed to update status');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="ECOSYSTEM ASSISTANCE"
        title="Founder Support Requests"
        action={
          <Btn onClick={() => setCreateOpen(true)}>
            ＋ New Support Request
          </Btn>
        }
      />

      <Card>
        <div className="workflow-table">
          {requests.map(req => (
            <div className="workflow-table-row" key={req.id}>
              <div>
                <b>{req.category} Assistance</b>
                <span>
                  {req.startup_name ? `${req.startup_name} · ` : ''}{req.description}
                </span>
              </div>

              <div>
                <Pill tone={req.status === 'Completed' ? 'success' : (req.status === 'In Progress' ? 'warning' : '')}>
                  {req.status}
                </Pill>
              </div>

              <select
                value={req.status}
                onChange={e => updateStatus(req.id, e.target.value)}
                style={{ fontSize: '9px', padding: '4px' }}
              >
                <option value="Requested">Requested</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => toast.info('Support ticket is being tracked.')}
                >
                  Ticket #{req.id}
                </button>
              </div>
            </div>
          ))}

          {!requests.length && (
            <Empty
              title="No support requests found"
              text="Request legal templates, cloud infrastructure credits, or technical reviews."
              action={<Btn onClick={() => setCreateOpen(true)}>Submit Support Request</Btn>}
            />
          )}
        </div>
      </Card>

      {/* New Request Modal */}
      {createOpen && (
        <Modal
          eyebrow="SUPPORT TICKET"
          title="Submit Founder Support Request"
          close={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <Select
              label="Support Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              <option value="Cloud Credits">Cloud Infrastructure & Credits (AWS/GCP)</option>
              <option value="Legal & Incorporation">Legal & Company Incorporation Review</option>
              <option value="Investor Intro">Warm Investor / Angel Introduction</option>
              <option value="Technical Advisory">Architecture & Technical Advisory</option>
              <option value="Marketing & Design">UI/UX & Go-to-Market Support</option>
            </Select>

            <Textarea
              label="Describe Your Requirement"
              required
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Provide specific context on what help your startup needs..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn type="submit">Submit Request →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
