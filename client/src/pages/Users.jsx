import React, { useEffect, useState } from 'react';
import { get, patch, del } from '../api';
import { Card, Btn, Pill, Toolbar, Select, Empty, relative, roleLabel } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Users() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');

  const loadUsers = () => {
    get('/users')
      .then(setUsers)
      .catch(err => toast.error('Failed to load users: ' + err.message));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  async function toggleVerify(u) {
    try {
      const res = await patch(`/users/${u.id}/verify`, {});
      toast.success(`Verification status for ${u.name} updated to ${res.verified ? 'Verified' : 'Unverified'}`);
      setUsers(users.map(x => x.id === u.id ? { ...x, verified: res.verified } : x));
    } catch (err) {
      toast.error('Failed to toggle verification: ' + err.message);
    }
  }

  async function changeRole(userId, newRole) {
    try {
      await patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`User role changed to ${newRole}`);
      setUsers(users.map(x => x.id === userId ? { ...x, role: newRole } : x));
    } catch (err) {
      toast.error('Failed to change role');
    }
  }

  async function handleDelete(u) {
    if (u.id === currentUser.id) {
      return toast.error('You cannot delete your own active admin account');
    }
    if (!window.confirm(`Are you sure you want to delete user "${u.name}"?`)) return;

    try {
      await del(`/users/${u.id}`);
      toast.info(`User ${u.name} deleted`);
      setUsers(users.filter(x => x.id !== u.id));
    } catch (err) {
      toast.error('Failed to delete user');
    }
  }

  const roles = ['student', 'mentor', 'startup', 'investor', 'incubator', 'admin'];

  const filtered = users.filter(u => {
    if (roleFilter === 'All') return true;
    return u.role === roleFilter;
  });

  return (
    <div className="page">
      <Toolbar
        eyebrow="PLATFORM GOVERNANCE"
        title="User Accounts & Identity Verification"
        action={
          <Pill tone="success">
            {users.filter(u => u.verified).length} / {users.length} Verified
          </Pill>
        }
      />

      <div className="filterbar">
        <div className="field">
          <span>Filter Role</span>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="All">All Roles ({users.length})</option>
            {roles.map(r => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <div className="user-table">
          <div className="user-row head">
            <span>USER</span>
            <span>EMAIL</span>
            <span>ROLE</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>

          {filtered.map(u => (
            <div className="user-row" key={u.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="tiny-avatar">{u.name[0]}</span>
                <div>
                  <b>{u.name}</b>
                  <small style={{ color: '#8c98a9' }}>ID #{u.id} · {relative(u.created_at)}</small>
                </div>
              </div>

              <span>{u.email}</span>

              <div>
                <select
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value)}
                  style={{ fontSize: '8px', padding: '3px 6px' }}
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <Pill tone={u.verified ? 'success' : 'warning'}>
                  {u.verified ? 'Verified' : 'Pending'}
                </Pill>
              </div>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => toggleVerify(u)}
                  style={{ background: u.verified ? '#fff2df' : '#e6f8f0', color: u.verified ? '#d97d1e' : '#158b61' }}
                >
                  {u.verified ? 'Revoke' : 'Approve'}
                </button>
                {u.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    style={{ background: '#fff0f0', color: '#e45454' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {!filtered.length && (
            <Empty
              title="No users match this filter"
              text="User accounts created in the portal will appear here."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
