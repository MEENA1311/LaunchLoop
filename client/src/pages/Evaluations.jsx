import React, { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Select, Textarea, Empty, relative } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Evaluations() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [evaluations, setEvaluations] = useState([]);
  const [startups, setStartups] = useState([]);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [activeEval, setActiveEval] = useState(null);

  // Evaluation Form
  const [form, setForm] = useState({
    startup_id: 1,
    problem_validation: 8,
    solution_score: 8,
    market_score: 7,
    team_score: 9,
    product_score: 8,
    business_model_score: 7,
    traction_score: 6,
    fundraising_readiness: 7,
    comments: 'Strong early product-market validation and cohesive team. Focus on repeatable unit economics before seed fundraising.'
  });

  const loadData = () => {
    get('/evaluations').then(data => {
      setEvaluations(data);
      if (data.length && !activeEval) setActiveEval(data[0]);
    }).catch(() => {});
    get('/startups').then(setStartups).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await post('/evaluations', form);
      toast.success('Readiness evaluation submitted!');
      setSubmitOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit evaluation');
    }
  }

  const dimensions = [
    { key: 'problem_validation', label: 'Problem Validation', desc: 'Clarity of the pain point and target audience need.' },
    { key: 'solution_score', label: 'Solution Viability', desc: 'Effectiveness and uniqueness of proposed solution.' },
    { key: 'market_score', label: 'Market Opportunity', desc: 'Total addressable market and competitive positioning.' },
    { key: 'team_score', label: 'Founder & Team', desc: 'Execution ability, technical skills, and commitment.' },
    { key: 'product_score', label: 'Product & Tech', desc: 'Architecture quality, MVP progress, and reliability.' },
    { key: 'business_model_score', label: 'Business Model', desc: 'Revenue stream logic and pricing viability.' },
    { key: 'traction_score', label: 'Traction & Proof', desc: 'Active users, pilot teams, letters of intent, or revenue.' },
    { key: 'fundraising_readiness', label: 'Fundraising Readiness', desc: 'Pitch quality, diligence readiness, and capital use clarity.' }
  ];

  const currentScores = activeEval || (evaluations[0] || form);
  const avgScore = (
    (Number(currentScores.problem_validation || 0) +
     Number(currentScores.solution_score || 0) +
     Number(currentScores.market_score || 0) +
     Number(currentScores.team_score || 0) +
     Number(currentScores.product_score || 0) +
     Number(currentScores.business_model_score || 0) +
     Number(currentScores.traction_score || 0) +
     Number(currentScores.fundraising_readiness || 0)) / 8
  ).toFixed(1);

  return (
    <div className="page">
      <Toolbar
        eyebrow="FOUNDER BENCHMARKING"
        title="Startup Readiness Evaluations"
        action={
          <Btn onClick={() => setSubmitOpen(true)}>
            ＋ Submit New Evaluation
          </Btn>
        }
      />

      <div className="dashboard-grid lower" style={{ gridTemplateColumns: '1.2fr .8fr', gap: '16px' }}>
        {/* Left: Interactive 8-Score Cards */}
        <Card>
          <div className="section-head">
            <div>
              <span className="eyebrow">READINESS INDEX FOR {currentScores.startup_name || 'NEONLABS'}</span>
              <h3>Overall Benchmark: {avgScore} / 10 ({Math.round(avgScore * 10)}%)</h3>
            </div>
            <Pill tone="success">Evaluated by {currentScores.mentor_name || 'Mentor Network'}</Pill>
          </div>

          <div className="score-grid">
            {dimensions.map(dim => {
              const val = currentScores[dim.key] !== undefined ? currentScores[dim.key] : 7;
              return (
                <div className="score-card" key={dim.key}>
                  <span>{dim.label}</span>
                  <strong>{val} / 10</strong>
                  <div className="score-bar">
                    <i style={{ width: `${val * 10}%`, background: val >= 8 ? '#19a875' : (val >= 6 ? '#2d7ff9' : '#f49a39') }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="evaluation-note">
            <b>Mentor Guidance & Recommendation:</b>
            <p>{currentScores.comments || 'Readiness evaluation benchmarked across all 8 core dimensions.'}</p>
          </div>
        </Card>

        {/* Right: Evaluation History */}
        <Card>
          <div className="section-head">
            <div>
              <span className="eyebrow">HISTORY</span>
              <h3>All Evaluations ({evaluations.length})</h3>
            </div>
          </div>

          <div className="activity-list">
            {evaluations.map(ev => (
              <div
                key={ev.id}
                className={`activity clickable ${activeEval?.id === ev.id ? 'active' : ''}`}
                onClick={() => setActiveEval(ev)}
                style={{ cursor: 'pointer', padding: '12px 20px' }}
              >
                <span className="activity-dot d1" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b>{ev.startup_name}</b>
                    <Pill tone="success">
                      {(
                        (ev.problem_validation + ev.solution_score + ev.market_score + ev.team_score +
                         ev.product_score + ev.business_model_score + ev.traction_score + ev.fundraising_readiness) / 8
                      ).toFixed(1)} / 10
                    </Pill>
                  </div>
                  <p>{ev.comments ? ev.comments.slice(0, 90) + '...' : 'Evaluation recorded'}</p>
                  <small>By {ev.mentor_name} · {relative(ev.created_at)}</small>
                </div>
              </div>
            ))}

            {!evaluations.length && (
              <Empty
                title="No evaluations submitted yet"
                text="Mentors can evaluate startup readiness to guide founder milestone progress."
              />
            )}
          </div>
        </Card>
      </div>

      {/* Submit Evaluation Modal */}
      {submitOpen && (
        <Modal
          eyebrow="MENTOR READINESS SCORING"
          title="Submit Startup Evaluation"
          close={() => setSubmitOpen(false)}
          maxWidth={640}
        >
          <form className="modal-form" onSubmit={handleSubmit}>
            <Select
              label="Select Startup"
              value={form.startup_id}
              onChange={e => setForm({ ...form, startup_id: Number(e.target.value) })}
            >
              {startups.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.industry} · {s.stage})</option>
              ))}
            </Select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
              {dimensions.map(dim => (
                <div key={dim.key} style={{ background: '#f8f9fc', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 600 }}>{dim.label}</span>
                    <b style={{ color: '#2d7ff9', fontSize: '11px' }}>{form[dim.key]} / 10</b>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form[dim.key]}
                    onChange={e => setForm({ ...form, [dim.key]: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>

            <Textarea
              label="Qualitative Recommendations & Feedback"
              rows={3}
              value={form.comments}
              onChange={e => setForm({ ...form, comments: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Btn>
              <Btn type="submit">Submit Evaluation →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
