import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Textarea, Select, Empty } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Programs() {
  const nav = useNavigate();
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canCreate = currentUser.role === 'incubator' || currentUser.role === 'admin';

  const [programs, setPrograms] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewProgram, setViewProgram] = useState(null);

  // Form
  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_months: 3,
    eligibility: 'Student founders with validated prototype or MVP',
    focus_areas: 'Product, Go-to-market, Seed Fundraising',
    cohort_size: 20,
    deadline: '2026-12-15'
  });

  const loadPrograms = () => {
    get('/programs')
      .then(setPrograms)
      .catch(err => toast.error('Failed to load programs: ' + err.message));
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await post('/programs', form);
      toast.success('Incubation program launched!');
      setCreateOpen(false);
      setForm({
        name: '',
        description: '',
        duration_months: 3,
        eligibility: '',
        focus_areas: '',
        cohort_size: 20,
        deadline: '2026-12-15'
      });
      loadPrograms();
    } catch (err) {
      toast.error(err.message || 'Failed to create program');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="ACCELERATION & INCUBATION"
        title="Incubation Programs & Cohorts"
        action={
          canCreate ? (
            <Btn onClick={() => setCreateOpen(true)}>
              ＋ Launch New Program
            </Btn>
          ) : (
            <Btn onClick={() => nav('/applications')}>
              View My Applications
            </Btn>
          )
        }
      />

      <div className="program-grid">
        {programs.map(p => (
          <Card key={p.id} className="program-card">
            <div className="program-head">
              <div className="program-icon">◈</div>
              <Pill tone="success">{p.status}</Pill>
            </div>

            <h3>{p.name}</h3>
            <p>{p.description || 'Full-stack acceleration program offering mentor pairing and investor access.'}</p>

            <div className="focus-tags">
              <span>FOCUS AREAS</span>
              <b>{p.focus_areas || 'General Innovation'}</b>
            </div>

            <div className="program-stats">
              <div>
                <small>INCUBATOR</small>
                <b>{p.incubator_name}</b>
              </div>
              <div>
                <small>DURATION</small>
                <b>{p.duration_months} months</b>
              </div>
              <div>
                <small>COHORT SIZE</small>
                <b>{p.cohort_size} seats</b>
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
              <Btn
                variant="outline"
                style={{ flex: 1 }}
                onClick={() => setViewProgram(p)}
              >
                Program Details
              </Btn>
              <Btn
                style={{ flex: 1 }}
                onClick={() => nav('/applications', { state: { preselectProgramId: p.id } })}
              >
                Apply Now →
              </Btn>
            </div>
          </Card>
        ))}

        {!programs.length && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty
              title="No incubation programs open"
              text="Incubators and campus innovation centers will post upcoming cohort opportunities here."
            />
          </div>
        )}
      </div>

      {/* Program Details Modal */}
      {viewProgram && (
        <Modal
          eyebrow="PROGRAM SPECIFICATIONS"
          title={viewProgram.name}
          close={() => setViewProgram(null)}
          maxWidth={620}
        >
          <div style={{ display: 'grid', gap: '14px', padding: '10px 0' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Pill tone="success">{viewProgram.status}</Pill>
              <Pill>{viewProgram.duration_months} Months</Pill>
              <Pill>{viewProgram.cohort_size} Teams</Pill>
            </div>

            <div>
              <small className="muted">Organized by</small>
              <b style={{ display: 'block', fontSize: '13px' }}>{viewProgram.incubator_name}</b>
              <p style={{ margin: '6px 0', fontSize: '11px', lineHeight: 1.6 }}>{viewProgram.description}</p>
            </div>

            <div style={{ background: '#f8f9fc', border: '1px solid #e2e8f1', padding: '12px', borderRadius: '8px' }}>
              <small className="muted" style={{ display: 'block' }}>Eligibility Criteria</small>
              <b style={{ fontSize: '11px', display: 'block', margin: '4px 0 10px' }}>{viewProgram.eligibility || 'Open to validated student startups'}</b>

              <small className="muted" style={{ display: 'block' }}>Key Focus Domains</small>
              <b style={{ fontSize: '11px' }}>{viewProgram.focus_areas}</b>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <small className="muted">
                Deadline: {new Date(viewProgram.deadline).toLocaleDateString()}
              </small>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="outline" onClick={() => setViewProgram(null)}>Close</Btn>
                <Btn onClick={() => {
                  setViewProgram(null);
                  nav('/applications', { state: { preselectProgramId: viewProgram.id } });
                }}>
                  Apply for this Cohort →
                </Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Program Modal */}
      {createOpen && (
        <Modal
          eyebrow="INCUBATOR WORKFLOW"
          title="Create Incubation Program"
          close={() => setCreateOpen(false)}
          maxWidth={620}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <Input
              label="Program Name"
              required
              placeholder="e.g. Winter Acceleration Cohort 2026"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <Textarea
              label="Program Description"
              required
              rows={3}
              placeholder="Overview of curriculum, mentor access, and investor demo day"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <div className="form-row">
              <Input
                label="Duration (Months)"
                type="number"
                min="1"
                max="24"
                value={form.duration_months}
                onChange={e => setForm({ ...form, duration_months: Number(e.target.value) })}
              />
              <Input
                label="Cohort Size (Teams)"
                type="number"
                min="1"
                value={form.cohort_size}
                onChange={e => setForm({ ...form, cohort_size: Number(e.target.value) })}
              />
            </div>

            <Input
              label="Eligibility Requirements"
              placeholder="e.g. Student founders with validated MVP"
              value={form.eligibility}
              onChange={e => setForm({ ...form, eligibility: e.target.value })}
            />

            <Input
              label="Focus Areas / Sectors"
              placeholder="e.g. DeepTech, EdTech, SaaS"
              value={form.focus_areas}
              onChange={e => setForm({ ...form, focus_areas: e.target.value })}
            />

            <Input
              label="Application Deadline"
              type="date"
              value={form.deadline}
              onChange={e => setForm({ ...form, deadline: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn type="submit">Launch Program →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
