import React, { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Select, Textarea, Empty, formatCurrency } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Portfolio() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInvestor = currentUser.role === 'investor' || currentUser.role === 'admin';

  const [portfolio, setPortfolio] = useState([]);
  const [deals, setDeals] = useState([]);
  const [recordOpen, setRecordOpen] = useState(false);

  // Form
  const [form, setForm] = useState({
    deal_id: 1,
    amount: 1200000,
    equity_percent: 8.5,
    investment_date: new Date().toISOString().split('T')[0],
    notes: 'Seed allocation round concluded with founder team.'
  });

  const loadData = () => {
    get('/portfolio').then(setPortfolio).catch(() => {});
    get('/deals').then(setDeals).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleRecordInvestment(e) {
    e.preventDefault();
    try {
      await post('/investments', form);
      toast.success('Investment finalized and recorded in portfolio!');
      setRecordOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to record investment');
    }
  }

  const totalCapital = portfolio.reduce((acc, c) => acc + Number(c.invested_amount || c.amount || 0), 0);
  const avgEquity = portfolio.length
    ? (portfolio.reduce((acc, c) => acc + Number(c.equity_percent || 8.5), 0) / portfolio.length).toFixed(1)
    : 8.5;

  return (
    <div className="page">
      <Toolbar
        eyebrow="CAPITAL ALLOCATION"
        title="Investor Portfolio Dashboard"
        action={
          isInvestor && (
            <Btn onClick={() => setRecordOpen(true)}>
              ＋ Record New Investment
            </Btn>
          )
        }
      />

      <div className="portfolio-grid">
        {/* Hero Card */}
        <Card className="portfolio-hero">
          <span className="eyebrow" style={{ color: '#a0b6db' }}>TOTAL COMMITTED CAPITAL</span>
          <strong>{formatCurrency(totalCapital || 1200000)}</strong>
          <p>Tracked venture assets under management across university companies.</p>

          <div className="portfolio-split">
            <div>
              <span>Active Ventures</span>
              <b>{portfolio.length || 1} Startups</b>
            </div>
            <div>
              <span>Avg Ownership</span>
              <b>{avgEquity}% Equity</b>
            </div>
            <div>
              <span>Avg Runway</span>
              <b>12 Months</b>
            </div>
          </div>
        </Card>

        {/* Portfolio Health */}
        <Card>
          <div className="section-head">
            <div>
              <span className="eyebrow">PORTFOLIO COMPANIES</span>
              <h3>Active Investments ({portfolio.length})</h3>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px', padding: '0 10px 15px' }}>
            {portfolio.map(comp => (
              <div className="portfolio-company" key={comp.id}>
                <div className="startup-logo">{comp.startup_name?.[0] || 'N'}</div>
                <div>
                  <b>{comp.startup_name}</b>
                  <span>{comp.industry} · {comp.startup_stage || 'Traction'} · {formatCurrency(comp.invested_amount || comp.amount)}</span>
                </div>
                <Pill tone="success">{comp.equity_percent || 8.5}% Equity</Pill>
                <strong>+24% YoY</strong>
              </div>
            ))}

            {!portfolio.length && (
              <Empty
                title="No portfolio investments yet"
                text="When deals advance to 'Invested', company financial metrics will appear here."
              />
            )}
          </div>
        </Card>
      </div>

      {/* Record Investment Modal */}
      {recordOpen && (
        <Modal
          eyebrow="TERM SHEET EXECUTION"
          title="Record Finalized Investment"
          close={() => setRecordOpen(false)}
        >
          <form className="modal-form" onSubmit={handleRecordInvestment}>
            <Select
              label="Select Deal in Negotiation / Due Diligence"
              value={form.deal_id}
              onChange={e => setForm({ ...form, deal_id: Number(e.target.value) })}
            >
              {deals.map(d => (
                <option key={d.id} value={d.id}>
                  {d.startup_name} — {d.title} ({d.stage})
                </option>
              ))}
            </Select>

            <div className="form-row">
              <Input
                label="Investment Amount (₹)"
                type="number"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
              />
              <Input
                label="Equity Share (%)"
                type="number"
                step="0.1"
                required
                value={form.equity_percent}
                onChange={e => setForm({ ...form, equity_percent: Number(e.target.value) })}
              />
            </div>

            <Input
              label="Investment Date"
              type="date"
              required
              value={form.investment_date}
              onChange={e => setForm({ ...form, investment_date: e.target.value })}
            />

            <Textarea
              label="Term Sheet Covenants & Notes"
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setRecordOpen(false)}>Cancel</Btn>
              <Btn type="submit">Record Investment →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
