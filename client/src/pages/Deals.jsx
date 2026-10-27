import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, patch } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Select, Textarea, Empty, formatCurrency } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Deals() {
  const nav = useNavigate();
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInvestor = currentUser.role === 'investor' || currentUser.role === 'admin';

  const [deals, setDeals] = useState([]);
  const [startups, setStartups] = useState([]);
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'table'

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editNotesDeal, setEditNotesDeal] = useState(null);

  // Create Form
  const [form, setForm] = useState({
    startup_id: 1,
    title: 'Seed Investment Opportunity',
    stage: 'New Opportunity',
    amount: 1200000,
    notes: 'Strong founder background and early university customer proof.'
  });

  const stages = [
    'New Opportunity',
    'Screening',
    'Review',
    'Due Diligence',
    'Term Sheet',
    'Negotiation',
    'Invested',
    'Passed'
  ];

  const loadDeals = () => {
    get('/deals').then(setDeals).catch(() => {});
    get('/startups').then(setStartups).catch(() => {});
  };

  useEffect(() => {
    loadDeals();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await post('/deals', form);
      toast.success('Opportunity added to deal pipeline!');
      setCreateOpen(false);
      loadDeals();
    } catch (err) {
      toast.error(err.message || 'Failed to add deal');
    }
  }

  async function moveStage(dealId, stage) {
    try {
      await patch(`/deals/${dealId}`, { stage });
      toast.success(`Deal moved to "${stage}"!`);
      setDeals(deals.map(d => d.id === dealId ? { ...d, stage } : d));
    } catch (err) {
      toast.error('Failed to update deal stage: ' + err.message);
    }
  }

  async function saveNotes(e) {
    e.preventDefault();
    if (!editNotesDeal) return;
    try {
      await patch(`/deals/${editNotesDeal.id}`, { notes: editNotesDeal.notes });
      toast.success('Deal notes updated!');
      setEditNotesDeal(null);
      loadDeals();
    } catch (err) {
      toast.error('Failed to save notes');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="INVESTOR PIPELINE"
        title="Deal Flow & Opportunity Pipeline"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn
              variant="outline"
              onClick={() => setViewMode(viewMode === 'board' ? 'table' : 'board')}
            >
              {viewMode === 'board' ? 'Table View' : 'Pipeline Board'}
            </Btn>
            {isInvestor && (
              <Btn onClick={() => setCreateOpen(true)}>
                ＋ Add Deal Opportunity
              </Btn>
            )}
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="deal-summary">
        <Card>
          <span>TOTAL PIPELINE DEALS</span>
          <strong>{deals.length} Opportunities</strong>
          <small>Active founder evaluations</small>
        </Card>
        <Card>
          <span>IN DUE DILIGENCE</span>
          <strong>{deals.filter(d => d.stage === 'Due Diligence').length} Deals</strong>
          <small>Compliance & tech review</small>
        </Card>
        <Card>
          <span>INVESTED CAPITAL</span>
          <strong>
            {formatCurrency(deals.filter(d => d.stage === 'Invested').reduce((acc, d) => acc + Number(d.amount || 0), 0) || 1200000)}
          </strong>
          <small>Allocated university funding</small>
        </Card>
      </div>

      {/* BOARD VIEW */}
      {viewMode === 'board' ? (
        <div className="deal-board">
          {stages.map(st => {
            const colDeals = deals.filter(d => d.stage === st);
            return (
              <div className="deal-column" key={st}>
                <div className="deal-column-head">
                  <b>{st}</b>
                  <span>{colDeals.length}</span>
                </div>

                {colDeals.map(d => (
                  <div className="deal-card" key={d.id}>
                    <div className="deal-company">
                      <span>◆</span>
                      <div>
                        <b>{d.startup_name}</b>
                        <small>{d.industry} · {d.startup_stage || 'Traction'}</small>
                      </div>
                    </div>

                    <strong className="amount">{formatCurrency(d.amount)}</strong>
                    <p>{d.notes ? d.notes.slice(0, 75) + '...' : d.title}</p>

                    <div className="deal-footer">
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => nav('/due-diligence')}
                      >
                        Diligence Room →
                      </button>

                      {isInvestor ? (
                        <select
                          value={d.stage}
                          onChange={e => moveStage(d.id, e.target.value)}
                        >
                          {stages.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <Pill tone="soft">{d.stage}</Pill>
                      )}
                    </div>
                  </div>
                ))}

                {!colDeals.length && (
                  <small className="muted" style={{ display: 'block', textAlign: 'center', padding: '30px 0' }}>
                    Empty
                  </small>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card>
          <div className="workflow-table">
            {deals.map(d => (
              <div className="workflow-table-row" key={d.id}>
                <div>
                  <b>{d.startup_name} — {d.title}</b>
                  <span>{d.industry} · Ask: {formatCurrency(d.amount)} · Notes: {d.notes}</span>
                </div>

                <div>
                  <Pill tone={d.stage === 'Invested' ? 'success' : ''}>{d.stage}</Pill>
                </div>

                <div>
                  {isInvestor ? (
                    <select
                      value={d.stage}
                      onChange={e => moveStage(d.id, e.target.value)}
                      style={{ fontSize: '9px', padding: '4px' }}
                    >
                      {stages.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <small>{d.interest}</small>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => setEditNotesDeal(d)}
                  >
                    Edit Notes
                  </button>
                  <Btn
                    variant="soft"
                    style={{ padding: '6px 10px', fontSize: '9px' }}
                    onClick={() => nav('/due-diligence')}
                  >
                    Diligence Room
                  </Btn>
                </div>
              </div>
            ))}

            {!deals.length && (
              <Empty
                title="No deals in pipeline"
                text="Add startups to your deal flow to monitor their progress through due diligence and investment."
                action={isInvestor && <Btn onClick={() => setCreateOpen(true)}>Add Deal</Btn>}
              />
            )}
          </div>
        </Card>
      )}

      {/* Add Deal Modal */}
      {createOpen && (
        <Modal
          eyebrow="DEAL SCREENING"
          title="Add Startup to Deal Pipeline"
          close={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <Select
              label="Target Startup"
              value={form.startup_id}
              onChange={e => setForm({ ...form, startup_id: Number(e.target.value) })}
            >
              {startups.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.industry} · {s.stage})</option>
              ))}
            </Select>

            <Input
              label="Deal Opportunity Title"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <div className="form-row">
              <Input
                label="Target Investment Ticket (₹)"
                type="number"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
              />
              <Select
                label="Initial Pipeline Stage"
                value={form.stage}
                onChange={e => setForm({ ...form, stage: e.target.value })}
              >
                {stages.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Evaluation Notes & Thesis"
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn type="submit">Create Deal →</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Notes Modal */}
      {editNotesDeal && (
        <Modal
          eyebrow="DEAL MEMO"
          title={`Notes for ${editNotesDeal.startup_name}`}
          close={() => setEditNotesDeal(null)}
        >
          <form className="modal-form" onSubmit={saveNotes}>
            <Textarea
              label="Investor Screening Notes"
              rows={5}
              value={editNotesDeal.notes || ''}
              onChange={e => setEditNotesDeal({ ...editNotesDeal, notes: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setEditNotesDeal(null)}>Cancel</Btn>
              <Btn type="submit">Save Notes</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
