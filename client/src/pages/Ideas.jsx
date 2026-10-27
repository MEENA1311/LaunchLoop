import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Select, Textarea, Empty, relative } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Ideas() {
  const nav = useNavigate();
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [collabItem, setCollabItem] = useState(null);
  const [collabMsg, setCollabMsg] = useState('I am interested in collaborating on this idea. Here is how I can contribute...');

  // Form state
  const [form, setForm] = useState({
    title: '',
    problem: '',
    solution: '',
    target_users: 'College students',
    industry: 'EdTech',
    technologies: 'React, Node.js, MySQL',
    stage: 'Validation',
    required_skills: 'React, UI/UX, Backend'
  });
  const [submitting, setSubmitting] = useState(false);

  const loadIdeas = () => {
    setLoading(true);
    let url = '/ideas?';
    if (industryFilter !== 'All') url += `industry=${encodeURIComponent(industryFilter)}&`;
    if (stageFilter !== 'All') url += `stage=${encodeURIComponent(stageFilter)}&`;
    if (search.trim()) url += `search=${encodeURIComponent(search.trim())}`;

    get(url)
      .then(setItems)
      .catch(err => toast.error('Failed to load ideas: ' + err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIdeas();
  }, [industryFilter, stageFilter]);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await post('/ideas', form);
      toast.success('Idea published to the community!');
      setCreateOpen(false);
      setForm({
        title: '',
        problem: '',
        solution: '',
        target_users: 'College students',
        industry: 'EdTech',
        technologies: 'React, Node.js, MySQL',
        stage: 'Validation',
        required_skills: 'React, UI/UX'
      });
      loadIdeas();
    } catch (err) {
      toast.error(err.message || 'Failed to create idea');
    } finally {
      setSubmitting(false);
    }
  }

  async function convertToProject(idea) {
    try {
      const res = await post(`/ideas/${idea.id}/convert-to-project`, {});
      toast.success('Converted to a collaborative project with starter issues!');
      setViewItem(null);
      nav('/projects');
    } catch (err) {
      toast.error(err.message || 'Failed to convert idea to project');
    }
  }

  async function sendCollaboration() {
    if (!collabItem) return;
    try {
      await post(`/ideas/${collabItem.id}/collaborate`, { message: collabMsg });
      toast.success(`Collaboration request sent to ${collabItem.creator_name}!`);
      setCollabItem(null);
    } catch (err) {
      toast.error(err.message || 'Failed to send collaboration request');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="IDEA LAB"
        title="Community Innovation Hub"
        action={
          <Btn onClick={() => setCreateOpen(true)}>
            ＋ Create New Idea
          </Btn>
        }
      />

      {/* Filter and Search Bar */}
      <div className="filterbar">
        <div className="field" style={{ minWidth: '240px' }}>
          <span>Search ideas</span>
          <input
            placeholder="Search by keywords, tech..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadIdeas()}
          />
        </div>

        <div className="field">
          <span>Industry</span>
          <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)}>
            <option value="All">All Industries</option>
            <option value="EdTech">EdTech</option>
            <option value="FinTech">FinTech</option>
            <option value="HealthTech">HealthTech</option>
            <option value="SaaS">SaaS</option>
            <option value="AI">AI & Machine Learning</option>
            <option value="ClimateTech">ClimateTech</option>
          </select>
        </div>

        <div className="field">
          <span>Stage</span>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            <option value="All">All Stages</option>
            <option value="Idea">Idea</option>
            <option value="Validation">Validation</option>
            <option value="Prototype">Prototype</option>
            <option value="MVP">MVP</option>
          </select>
        </div>

        <Btn variant="outline" onClick={loadIdeas}>
          Filter
        </Btn>
      </div>

      {/* Grid of Ideas */}
      <div className="idea-grid">
        {items.map(item => (
          <Card key={item.id} className="idea-card">
            <div className="idea-top">
              <div className="idea-bulb">✦</div>
              <Pill tone={item.stage === 'MVP' ? 'success' : ''}>{item.stage}</Pill>
            </div>

            <h3>{item.title}</h3>
            <p>{item.problem}</p>

            <div className="idea-meta">
              <span>◈ {item.industry}</span>
              <span>♧ {item.creator_name}</span>
              <span>⏱ {relative(item.created_at)}</span>
            </div>

            <div className="tags">
              {item.technologies && <Pill tone="soft">{item.technologies}</Pill>}
              {item.required_skills && <Pill tone="soft">Needs: {item.required_skills}</Pill>}
            </div>

            <div className="idea-foot">
              <span>{item.status || 'Open'}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setCollabItem(item)}
                >
                  Collaborate
                </button>
                <button
                  type="button"
                  className="text-btn"
                  style={{ color: '#2d7ff9' }}
                  onClick={() => setViewItem(item)}
                >
                  View Details →
                </button>
              </div>
            </div>
          </Card>
        ))}

        {!items.length && !loading && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty
              title="No ideas match your criteria"
              text="Be the first to publish an idea and start building your team."
              action={<Btn onClick={() => setCreateOpen(true)}>Create First Idea</Btn>}
            />
          </div>
        )}
      </div>

      {/* Create Idea Modal */}
      {createOpen && (
        <Modal
          eyebrow="IDEA LAB WORKFLOW"
          title="Publish a Collaboration-Ready Idea"
          close={() => setCreateOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            <Input
              label="Idea Title"
              required
              placeholder="e.g. Campus Peer Skill Barter Network"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <Textarea
              label="Problem Statement"
              required
              rows={3}
              placeholder="What core problem do users face? Why does it exist?"
              value={form.problem}
              onChange={e => setForm({ ...form, problem: e.target.value })}
            />

            <Textarea
              label="Proposed Solution"
              required
              rows={3}
              placeholder="How does your solution address this problem?"
              value={form.solution}
              onChange={e => setForm({ ...form, solution: e.target.value })}
            />

            <div className="form-row">
              <Select
                label="Industry"
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
              >
                <option value="EdTech">EdTech</option>
                <option value="FinTech">FinTech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="SaaS">SaaS</option>
                <option value="AI">AI & Machine Learning</option>
                <option value="ClimateTech">ClimateTech</option>
              </Select>

              <Select
                label="Current Stage"
                value={form.stage}
                onChange={e => setForm({ ...form, stage: e.target.value })}
              >
                <option value="Idea">Idea</option>
                <option value="Validation">Validation</option>
                <option value="Prototype">Prototype</option>
                <option value="MVP">MVP</option>
              </Select>
            </div>

            <div className="form-row">
              <Input
                label="Target Users"
                placeholder="e.g. College students, small clinics"
                value={form.target_users}
                onChange={e => setForm({ ...form, target_users: e.target.value })}
              />
              <Input
                label="Technologies Planned"
                placeholder="e.g. React, Node.js, MySQL"
                value={form.technologies}
                onChange={e => setForm({ ...form, technologies: e.target.value })}
              />
            </div>

            <Input
              label="Skills Needed from Collaborators"
              placeholder="e.g. UI/UX Design, React, Product Marketing"
              value={form.required_skills}
              onChange={e => setForm({ ...form, required_skills: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Btn>
              <Btn type="submit" loading={submitting}>
                Publish Idea →
              </Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* View Idea Details Modal */}
      {viewItem && (
        <Modal
          eyebrow="IDEA DETAILS"
          title={viewItem.title}
          close={() => setViewItem(null)}
          maxWidth={640}
        >
          <div style={{ display: 'grid', gap: '14px', padding: '10px 0' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Pill tone="success">{viewItem.stage}</Pill>
              <Pill>{viewItem.industry}</Pill>
              <small className="muted">Posted by {viewItem.creator_name} ({viewItem.creator_email})</small>
            </div>

            <div>
              <b style={{ fontSize: '11px', color: '#15213b', display: 'block', marginBottom: '4px' }}>
                Problem Statement
              </b>
              <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.6, color: '#55657e' }}>
                {viewItem.problem}
              </p>
            </div>

            <div>
              <b style={{ fontSize: '11px', color: '#15213b', display: 'block', marginBottom: '4px' }}>
                Proposed Solution
              </b>
              <p style={{ margin: 0, fontSize: '11px', lineHeight: 1.6, color: '#55657e' }}>
                {viewItem.solution || 'Solution details to be refined during validation.'}
              </p>
            </div>

            <div style={{ background: '#f7f9fc', border: '1px solid #e4e9f1', padding: '12px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <small className="muted" style={{ display: 'block' }}>Target Audience</small>
                <b style={{ fontSize: '11px' }}>{viewItem.target_users || 'General'}</b>
              </div>
              <div>
                <small className="muted" style={{ display: 'block' }}>Tech Stack</small>
                <b style={{ fontSize: '11px' }}>{viewItem.technologies || 'Not specified'}</b>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <small className="muted" style={{ display: 'block' }}>Seeking Skills</small>
                <b style={{ fontSize: '11px' }}>{viewItem.required_skills || 'Open to all contributors'}</b>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #edf0f4', paddingTop: '15px' }}>
              <button
                type="button"
                className="text-btn"
                onClick={() => { setViewItem(null); setCollabItem(viewItem); }}
              >
                Send Collaboration Request
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn variant="outline" onClick={() => setViewItem(null)}>
                  Close
                </Btn>
                <Btn onClick={() => convertToProject(viewItem)}>
                  🚀 Convert to Project →
                </Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Collaboration Request Modal */}
      {collabItem && (
        <Modal
          eyebrow="COLLABORATION INVITATION"
          title={`Join "${collabItem.title}"`}
          close={() => setCollabItem(null)}
        >
          <div style={{ display: 'grid', gap: '12px', padding: '10px 0' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#66748a' }}>
              Send a note to <b>{collabItem.creator_name}</b> explaining how you can help build this idea.
            </p>
            <Textarea
              label="Your Message"
              rows={4}
              value={collabMsg}
              onChange={e => setCollabMsg(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Btn variant="outline" onClick={() => setCollabItem(null)}>Cancel</Btn>
              <Btn onClick={sendCollaboration}>Send Request →</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
