import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, put } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Select, Textarea, Empty, formatCurrency } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Startups() {
  const nav = useNavigate();
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInvestor = currentUser.role === 'investor';
  const isFounder = currentUser.role === 'startup';

  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [stageFilter, setStageFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [dealModalItem, setDealModalItem] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    industry: 'SaaS',
    location: 'Coimbatore',
    problem: '',
    solution: '',
    business_model: 'B2B Subscription',
    target_market: 'Early-stage builders and colleges',
    stage: 'MVP',
    traction: '50 active pilot users',
    revenue: 25000,
    funding_requirement: 1000000,
    website: 'https://venture.example'
  });

  const [dealForm, setDealForm] = useState({
    title: '',
    amount: 1000000,
    stage: 'New Opportunity',
    notes: 'High potential early metrics matching our thesis.'
  });

  const loadStartups = () => {
    setLoading(true);
    let url = '/startups?';
    if (stageFilter !== 'All') url += `stage=${encodeURIComponent(stageFilter)}&`;
    if (industryFilter !== 'All') url += `industry=${encodeURIComponent(industryFilter)}&`;
    if (search.trim()) url += `search=${encodeURIComponent(search.trim())}`;

    get(url)
      .then(setStartups)
      .catch(err => toast.error('Failed to load startups: ' + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStartups();
  }, [stageFilter, industryFilter]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await post('/startups', createForm);
      toast.success('Startup registered in ecosystem!');
      setCreateOpen(false);
      loadStartups();
    } catch (err) {
      toast.error(err.message || 'Failed to register startup');
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editItem) return;
    try {
      await put(`/startups/${editItem.id}`, editItem);
      toast.success('Startup profile updated!');
      setEditItem(null);
      loadStartups();
    } catch (err) {
      toast.error(err.message || 'Failed to update startup');
    }
  }

  async function handleAddDeal(e) {
    e.preventDefault();
    if (!dealModalItem) return;
    try {
      await post('/deals', {
        startup_id: dealModalItem.id,
        title: dealForm.title || `${dealModalItem.name} Seed Opportunity`,
        amount: Number(dealForm.amount),
        stage: dealForm.stage,
        notes: dealForm.notes
      });
      toast.success(`Added ${dealModalItem.name} to your Deal Flow!`);
      setDealModalItem(null);
      nav('/deals');
    } catch (err) {
      toast.error(err.message || 'Failed to add to deal flow');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="STARTUP DIRECTORY & WORKSPACE"
        title="Discover High-Growth Startups"
        action={
          <Btn onClick={() => setCreateOpen(true)}>
            ＋ Register Startup
          </Btn>
        }
      />

      <div className="filterbar">
        <div className="field" style={{ minWidth: '220px' }}>
          <span>Search Startups</span>
          <input
            placeholder="Search by name, problem, tech..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadStartups()}
          />
        </div>

        <div className="field">
          <span>Stage</span>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            <option value="All">All Stages</option>
            <option value="Idea">Idea</option>
            <option value="Validation">Validation</option>
            <option value="Prototype">Prototype</option>
            <option value="MVP">MVP</option>
            <option value="Traction">Traction</option>
            <option value="Fundraising">Fundraising</option>
            <option value="Growth">Growth</option>
          </select>
        </div>

        <div className="field">
          <span>Industry</span>
          <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
            <option value="All">All Industries</option>
            <option value="SaaS">SaaS</option>
            <option value="EdTech">EdTech</option>
            <option value="FinTech">FinTech</option>
            <option value="HealthTech">HealthTech</option>
            <option value="AI">AI & ML</option>
            <option value="ClimateTech">ClimateTech</option>
          </select>
        </div>

        <Btn variant="outline" onClick={loadStartups}>
          Filter
        </Btn>
      </div>

      <div className="startup-grid">
        {startups.map(s => (
          <Card key={s.id} className="startup-card">
            <div className="startup-top">
              <div className="startup-logo">{s.name[0]}</div>
              <Pill tone="success">{s.stage}</Pill>
            </div>

            <h3>{s.name}</h3>
            <span className="startup-meta">{s.industry} · {s.location}</span>
            <p>{s.solution || s.problem}</p>

            <div className="startup-kpis">
              <div>
                <small>MONTHLY REV</small>
                <b>{formatCurrency(s.revenue)}</b>
              </div>
              <div>
                <small>FUNDING ASK</small>
                <b>{formatCurrency(s.funding_requirement)}</b>
              </div>
              <div>
                <small>TRACTION</small>
                <b>{s.traction ? s.traction.slice(0, 18) : 'Early stage'}</b>
              </div>
            </div>

            <div className="card-actions">
              <span style={{ fontSize: '9px', color: '#8898aa' }}>Founder: {s.owner_name}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isInvestor && (
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      setDealModalItem(s);
                      setDealForm({
                        title: `${s.name} Seed Opportunity`,
                        amount: Number(s.funding_requirement || 1000000),
                        stage: 'New Opportunity',
                        notes: `Screening notes for ${s.name}.`
                      });
                    }}
                  >
                    Add Deal +
                  </button>
                )}
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setDetailItem(s)}
                >
                  View Details →
                </button>
              </div>
            </div>
          </Card>
        ))}

        {!startups.length && !loading && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty
              title="No startups found"
              text="Register a new startup profile to make your company visible to mentors, incubators, and investors."
              action={<Btn onClick={() => setCreateOpen(true)}>Register Startup</Btn>}
            />
          </div>
        )}
      </div>

      {/* View Startup Details Modal */}
      {detailItem && (
        <Modal
          eyebrow="STARTUP PITCH MEMO"
          title={detailItem.name}
          close={() => setDetailItem(null)}
          maxWidth={640}
        >
          <div style={{ display: 'grid', gap: '14px', padding: '10px 0' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Pill tone="success">{detailItem.stage}</Pill>
              <Pill>{detailItem.industry}</Pill>
              <span className="muted" style={{ fontSize: '11px' }}>Location: {detailItem.location}</span>
            </div>

            <div>
              <small className="muted">The Problem</small>
              <p style={{ margin: '3px 0', fontSize: '11px', lineHeight: 1.6 }}>{detailItem.problem}</p>
            </div>

            <div>
              <small className="muted">The Solution</small>
              <p style={{ margin: '3px 0', fontSize: '11px', lineHeight: 1.6 }}>{detailItem.solution}</p>
            </div>

            <div style={{ background: '#f8f9fc', border: '1px solid #e2e8f1', padding: '14px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <small className="muted">Business Model</small>
                <b style={{ fontSize: '11px' }}>{detailItem.business_model || 'B2B SaaS'}</b>
              </div>
              <div>
                <small className="muted">Target Market</small>
                <b style={{ fontSize: '11px' }}>{detailItem.target_market || 'Students & Startups'}</b>
              </div>
              <div>
                <small className="muted">Current Traction</small>
                <b style={{ fontSize: '11px' }}>{detailItem.traction || 'Pilot stage'}</b>
              </div>
              <div>
                <small className="muted">Monthly Revenue</small>
                <b style={{ fontSize: '11px', color: '#19a875' }}>{formatCurrency(detailItem.revenue)}</b>
              </div>
              <div>
                <small className="muted">Funding Ask</small>
                <b style={{ fontSize: '11px', color: '#2d7ff9' }}>{formatCurrency(detailItem.funding_requirement)}</b>
              </div>
              <div>
                <small className="muted">Website</small>
                <b style={{ fontSize: '11px' }}>
                  {detailItem.website ? <a href={detailItem.website} target="_blank" rel="noreferrer">{detailItem.website}</a> : 'Not listed'}
                </b>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #edf0f4', paddingTop: '15px' }}>
              {(currentUser.id === detailItem.owner_id || currentUser.role === 'admin') && (
                <Btn
                  variant="soft"
                  onClick={() => { setEditItem({ ...detailItem }); setDetailItem(null); }}
                >
                  ✎ Edit Company Profile
                </Btn>
              )}

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <Btn variant="outline" onClick={() => setDetailItem(null)}>Close</Btn>
                {isInvestor && (
                  <Btn onClick={() => {
                    setDealModalItem(detailItem);
                    setDealForm({
                      title: `${detailItem.name} Seed Opportunity`,
                      amount: Number(detailItem.funding_requirement || 1000000),
                      stage: 'New Opportunity',
                      notes: `Reviewing ${detailItem.name} traction.`
                    });
                    setDetailItem(null);
                  }}>
                    Add to Deal Flow →
                  </Btn>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Register Startup Modal */}
      {createOpen && (
        <Modal
          eyebrow="FOUNDER WORKSPACE"
          title="Register a Startup"
          close={() => setCreateOpen(false)}
          maxWidth={640}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <div className="form-row">
              <Input
                label="Startup Name"
                required
                placeholder="e.g. NextGen Robotics"
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
              />
              <Select
                label="Industry"
                value={createForm.industry}
                onChange={e => setCreateForm({ ...createForm, industry: e.target.value })}
              >
                <option value="SaaS">SaaS</option>
                <option value="EdTech">EdTech</option>
                <option value="FinTech">FinTech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="AI">AI & Machine Learning</option>
                <option value="CleanTech">CleanTech</option>
              </Select>
            </div>

            <div className="form-row">
              <Select
                label="Startup Stage"
                value={createForm.stage}
                onChange={e => setCreateForm({ ...createForm, stage: e.target.value })}
              >
                <option value="Idea">Idea</option>
                <option value="Validation">Validation</option>
                <option value="Prototype">Prototype</option>
                <option value="MVP">MVP</option>
                <option value="Traction">Traction</option>
                <option value="Fundraising">Fundraising</option>
                <option value="Growth">Growth</option>
              </Select>
              <Input
                label="Headquarters Location"
                value={createForm.location}
                onChange={e => setCreateForm({ ...createForm, location: e.target.value })}
              />
            </div>

            <Textarea
              label="Problem Statement"
              required
              rows={2}
              value={createForm.problem}
              onChange={e => setCreateForm({ ...createForm, problem: e.target.value })}
            />

            <Textarea
              label="Solution"
              required
              rows={2}
              value={createForm.solution}
              onChange={e => setCreateForm({ ...createForm, solution: e.target.value })}
            />

            <div className="form-row">
              <Input
                label="Business Model"
                placeholder="e.g. B2B Subscription"
                value={createForm.business_model}
                onChange={e => setCreateForm({ ...createForm, business_model: e.target.value })}
              />
              <Input
                label="Target Market"
                placeholder="e.g. Engineering colleges"
                value={createForm.target_market}
                onChange={e => setCreateForm({ ...createForm, target_market: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Input
                label="Traction Highlights"
                placeholder="e.g. 150 active users, 5 pilots"
                value={createForm.traction}
                onChange={e => setCreateForm({ ...createForm, traction: e.target.value })}
              />
              <Input
                label="Funding Ask (₹)"
                type="number"
                value={createForm.funding_requirement}
                onChange={e => setCreateForm({ ...createForm, funding_requirement: e.target.value })}
              />
            </div>

            <Input
              label="Company Website / Demo Link"
              value={createForm.website}
              onChange={e => setCreateForm({ ...createForm, website: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn type="submit">Publish Startup Workspace →</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Startup Modal */}
      {editItem && (
        <Modal
          eyebrow="EDIT STARTUP"
          title={`Edit ${editItem.name}`}
          close={() => setEditItem(null)}
          maxWidth={640}
        >
          <form className="modal-form" onSubmit={handleEdit}>
            <div className="form-row">
              <Input
                label="Company Name"
                value={editItem.name}
                onChange={e => setEditItem({ ...editItem, name: e.target.value })}
              />
              <Select
                label="Current Stage"
                value={editItem.stage}
                onChange={e => setEditItem({ ...editItem, stage: e.target.value })}
              >
                <option value="Idea">Idea</option>
                <option value="Validation">Validation</option>
                <option value="Prototype">Prototype</option>
                <option value="MVP">MVP</option>
                <option value="Traction">Traction</option>
                <option value="Fundraising">Fundraising</option>
                <option value="Growth">Growth</option>
              </Select>
            </div>

            <div className="form-row">
              <Input
                label="Monthly Revenue (₹)"
                type="number"
                value={editItem.revenue}
                onChange={e => setEditItem({ ...editItem, revenue: e.target.value })}
              />
              <Input
                label="Funding Requirement (₹)"
                type="number"
                value={editItem.funding_requirement}
                onChange={e => setEditItem({ ...editItem, funding_requirement: e.target.value })}
              />
            </div>

            <Input
              label="Traction Highlights"
              value={editItem.traction || ''}
              onChange={e => setEditItem({ ...editItem, traction: e.target.value })}
            />

            <Textarea
              label="Solution Overview"
              rows={3}
              value={editItem.solution || ''}
              onChange={e => setEditItem({ ...editItem, solution: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setEditItem(null)}>Cancel</Btn>
              <Btn type="submit">Save Changes</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Deal Modal (For Investors) */}
      {dealModalItem && (
        <Modal
          eyebrow="DEAL PIPELINE"
          title={`Add ${dealModalItem.name} to Deal Flow`}
          close={() => setDealModalItem(null)}
        >
          <form className="modal-form" onSubmit={handleAddDeal}>
            <Input
              label="Deal Opportunity Title"
              required
              value={dealForm.title}
              onChange={e => setDealForm({ ...dealForm, title: e.target.value })}
            />

            <div className="form-row">
              <Input
                label="Proposed Investment Amount (₹)"
                type="number"
                required
                value={dealForm.amount}
                onChange={e => setDealForm({ ...dealForm, amount: e.target.value })}
              />
              <Select
                label="Initial Pipeline Stage"
                value={dealForm.stage}
                onChange={e => setDealForm({ ...dealForm, stage: e.target.value })}
              >
                <option value="New Opportunity">New Opportunity</option>
                <option value="Screening">Screening</option>
                <option value="Review">Review</option>
                <option value="Due Diligence">Due Diligence</option>
              </Select>
            </div>

            <Textarea
              label="Investment Thesis / Initial Notes"
              rows={3}
              value={dealForm.notes}
              onChange={e => setDealForm({ ...dealForm, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setDealModalItem(null)}>Cancel</Btn>
              <Btn type="submit">Add to Deal Flow →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
