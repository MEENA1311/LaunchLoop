import React, { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Select, Textarea, Empty, relative } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Challenges() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canPost = currentUser.role === 'incubator' || currentUser.role === 'mentor' || currentUser.role === 'admin';

  const [challenges, setChallenges] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitModalChallenge, setSubmitModalChallenge] = useState(null);
  const [submissionsModalChallenge, setSubmissionsModalChallenge] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // Post Challenge Form
  const [form, setForm] = useState({
    title: '',
    problem_statement: '',
    description: '',
    domain: 'AI & EdTech',
    deadline: '2026-12-25',
    eligibility: 'Open to all undergraduate and graduate student teams'
  });

  // Submit Solution Form
  const [solutionForm, setSolutionForm] = useState({
    title: 'Automated Campus Scheduling Prototype',
    solution: 'An AI-powered resource scheduling system that optimizes classroom, lab, and professor availability dynamically using constraint satisfaction algorithms.'
  });
  const [submitting, setSubmitting] = useState(false);

  const loadChallenges = () => {
    get('/challenges').then(setChallenges).catch(() => {});
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  async function handleCreateChallenge(e) {
    e.preventDefault();
    try {
      await post('/challenges', form);
      toast.success('Challenge published to student innovators!');
      setCreateOpen(false);
      setForm({
        title: '',
        problem_statement: '',
        description: '',
        domain: 'AI & EdTech',
        deadline: '2026-12-25',
        eligibility: ''
      });
      loadChallenges();
    } catch (err) {
      toast.error(err.message || 'Failed to post challenge');
    }
  }

  async function handleSubmitSolution(e) {
    e.preventDefault();
    if (!submitModalChallenge) return;
    setSubmitting(true);
    try {
      await post(`/challenges/${submitModalChallenge.id}/submissions`, solutionForm);
      toast.success('Your challenge solution proposal has been submitted!');
      setSubmitModalChallenge(null);
      loadChallenges();
    } catch (err) {
      toast.error(err.message || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  }

  async function openSubmissions(ch) {
    setSubmissionsModalChallenge(ch);
    try {
      const subs = await get(`/challenges/${ch.id}/submissions`);
      setSubmissions(subs);
    } catch {
      setSubmissions([]);
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="PROBLEM SOURCING"
        title="Innovation Challenges"
        action={
          canPost && (
            <Btn onClick={() => setCreateOpen(true)}>
              ＋ Post Challenge
            </Btn>
          )
        }
      />

      <div className="challenge-grid">
        {challenges.map(ch => (
          <Card key={ch.id} className="challenge-card">
            <div className="challenge-top">
              <span className="pill success">{ch.domain}</span>
              <Pill tone="soft">{ch.status || 'Open'}</Pill>
            </div>

            <h3>{ch.title}</h3>
            <p>{ch.problem_statement}</p>

            <div className="challenge-meta">
              <span>Eligibility</span>
              <b>{ch.eligibility ? ch.eligibility.slice(0, 35) : 'All students'}</b>
            </div>

            <div className="challenge-meta">
              <span>Deadline</span>
              <b>{new Date(ch.deadline).toLocaleDateString()}</b>
            </div>

            <div className="challenge-meta">
              <span>Sponsor / Host</span>
              <b>{ch.creator_name}</b>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <Btn
                variant="outline"
                style={{ flex: 1 }}
                onClick={() => openSubmissions(ch)}
              >
                Submissions ({ch.submissions_count || 0})
              </Btn>
              <Btn
                style={{ flex: 1 }}
                onClick={() => setSubmitModalChallenge(ch)}
              >
                Submit Solution →
              </Btn>
            </div>
          </Card>
        ))}

        {!challenges.length && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty
              title="No active innovation challenges"
              text="Incubators and mentors will publish hackathon and real-world problem statements here."
            />
          </div>
        )}
      </div>

      {/* Post Challenge Modal */}
      {createOpen && (
        <Modal
          eyebrow="SPONSOR CHALLENGE"
          title="Launch an Innovation Challenge"
          close={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreateChallenge}>
            <Input
              label="Challenge Title"
              required
              placeholder="e.g. AI for Campus Energy Optimization"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <Textarea
              label="Problem Statement"
              required
              rows={3}
              placeholder="What core operational or market challenge must teams solve?"
              value={form.problem_statement}
              onChange={e => setForm({ ...form, problem_statement: e.target.value })}
            />

            <Textarea
              label="Challenge Description / Deliverables"
              rows={3}
              placeholder="Detailed guidelines, judging rubric, and prize details"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <div className="form-row">
              <Select
                label="Domain / Sector"
                value={form.domain}
                onChange={e => setForm({ ...form, domain: e.target.value })}
              >
                <option value="AI & EdTech">AI & EdTech</option>
                <option value="Sustainability">Sustainability & CleanTech</option>
                <option value="FinTech">FinTech & Payments</option>
                <option value="HealthTech">HealthTech</option>
                <option value="Smart Campus">Smart Campus</option>
              </Select>

              <Input
                label="Deadline"
                type="date"
                required
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
              />
            </div>

            <Input
              label="Eligibility Criteria"
              placeholder="e.g. College students and multidisciplinary teams"
              value={form.eligibility}
              onChange={e => setForm({ ...form, eligibility: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Btn>
              <Btn type="submit">Publish Challenge →</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Submit Solution Modal */}
      {submitModalChallenge && (
        <Modal
          eyebrow="CHALLENGE SUBMISSION"
          title={`Submit Solution for "${submitModalChallenge.title}"`}
          close={() => setSubmitModalChallenge(null)}
          maxWidth={640}
        >
          <form className="modal-form" onSubmit={handleSubmitSolution}>
            <p className="muted" style={{ margin: 0 }}>
              Submit your team's proposal for <b>{submitModalChallenge.title}</b>.
            </p>

            <Input
              label="Proposal / Solution Title"
              required
              value={solutionForm.title}
              onChange={e => setSolutionForm({ ...solutionForm, title: e.target.value })}
            />

            <Textarea
              label="Technical Architecture & Proposed Solution"
              required
              rows={5}
              value={solutionForm.solution}
              onChange={e => setSolutionForm({ ...solutionForm, solution: e.target.value })}
              placeholder="Describe your algorithm, architecture, and prototype implementation..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setSubmitModalChallenge(null)}>Cancel</Btn>
              <Btn type="submit" loading={submitting}>Submit Proposal →</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* View Submissions Modal */}
      {submissionsModalChallenge && (
        <Modal
          eyebrow="SUBMISSIONS"
          title={`Proposals for "${submissionsModalChallenge.title}"`}
          close={() => setSubmissionsModalChallenge(null)}
          maxWidth={640}
        >
          <div style={{ display: 'grid', gap: '10px', padding: '10px 0' }}>
            {submissions.map(sub => (
              <div
                key={sub.id}
                style={{ background: '#f8f9fc', border: '1px solid #e4e9f1', padding: '12px', borderRadius: '8px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>{sub.title || 'Solution Proposal'}</b>
                  <Pill tone="success">{sub.status}</Pill>
                </div>
                <small className="muted">Submitted by {sub.student_name} ({sub.student_email}) · {relative(sub.submitted_at)}</small>
                <p style={{ margin: '8px 0 0', fontSize: '11px', lineHeight: 1.5 }}>{sub.solution}</p>
              </div>
            ))}

            {!submissions.length && (
              <Empty
                title="No solutions submitted yet"
                text="Be the first student team to submit a prototype solution for this challenge."
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
