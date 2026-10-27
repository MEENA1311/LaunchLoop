import React, { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Select, Empty } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Cohorts() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canCreate = currentUser.role === 'incubator' || currentUser.role === 'admin';

  const [cohorts, setCohorts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    program_id: 1,
    name: 'Cohort 2026-B',
    start_date: '2026-12-01',
    end_date: '2027-02-28'
  });

  const loadData = () => {
    get('/cohorts').then(setCohorts).catch(() => {});
    get('/programs').then(setPrograms).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await post('/cohorts', form);
      toast.success('Incubation cohort created!');
      setCreateOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create cohort');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="INCUBATOR TIMELINES"
        title="Cohort Operations"
        action={
          canCreate && (
            <Btn onClick={() => setCreateOpen(true)}>
              ＋ Create Cohort
            </Btn>
          )
        }
      />

      <Card>
        <div className="workflow-table">
          {cohorts.map(c => (
            <div className="workflow-table-row" key={c.id}>
              <div>
                <b>{c.name}</b>
                <span>
                  Program: {c.program_name} · Timeline: {new Date(c.start_date).toLocaleDateString()} to {new Date(c.end_date).toLocaleDateString()}
                </span>
              </div>

              <div>
                <Pill tone="success">Active Cohort</Pill>
              </div>

              <small>12 Startups Enrolled</small>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => toast.info(`Cohort "${c.name}" workspace active`)}
                >
                  Manage Roster →
                </button>
              </div>
            </div>
          ))}

          {!cohorts.length && (
            <Empty
              title="No cohorts scheduled"
              text="Create cohorts to organize incubated startups into structured batch schedules."
            />
          )}
        </div>
      </Card>

      {/* Create Cohort Modal */}
      {createOpen && (
        <Modal
          eyebrow="COHORT SCHEDULING"
          title="Create a New Cohort Batch"
          close={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <Select
              label="Incubation Program"
              value={form.program_id}
              onChange={e => setForm({ ...form, program_id: Number(e.target.value) })}
            >
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>

            <Input
              label="Cohort Name"
              required
              placeholder="e.g. Cohort 2026-Alpha"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <div className="form-row">
              <Input
                label="Start Date"
                type="date"
                required
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn type="submit">Create Cohort →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
