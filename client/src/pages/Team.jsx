import React, { useEffect, useState } from 'react';
import { get, post, del } from '../api';
import { Card, Btn, Pill, Toolbar, Select, Empty } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Team() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [startups, setStartups] = useState([]);
  const [selectedStartupId, setSelectedStartupId] = useState(1);
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState({
    user_id: '',
    member_role: 'Co-founder'
  });

  const loadStartups = async () => {
    try {
      const s = await get('/startups');
      setStartups(s);
      if (s.length) {
        setSelectedStartupId(s[0].id);
        loadMembers(s[0].id);
      }
    } catch {}
  };

  const loadMembers = async sId => {
    try {
      const data = await get(`/startups/${sId}/members`);
      setMembers(data);
    } catch (err) {
      toast.error('Failed to load team members');
    }
  };

  useEffect(() => {
    loadStartups();
    get('/users').then(setAllUsers).catch(() => {});
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.user_id) return;
    try {
      await post(`/startups/${selectedStartupId}/members`, form);
      toast.success('Member added to startup team!');
      setAddOpen(false);
      loadMembers(selectedStartupId);
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    }
  }

  async function handleRemove(userId) {
    try {
      await del(`/startups/${selectedStartupId}/members/${userId}`);
      toast.info('Team member removed');
      loadMembers(selectedStartupId);
    } catch (err) {
      toast.error('Failed to remove member');
    }
  }

  return (
    <div className="page">
      <Toolbar
        eyebrow="TEAM GOVERNANCE"
        title="Startup Team & Cap Roster"
        action={
          <Btn onClick={() => setAddOpen(true)}>
            ＋ Invite Member
          </Btn>
        }
      />

      <div className="filterbar">
        <div className="field">
          <span>Active Startup</span>
          <select
            value={selectedStartupId}
            onChange={e => {
              setSelectedStartupId(Number(e.target.value));
              loadMembers(Number(e.target.value));
            }}
          >
            {startups.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.stage})</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <div className="team-table">
          <div className="team-row head">
            <span>TEAM MEMBER</span>
            <span>EMAIL</span>
            <span>ROLE IN STARTUP</span>
            <span>ACTIONS</span>
          </div>

          {members.map(m => (
            <div className="team-row" key={m.user_id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span className="tiny-avatar">{m.name[0]}</span>
                <div>
                  <b>{m.name}</b>
                  <span style={{ fontSize: '8px', color: '#8898aa' }}>{m.role}</span>
                </div>
              </div>

              <span>{m.email}</span>

              <div>
                <Pill tone={m.member_role === 'Founder' ? 'success' : ''}>
                  {m.member_role}
                </Pill>
              </div>

              <div>
                {m.member_role !== 'Founder' ? (
                  <button
                    type="button"
                    style={{ color: '#e45454' }}
                    onClick={() => handleRemove(m.user_id)}
                  >
                    Remove
                  </button>
                ) : (
                  <small className="muted">Primary Owner</small>
                )}
              </div>
            </div>
          ))}

          {!members.length && (
            <Empty
              title="No team members assigned"
              text="Add founders and contributors to make your venture team investor-ready."
              action={<Btn onClick={() => setAddOpen(true)}>Invite First Member</Btn>}
            />
          )}
        </div>
      </Card>

      {/* Invite Member Modal */}
      {addOpen && (
        <Modal
          eyebrow="TEAM INVITATION"
          title="Add Member to Startup"
          close={() => setAddOpen(false)}
        >
          <form className="modal-form" onSubmit={handleAdd}>
            <Select
              label="Select User"
              required
              value={form.user_id}
              onChange={e => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="">-- Choose platform participant --</option>
              {allUsers.filter(u => !members.some(m => m.user_id === u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
              ))}
            </Select>

            <Select
              label="Assigned Role"
              value={form.member_role}
              onChange={e => setForm({ ...form, member_role: e.target.value })}
            >
              <option value="Co-founder">Co-founder</option>
              <option value="Chief Technology Officer">Chief Technology Officer (CTO)</option>
              <option value="Product Lead">Product Lead</option>
              <option value="Fullstack Engineer">Fullstack Engineer</option>
              <option value="Advisor">Advisor</option>
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setAddOpen(false)}>Cancel</Btn>
              <Btn type="submit">Add Member</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
