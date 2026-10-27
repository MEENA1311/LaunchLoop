import React, { useEffect, useState } from 'react';
import { get, post, patch, del } from '../api';
import { Card, Btn, Pill, Toolbar, Input, Select, Textarea, Empty, SectionHead } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function Projects() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'members' | 'milestones'

  // Sub-data for selected project
  const [issues, setIssues] = useState([]);
  const [members, setMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Modals
  const [createProjOpen, setCreateProjOpen] = useState(false);
  const [addIssueOpen, setAddIssueOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);

  // Forms
  const [projForm, setProjForm] = useState({ name: '', description: '', domain: 'Technology' });
  const [issueForm, setIssueForm] = useState({ title: '', description: '', issue_type: 'Task', priority: 'Medium', assignee_id: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', member_role: 'Contributor' });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', due_date: '', status: 'Planned' });

  const loadProjects = async (selectId = null) => {
    try {
      const data = await get('/projects');
      setProjects(data);
      if (data.length) {
        const target = selectId ? data.find(p => p.id === selectId) : (selected || data[0]);
        if (target) openProject(target);
      } else {
        setSelected(null);
      }
    } catch (err) {
      toast.error('Failed to load projects: ' + err.message);
    }
  };

  const openProject = async project => {
    setSelected(project);
    try {
      const [issueData, memberData, milestoneData] = await Promise.all([
        get(`/projects/${project.id}/issues`),
        get(`/projects/${project.id}/members`),
        get(`/projects/${project.id}/milestones`)
      ]);
      setIssues(issueData);
      setMembers(memberData);
      setMilestones(milestoneData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
    get('/users').then(setAllUsers).catch(() => {});
  }, []);

  async function handleCreateProject(e) {
    e.preventDefault();
    try {
      const res = await post('/projects', projForm);
      toast.success('New project workspace created!');
      setCreateProjOpen(false);
      setProjForm({ name: '', description: '', domain: 'Technology' });
      loadProjects(res.id);
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    }
  }

  async function handleCreateIssue(e) {
    e.preventDefault();
    if (!selected) return;
    try {
      await post(`/projects/${selected.id}/issues`, {
        ...issueForm,
        assignee_id: issueForm.assignee_id || currentUser.id
      });
      toast.success('Issue added to board!');
      setAddIssueOpen(false);
      setIssueForm({ title: '', description: '', issue_type: 'Task', priority: 'Medium', assignee_id: '' });
      openProject(selected);
    } catch (err) {
      toast.error(err.message || 'Failed to add issue');
    }
  }

  async function updateIssueStatus(issueId, status) {
    try {
      await patch(`/issues/${issueId}`, { status });
      setIssues(issues.map(i => i.id === issueId ? { ...i, status } : i));
      toast.success(`Issue moved to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  }

  async function deleteIssue(issueId) {
    try {
      await del(`/issues/${issueId}`);
      setIssues(issues.filter(i => i.id !== issueId));
      toast.info('Issue deleted');
    } catch (err) {
      toast.error('Failed to delete issue');
    }
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!selected || !memberForm.user_id) return;
    try {
      await post(`/projects/${selected.id}/members`, memberForm);
      toast.success('Team member added to project!');
      setAddMemberOpen(false);
      openProject(selected);
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    }
  }

  async function handleAddMilestone(e) {
    e.preventDefault();
    if (!selected) return;
    try {
      await post(`/projects/${selected.id}/milestones`, milestoneForm);
      toast.success('Milestone added!');
      setAddMilestoneOpen(false);
      setMilestoneForm({ title: '', due_date: '', status: 'Planned' });
      openProject(selected);
    } catch (err) {
      toast.error(err.message || 'Failed to add milestone');
    }
  }

  async function updateMilestoneStatus(id, status) {
    try {
      await patch(`/milestones/${id}`, { status });
      setMilestones(milestones.map(m => m.id === id ? { ...m, status } : m));
      toast.success(`Milestone updated to ${status}`);
    } catch (err) {
      toast.error('Failed to update milestone');
    }
  }

  const columns = ['Backlog', 'In Progress', 'Review', 'Completed'];

  return (
    <div className="page">
      <Toolbar
        eyebrow="COLLABORATIVE EXECUTION"
        title="Project Workspaces"
        action={
          <Btn onClick={() => setCreateProjOpen(true)}>
            ＋ Create Project
          </Btn>
        }
      />

      <div className="project-layout">
        {/* Project Selector Sidebar */}
        <div className="project-list">
          {projects.map(p => (
            <Card
              key={p.id}
              className={`project-tile ${selected?.id === p.id ? 'selected' : ''}`}
            >
              <button
                type="button"
                className="project-tile-inner"
                onClick={() => openProject(p)}
              >
                <div className="project-logo">{p.name[0]}</div>
                <div className="project-main">
                  <div className="project-title">
                    <h3>{p.name}</h3>
                    <Pill tone="success">{p.status}</Pill>
                  </div>
                  <p>{p.description || 'Active collaborative workspace.'}</p>
                  <div className="project-info">
                    <span>◈ {p.domain}</span>
                    <span>♧ {p.members || 1} members</span>
                    <span>▣ {p.issues || 0} tasks</span>
                  </div>
                </div>
              </button>
            </Card>
          ))}

          {!projects.length && (
            <Empty
              title="No projects active"
              text="Create a project to start tracking issues and collaborating."
              action={<Btn onClick={() => setCreateProjOpen(true)}>Create Project</Btn>}
            />
          )}
        </div>

        {/* Selected Project Workspace */}
        <Card className="workspace-card">
          {selected ? (
            <>
              <div className="workspace-head">
                <div>
                  <span className="eyebrow">PROJECT #{selected.id} · {selected.domain}</span>
                  <h2>{selected.name}</h2>
                  <p>{selected.description || 'Collaborative team repository and issue workspace.'}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Pill tone="success">Owner: {selected.owner_name}</Pill>
                  {activeTab === 'board' && (
                    <Btn onClick={() => setAddIssueOpen(true)}>
                      ＋ Add Issue
                    </Btn>
                  )}
                  {activeTab === 'members' && (
                    <Btn onClick={() => setAddMemberOpen(true)}>
                      ＋ Invite Member
                    </Btn>
                  )}
                  {activeTab === 'milestones' && (
                    <Btn onClick={() => setAddMilestoneOpen(true)}>
                      ＋ Add Milestone
                    </Btn>
                  )}
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="workspace-tabs">
                <button
                  type="button"
                  className={activeTab === 'board' ? 'active' : ''}
                  onClick={() => setActiveTab('board')}
                >
                  ▣ Issue Board ({issues.length})
                </button>
                <button
                  type="button"
                  className={activeTab === 'members' ? 'active' : ''}
                  onClick={() => setActiveTab('members')}
                >
                  ♧ Team Members ({members.length})
                </button>
                <button
                  type="button"
                  className={activeTab === 'milestones' ? 'active' : ''}
                  onClick={() => setActiveTab('milestones')}
                >
                  ◷ Milestones ({milestones.length})
                </button>
              </div>

              {/* TAB 1: KANBAN BOARD */}
              {activeTab === 'board' && (
                <div className="issue-board" style={{ padding: '20px' }}>
                  <div className="kanban">
                    {columns.map(st => {
                      const colIssues = issues.filter(x => x.status === st);
                      return (
                        <div className="kanban-col" key={st}>
                          <div className="kanban-head">
                            <b>{st}</b>
                            <Pill>{colIssues.length}</Pill>
                          </div>

                          {colIssues.map(issue => (
                            <div className="issue-card" key={issue.id}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span className="issue-label" style={{ color: issue.priority === 'High' ? '#e45454' : '#2d7ff9' }}>
                                  {issue.issue_type} · {issue.priority}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteIssue(issue.id)}
                                  style={{ border: 0, background: 'none', color: '#999', cursor: 'pointer', fontSize: '13px' }}
                                  title="Delete task"
                                >
                                  ×
                                </button>
                              </div>

                              <b>{issue.title}</b>
                              {issue.description && <p style={{ fontSize: '9px', color: '#66748a', margin: '4px 0' }}>{issue.description}</p>}
                              
                              <small>
                                Assignee: {issue.assignee_name || 'Unassigned'}
                              </small>

                              <div style={{ marginTop: '8px' }}>
                                <select
                                  value={issue.status}
                                  onChange={e => updateIssueStatus(issue.id, e.target.value)}
                                >
                                  {columns.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}

                          {!colIssues.length && (
                            <small className="muted" style={{ display: 'block', textAlign: 'center', padding: '15px 0' }}>
                              No {st.toLowerCase()} tasks
                            </small>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TEAM MEMBERS */}
              {activeTab === 'members' && (
                <div style={{ padding: '20px' }}>
                  <div className="team-table">
                    <div className="team-row head">
                      <span>MEMBER</span>
                      <span>EMAIL</span>
                      <span>ROLE IN PROJECT</span>
                      <span>ACTIONS</span>
                    </div>

                    {members.map(m => (
                      <div className="team-row" key={m.user_id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="tiny-avatar">{m.name[0]}</span>
                          <b>{m.name}</b>
                        </div>
                        <span>{m.email}</span>
                        <Pill tone={m.member_role === 'Owner' ? 'success' : ''}>{m.member_role}</Pill>
                        <div>
                          {m.member_role !== 'Owner' && (
                            <button
                              type="button"
                              onClick={() => toast.info('Member management active')}
                            >
                              Manage
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: MILESTONES */}
              {activeTab === 'milestones' && (
                <div style={{ padding: '20px' }}>
                  <div className="workflow-table">
                    {milestones.map(m => (
                      <div className="workflow-table-row" key={m.id}>
                        <div>
                          <b>{m.title}</b>
                          <span>Target Due Date: {m.due_date ? new Date(m.due_date).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        <Pill tone={m.status === 'Completed' ? 'success' : (m.status === 'In Progress' ? 'warning' : '')}>
                          {m.status}
                        </Pill>
                        <select
                          value={m.status}
                          onChange={e => updateMilestoneStatus(m.id, e.target.value)}
                        >
                          <option value="Planned">Planned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    ))}

                    {!milestones.length && (
                      <Empty
                        title="No milestones planned yet"
                        text="Add project delivery milestones to track progress towards an MVP."
                        action={<Btn onClick={() => setAddMilestoneOpen(true)}>Add First Milestone</Btn>}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="workspace-empty">
              <div>
                <div className="empty-art">▣</div>
                <h3>Select a Project</h3>
                <p>Choose an active project on the left to inspect tasks, members, and milestones.</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create Project Modal */}
      {createProjOpen && (
        <Modal
          eyebrow="COLLABORATION WORKSPACE"
          title="Create a Collaborative Project"
          close={() => setCreateProjOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreateProject}>
            <Input
              label="Project Name"
              required
              placeholder="e.g. SkillBridge AI Engine"
              value={projForm.name}
              onChange={e => setProjForm({ ...projForm, name: e.target.value })}
            />
            <Textarea
              label="Project Description"
              rows={3}
              placeholder="What are the goals, technical scope, and deliverables?"
              value={projForm.description}
              onChange={e => setProjForm({ ...projForm, description: e.target.value })}
            />
            <Select
              label="Domain / Sector"
              value={projForm.domain}
              onChange={e => setProjForm({ ...projForm, domain: e.target.value })}
            >
              <option value="Technology">Technology & Software</option>
              <option value="EdTech">EdTech</option>
              <option value="FinTech">FinTech</option>
              <option value="HealthTech">HealthTech</option>
              <option value="AI / ML">AI / Machine Learning</option>
              <option value="CleanTech">CleanTech</option>
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setCreateProjOpen(false)}>Cancel</Btn>
              <Btn type="submit">Create Workspace →</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Issue Modal */}
      {addIssueOpen && (
        <Modal
          eyebrow="KANBAN TASK"
          title={`Add Task to ${selected?.name}`}
          close={() => setAddIssueOpen(false)}
        >
          <form className="modal-form" onSubmit={handleCreateIssue}>
            <Input
              label="Task Title"
              required
              placeholder="e.g. Implement JWT authentication flow"
              value={issueForm.title}
              onChange={e => setIssueForm({ ...issueForm, title: e.target.value })}
            />
            <Textarea
              label="Description / Acceptance Criteria"
              rows={2}
              placeholder="Details or checklist for this task"
              value={issueForm.description}
              onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
            />
            <div className="form-row">
              <Select
                label="Type"
                value={issueForm.issue_type}
                onChange={e => setIssueForm({ ...issueForm, issue_type: e.target.value })}
              >
                <option value="Task">Task</option>
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Research">Research</option>
              </Select>
              <Select
                label="Priority"
                value={issueForm.priority}
                onChange={e => setIssueForm({ ...issueForm, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </Select>
            </div>

            <Select
              label="Assignee"
              value={issueForm.assignee_id}
              onChange={e => setIssueForm({ ...issueForm, assignee_id: e.target.value })}
            >
              <option value="">Assign to Me ({currentUser.name})</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.name} ({m.member_role})</option>
              ))}
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setAddIssueOpen(false)}>Cancel</Btn>
              <Btn type="submit">Add Task →</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Invite Member Modal */}
      {addMemberOpen && (
        <Modal
          eyebrow="TEAM FORMATION"
          title={`Add Member to ${selected?.name}`}
          close={() => setAddMemberOpen(false)}
        >
          <form className="modal-form" onSubmit={handleAddMember}>
            <Select
              label="Select User to Invite"
              required
              value={memberForm.user_id}
              onChange={e => setMemberForm({ ...memberForm, user_id: e.target.value })}
            >
              <option value="">-- Choose student or collaborator --</option>
              {allUsers.filter(u => !members.some(m => m.user_id === u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>
              ))}
            </Select>

            <Select
              label="Role in Project"
              value={memberForm.member_role}
              onChange={e => setMemberForm({ ...memberForm, member_role: e.target.value })}
            >
              <option value="Contributor">Contributor</option>
              <option value="Tech Lead">Tech Lead</option>
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="Backend Engineer">Backend Engineer</option>
              <option value="Product Designer">Product Designer</option>
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Btn>
              <Btn type="submit">Add to Project</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Milestone Modal */}
      {addMilestoneOpen && (
        <Modal
          eyebrow="ROADMAP"
          title={`Add Milestone for ${selected?.name}`}
          close={() => setAddMilestoneOpen(false)}
        >
          <form className="modal-form" onSubmit={handleAddMilestone}>
            <Input
              label="Milestone Title"
              required
              placeholder="e.g. Deliver functional alpha demo"
              value={milestoneForm.title}
              onChange={e => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
            />
            <Input
              label="Target Due Date"
              type="date"
              value={milestoneForm.due_date}
              onChange={e => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setAddMilestoneOpen(false)}>Cancel</Btn>
              <Btn type="submit">Save Milestone</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
