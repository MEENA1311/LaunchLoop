import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { get, post, patch } from '../api';
import { Card, Btn, Pill, Toolbar, Select, Input, Textarea, Empty, relative, formatCurrency } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Applications() {
  const loc = useLocation();
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isIncubatorOrAdmin = currentUser.role === 'incubator' || currentUser.role === 'admin';

  const [applications, setApplications] = useState([]);
  const [startups, setStartups] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [submitOpen, setSubmitOpen] = useState(false);
  const [viewApp, setViewApp] = useState(null);

  // Application Form
  const [form, setForm] = useState({
    startup_id: '',
    program_id: loc.state?.preselectProgramId || '',
    problem: 'Small teams lose time coordinating fragmented work.',
    solution: 'Unified startup workflow and collaboration engine.',
    market: 'Early-stage student founders and collegiate startup ecosystems.',
    team: '2 co-founders (B.E. Computer Science, Product & Engineering).',
    business_model: 'B2B subscription tiers with institutional licensing.',
    traction: '120 active users across 12 pilot teams.',
    funding_requirement: 1200000,
    pitch_deck: '/uploads/neonlabs-pitch.pdf'
  });

  const loadData = () => {
    get('/applications').then(setApplications).catch(() => {});
    get('/startups').then(data => {
      setStartups(data);
      if (data.length && !form.startup_id) {
        setForm(f => ({ ...f, startup_id: data[0].id }));
      }
    }).catch(() => {});
    get('/programs').then(data => {
      setPrograms(data);
      if (data.length && !form.program_id) {
        setForm(f => ({ ...f, program_id: loc.state?.preselectProgramId || data[0].id }));
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadData();
    if (loc.state?.preselectProgramId) {
      setSubmitOpen(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await post('/applications', form);
      toast.success('Incubation application submitted successfully!');
      setSubmitOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit application');
    }
  }

  async function updateStatus(id, status) {
    try {
      await patch(`/applications/${id}`, { status });
      toast.success(`Application updated to "${status}"`);
      if (viewApp && viewApp.id === id) {
        setViewApp({ ...viewApp, status });
      }
      loadData();
    } catch (err) {
      toast.error('Failed to update application status');
    }
  }

  const stages = ['Submitted', 'Screening', 'Shortlisted', 'Interview', 'Accepted', 'Rejected'];

  const filtered = applications.filter(a => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="page">
      <Toolbar
        eyebrow="COHORT SELECTION"
        title="Incubation Application Pipeline"
        action={
          <Btn onClick={() => setSubmitOpen(true)}>
            ＋ Submit Application
          </Btn>
        }
      />

      <div className="filterbar">
        <div className="field">
          <span>Filter Pipeline Status</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Pipeline Stages ({applications.length})</option>
            {stages.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <div className="workflow-table">
          {filtered.map(app => (
            <div className="workflow-table-row" key={app.id}>
              <div>
                <b>{app.startup_name}</b>
                <span>
                  Program: {app.program_name} · Incubator: {app.incubator_name} · Ask: {formatCurrency(app.funding_requirement)}
                </span>
              </div>

              <div>
                <Pill tone={app.status === 'Accepted' ? 'success' : (app.status === 'Rejected' ? 'danger' : 'warning')}>
                  {app.status}
                </Pill>
              </div>

              <small>{relative(app.applied_at)}</small>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setViewApp(app)}
                >
                  Review Application →
                </button>

                {isIncubatorOrAdmin && (
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                    style={{ fontSize: '9px', padding: '4px', maxWidth: '110px' }}
                  >
                    {stages.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}

          {!filtered.length && (
            <Empty
              title="No incubation applications in this view"
              text="Submit an application to an open program to start the cohort screening process."
              action={<Btn onClick={() => setSubmitOpen(true)}>Submit Application</Btn>}
            />
          )}
        </div>
      </Card>

      {/* Review Full Application Modal */}
      {viewApp && (
        <Modal
          eyebrow="APPLICATION DOSSIER"
          title={`${viewApp.startup_name} · ${viewApp.program_name}`}
          close={() => setViewApp(null)}
          maxWidth={660}
        >
          <div style={{ display: 'grid', gap: '14px', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Pill tone={viewApp.status === 'Accepted' ? 'success' : ''}>{viewApp.status}</Pill>
                <small className="muted">Applied {new Date(viewApp.applied_at).toLocaleDateString()}</small>
              </div>

              {isIncubatorOrAdmin && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Btn
                    variant="soft"
                    style={{ padding: '6px 10px', fontSize: '10px' }}
                    onClick={() => updateStatus(viewApp.id, 'Interview')}
                  >
                    Invite to Interview
                  </Btn>
                  <Btn
                    style={{ padding: '6px 10px', fontSize: '10px', background: '#19a875' }}
                    onClick={() => updateStatus(viewApp.id, 'Accepted')}
                  >
                    Accept Cohort ✓
                  </Btn>
                </div>
              )}
            </div>

            <div style={{ background: '#f8f9fc', border: '1px solid #e2e8f1', padding: '14px', borderRadius: '10px', display: 'grid', gap: '12px' }}>
              <div>
                <small className="muted">Problem Addressed</small>
                <p style={{ margin: '3px 0', fontSize: '11px', lineHeight: 1.5 }}>{viewApp.problem}</p>
              </div>

              <div>
                <small className="muted">Proposed Solution</small>
                <p style={{ margin: '3px 0', fontSize: '11px', lineHeight: 1.5 }}>{viewApp.solution}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <small className="muted">Target Market</small>
                  <b style={{ fontSize: '11px', display: 'block' }}>{viewApp.market || 'General'}</b>
                </div>
                <div>
                  <small className="muted">Business Model</small>
                  <b style={{ fontSize: '11px', display: 'block' }}>{viewApp.business_model || 'Subscription'}</b>
                </div>
                <div>
                  <small className="muted">Traction</small>
                  <b style={{ fontSize: '11px', display: 'block' }}>{viewApp.traction || 'Pilot stage'}</b>
                </div>
                <div>
                  <small className="muted">Capital Ask</small>
                  <b style={{ fontSize: '11px', color: '#2d7ff9', display: 'block' }}>{formatCurrency(viewApp.funding_requirement)}</b>
                </div>
              </div>

              <div>
                <small className="muted">Founding Team</small>
                <p style={{ margin: '3px 0', fontSize: '11px' }}>{viewApp.team || 'Founding team members'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Btn variant="outline" onClick={() => setViewApp(null)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Submit Application Modal */}
      {submitOpen && (
        <Modal
          eyebrow="APPLICATION FORM"
          title="Apply for Incubation Program"
          close={() => setSubmitOpen(false)}
          maxWidth={660}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <Select
                label="Applying Startup"
                required
                value={form.startup_id}
                onChange={e => setForm({ ...form, startup_id: Number(e.target.value) })}
              >
                {startups.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.stage} · {s.industry})</option>
                ))}
              </Select>

              <Select
                label="Incubation Program"
                required
                value={form.program_id}
                onChange={e => setForm({ ...form, program_id: Number(e.target.value) })}
              >
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.incubator_name})</option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Problem Statement"
              required
              rows={2}
              value={form.problem}
              onChange={e => setForm({ ...form, problem: e.target.value })}
            />

            <Textarea
              label="Solution"
              required
              rows={2}
              value={form.solution}
              onChange={e => setForm({ ...form, solution: e.target.value })}
            />

            <div className="form-row">
              <Input
                label="Target Market Size / Audience"
                value={form.market}
                onChange={e => setForm({ ...form, market: e.target.value })}
              />
              <Input
                label="Business Model"
                value={form.business_model}
                onChange={e => setForm({ ...form, business_model: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Input
                label="Current Traction"
                value={form.traction}
                onChange={e => setForm({ ...form, traction: e.target.value })}
              />
              <Input
                label="Funding Requirement (₹)"
                type="number"
                value={form.funding_requirement}
                onChange={e => setForm({ ...form, funding_requirement: e.target.value })}
              />
            </div>

            <Textarea
              label="Founding Team Background"
              rows={2}
              value={form.team}
              onChange={e => setForm({ ...form, team: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Btn>
              <Btn type="submit">Submit Incubation Application →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
