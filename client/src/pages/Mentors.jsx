import React, { useEffect, useState } from 'react';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Select, Textarea, Empty } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Mentors() {
  const toast = useToast();
  const [mentors, setMentors] = useState([]);
  const [startups, setStartups] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Filter
  const [industryFilter, setIndustryFilter] = useState('All');

  // Request form
  const [goal, setGoal] = useState('Product architecture review and guidance on early MVP validation.');
  const [startupId, setStartupId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    get('/mentors').then(setMentors).catch(() => {});
    get('/startups').then(setStartups).catch(() => {});
  }, []);

  async function handleSendRequest(e) {
    e.preventDefault();
    if (!selectedMentor) return;
    setSending(true);
    try {
      await post('/mentorship-requests', {
        mentor_id: selectedMentor.id,
        goal,
        startup_id: startupId ? Number(startupId) : null
      });
      toast.success(`Mentorship request delivered to ${selectedMentor.name}!`);
      setSelectedMentor(null);
    } catch (err) {
      toast.error(err.message || 'Failed to send mentorship request');
    } finally {
      setSending(false);
    }
  }

  const filteredMentors = mentors.filter(m => {
    if (industryFilter === 'All') return true;
    return m.industry?.toLowerCase() === industryFilter.toLowerCase();
  });

  return (
    <div className="page">
      <Toolbar
        eyebrow="ADVISORY & EXPERTISE"
        title="Find the Right Mentor"
      />

      <div className="filterbar">
        <div className="field">
          <span>Filter by Industry</span>
          <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
            <option value="All">All Industries</option>
            <option value="Technology">Technology & Software</option>
            <option value="Product">Product Strategy</option>
            <option value="FinTech">FinTech</option>
            <option value="AI">AI / DeepTech</option>
          </select>
        </div>
      </div>

      <div className="mentor-grid">
        {filteredMentors.map(m => (
          <Card key={m.id} className="mentor-card">
            <div className="mentor-cover" />
            <div className="mentor-body">
              <div className="mentor-avatar">{m.name[0]}</div>
              <h3>{m.name}</h3>
              <span className="mentor-role">{m.email}</span>
              <p>{m.expertise || 'Experienced technology and startup advisor.'}</p>

              <div className="idea-meta" style={{ margin: '8px 0' }}>
                <span>◈ {m.industry || 'Tech'}</span>
                <span>★ {m.years_experience || 5}+ yrs exp</span>
                <span>⏱ {m.availability || 'Flexible'}</span>
              </div>

              <div className="tags" style={{ marginBottom: '14px' }}>
                <Pill tone="success">Stages: {m.preferred_stages || 'Idea, MVP, Seed'}</Pill>
              </div>

              <Btn onClick={() => setSelectedMentor(m)}>
                Request Mentorship →
              </Btn>
            </div>
          </Card>
        ))}

        {!filteredMentors.length && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty
              title="No mentors found"
              text="Mentors registered on the platform will appear here."
            />
          </div>
        )}
      </div>

      {selectedMentor && (
        <Modal
          eyebrow="STRUCTURED MENTORSHIP REQUEST"
          title={`Connect with ${selectedMentor.name}`}
          close={() => setSelectedMentor(null)}
        >
          <form className="modal-form" onSubmit={handleSendRequest}>
            <p className="muted" style={{ margin: 0 }}>
              Send a clear guidance request to <b>{selectedMentor.name}</b> ({selectedMentor.industry}).
              The mentor will review your objectives and schedule advising sessions.
            </p>

            <Textarea
              label="Mentorship Goal / Discussion Topics"
              required
              rows={4}
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="What specific questions or milestones do you need advice on?"
            />

            <Select
              label="Associated Startup or Project (Optional)"
              value={startupId}
              onChange={e => setStartupId(e.target.value)}
            >
              <option value="">-- General Student Mentorship --</option>
              {startups.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.stage} · {s.industry})</option>
              ))}
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setSelectedMentor(null)}>Cancel</Btn>
              <Btn type="submit" loading={sending}>Send Request →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
