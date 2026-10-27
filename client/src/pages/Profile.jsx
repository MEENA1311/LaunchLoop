import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, put } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Textarea, SectionHead, roleLabel } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Profile() {
  const nav = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [fullData, setFullData] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    education: '',
    interests: '',
    github_url: '',
    portfolio_url: '',
    expertise: '',
    industry: '',
    years_experience: 0,
    availability: '',
    sectors: '',
    stages: '',
    thesis: ''
  });

  const loadProfile = async () => {
    try {
      const data = await get('/me');
      setFullData(data);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      const prof = data.profile || {};
      setEditForm({
        name: data.name || '',
        bio: prof.bio || '',
        education: prof.education || '',
        interests: prof.interests || '',
        github_url: prof.github_url || '',
        portfolio_url: prof.portfolio_url || '',
        expertise: prof.expertise || '',
        industry: prof.industry || '',
        years_experience: prof.years_experience || 0,
        availability: prof.availability || '',
        sectors: prof.sectors || '',
        stages: prof.stages || '',
        thesis: prof.thesis || ''
      });
    } catch {}
  };

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      await put('/me/profile', editForm);
      toast.success('Your ecosystem profile has been updated!');
      setEditOpen(false);
      loadProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    }
  }

  function handleLogout() {
    localStorage.clear();
    toast.info('Signed out');
    nav('/login', { replace: true });
  }

  const role = user.role || 'student';
  const prof = fullData?.profile || {};

  return (
    <div className="page">
      <Toolbar
        eyebrow="USER IDENTITY & CREDENTIALS"
        title="Professional Profile"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn onClick={() => setEditOpen(true)}>
              ✎ Edit Profile
            </Btn>
            <Btn
              variant="outline"
              style={{ color: '#e45454', borderColor: '#f2cccc' }}
              onClick={handleLogout}
            >
              Sign Out ⎋
            </Btn>
          </div>
        }
      />

      <div className="profile-grid">
        {/* Main Profile Dossier */}
        <Card className="profile-card">
          <div className="profile-cover" />
          <div className="profile-body">
            <div className="profile-actions">
              <Btn variant="soft" onClick={() => setEditOpen(true)}>
                Edit Profile
              </Btn>
            </div>

            <div className="profile-avatar">{user.name?.[0] || 'U'}</div>
            <h2>{user.name}</h2>
            <div className="profile-role">
              {roleLabel(role)} · {user.email}
            </div>

            <p>
              {prof.bio || prof.expertise || prof.thesis ||
                'Active participant in the LaunchLoop innovation collaboration ecosystem.'}
            </p>

            <div className="profile-tags">
              <Pill tone={user.verified ? 'success' : 'warning'}>
                {user.verified ? '✓ Verified Credential' : 'Verification Pending'}
              </Pill>
              <Pill>Platform ID: #{user.id}</Pill>
              <Pill>{roleLabel(role)}</Pill>
            </div>

            {/* Role specific detail cards */}
            <div className="profile-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px' }}>
              <div>
                <span>Account Role</span>
                <b>{roleLabel(role)}</b>
              </div>
              <div>
                <span>Ecosystem Status</span>
                <b style={{ color: user.verified ? '#19a875' : '#f49a39' }}>
                  {user.verified ? 'Verified Active' : 'Under Review'}
                </b>
              </div>
              <div>
                <span>Workspace</span>
                <b>LaunchLoop Hub</b>
              </div>
            </div>

            {role === 'student' && (
              <div style={{ marginTop: '20px', background: '#f8f9fc', padding: '15px', borderRadius: '10px' }}>
                <b style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Student Profile Details</b>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                  <div><span className="muted">Education:</span> <b>{prof.education || 'Undergraduate Engineering'}</b></div>
                  <div><span className="muted">Interests:</span> <b>{prof.interests || 'AI, Web3, Distributed Systems'}</b></div>
                  <div><span className="muted">GitHub:</span> <b>{prof.github_url || 'https://github.com'}</b></div>
                  <div><span className="muted">Portfolio:</span> <b>{prof.portfolio_url || 'https://portfolio.dev'}</b></div>
                </div>
              </div>
            )}

            {role === 'mentor' && (
              <div style={{ marginTop: '20px', background: '#f8f9fc', padding: '15px', borderRadius: '10px' }}>
                <b style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Advisory Focus</b>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                  <div><span className="muted">Industry:</span> <b>{prof.industry || 'Technology'}</b></div>
                  <div><span className="muted">Experience:</span> <b>{prof.years_experience || 8} Years</b></div>
                  <div><span className="muted">Availability:</span> <b>{prof.availability || 'Weekends & Evenings'}</b></div>
                  <div><span className="muted">Preferred Stages:</span> <b>{prof.preferred_stages || 'MVP, Seed'}</b></div>
                </div>
              </div>
            )}

            {role === 'investor' && (
              <div style={{ marginTop: '20px', background: '#f8f9fc', padding: '15px', borderRadius: '10px' }}>
                <b style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>Investment Thesis</b>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                  <div><span className="muted">Target Sectors:</span> <b>{prof.sectors || 'AI, SaaS, FinTech'}</b></div>
                  <div><span className="muted">Target Stages:</span> <b>{prof.stages || 'Validation, MVP, Traction'}</b></div>
                  <div style={{ gridColumn: '1 / -1' }}><span className="muted">Thesis:</span> <b>{prof.thesis || 'Backing university founders with high technical moat.'}</b></div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Security & Access Card */}
        <Card>
          <SectionHead
            eyebrow="SECURITY & ACCESS"
            title="Account Governance"
          />

          <div style={{ padding: '0 20px 20px', display: 'grid', gap: '14px' }}>
            <div>
              <small className="muted">Authentication Email</small>
              <b style={{ display: 'block', fontSize: '12px' }}>{user.email}</b>
            </div>

            <div>
              <small className="muted">Password</small>
              <b style={{ display: 'block', fontSize: '12px' }}>••••••••••••</b>
              <button
                type="button"
                className="text-btn"
                style={{ marginTop: '4px' }}
                onClick={() => toast.info('Default demo password: "password". Password change is active.')}
              >
                Change password
              </button>
            </div>

            <div style={{ borderTop: '1px solid #edf0f4', paddingTop: '15px' }}>
              <small className="muted">Session</small>
              <p style={{ margin: '3px 0 12px', fontSize: '10px', color: '#6e7e95' }}>
                Signed in securely with JWT token authentication.
              </p>
              <Btn
                variant="outline"
                style={{ width: '100%', color: '#e45454', borderColor: '#f2cccc' }}
                onClick={handleLogout}
              >
                Sign Out of Platform
              </Btn>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <Modal
          eyebrow="PROFILE UPDATE"
          title="Edit Profile Information"
          close={() => setEditOpen(false)}
          maxWidth={640}
        >
          <form className="modal-form" onSubmit={handleSaveProfile}>
            <Input
              label="Full Name"
              required
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            />

            <Textarea
              label="Professional Bio / Headline"
              rows={3}
              value={role === 'student' ? editForm.bio : (role === 'mentor' ? editForm.expertise : editForm.thesis)}
              onChange={e => {
                const val = e.target.value;
                if (role === 'student') setEditForm({ ...editForm, bio: val });
                else if (role === 'mentor') setEditForm({ ...editForm, expertise: val });
                else setEditForm({ ...editForm, thesis: val });
              }}
            />

            {role === 'student' && (
              <>
                <div className="form-row">
                  <Input
                    label="Education / Degree"
                    value={editForm.education}
                    onChange={e => setEditForm({ ...editForm, education: e.target.value })}
                  />
                  <Input
                    label="Technical Interests"
                    value={editForm.interests}
                    onChange={e => setEditForm({ ...editForm, interests: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <Input
                    label="GitHub Profile URL"
                    value={editForm.github_url}
                    onChange={e => setEditForm({ ...editForm, github_url: e.target.value })}
                  />
                  <Input
                    label="Portfolio / Website URL"
                    value={editForm.portfolio_url}
                    onChange={e => setEditForm({ ...editForm, portfolio_url: e.target.value })}
                  />
                </div>
              </>
            )}

            {role === 'mentor' && (
              <div className="form-row">
                <Input
                  label="Industry Domain"
                  value={editForm.industry}
                  onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                />
                <Input
                  label="Years of Experience"
                  type="number"
                  value={editForm.years_experience}
                  onChange={e => setEditForm({ ...editForm, years_experience: Number(e.target.value) })}
                />
              </div>
            )}

            {role === 'investor' && (
              <div className="form-row">
                <Input
                  label="Target Sectors"
                  value={editForm.sectors}
                  onChange={e => setEditForm({ ...editForm, sectors: e.target.value })}
                />
                <Input
                  label="Target Stages"
                  value={editForm.stages}
                  onChange={e => setEditForm({ ...editForm, stages: e.target.value })}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setEditOpen(false)}>Cancel</Btn>
              <Btn type="submit">Save Profile Changes →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
