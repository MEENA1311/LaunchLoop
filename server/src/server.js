import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import http from 'http';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { query, testDatabase } from './db.js';
import { auth, allow } from './auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage with original file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Serve client dist in production if it exists
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Audit logging helper
async function logAudit(userId, action, entityType = null, entityId = null) {
  try {
    await query(
      `INSERT INTO audit_logs(user_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [userId || null, action, entityType, entityId || null]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

// Notification helper
async function notify(userId, title, message, type = 'system') {
  try {
    const r = await query(
      `INSERT INTO notifications(user_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())`,
      [userId, title, message, type]
    );
    io.emit(`notify:${userId}`, { id: r.insertId, user_id: userId, title, message, type, created_at: new Date().toISOString() });
    return r.insertId;
  } catch (err) {
    console.error('Notify failed:', err.message);
  }
}

// -------------------------------------------------------------
// 1. SYSTEM & HEALTH
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'startup-innovation-portal',
    databaseDriver: getDbType(),
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// 2. AUTHENTICATION & PROFILES
// -------------------------------------------------------------
app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  console.log('LOGIN:', email);

  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required'
    });
  }

  const rows = await query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.password_hash,
      u.verified,
      r.name AS role
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE LOWER(TRIM(u.email)) = ?
    LIMIT 1
    `,
    [email]
  );

  console.log('USER FOUND:', rows.length);

  if (!rows.length) {
    return res.status(401).json({
      message: 'Invalid email or password'
    });
  }

  const user = rows[0];

  console.log('ROLE:', user.role);
  console.log('HASH EXISTS:', !!user.password_hash);

  const validPassword = await bcrypt.compare(
    password,
    user.password_hash
  );

  console.log('PASSWORD VALID:', validPassword);

  if (!validPassword) {
    return res.status(401).json({
      message: 'Invalid email or password'
    });
  }

  const role = user.role || 'student';

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role
    },
    process.env.JWT_SECRET || 'startup-portal-review-secret',
    {
      expiresIn: '8h'
    }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      verified: user.verified
    }
  });
}));
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, password, role = 'student', headline = '' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existing = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing.length) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const roleRows = await query('SELECT id FROM roles WHERE name = ?', [role.toLowerCase()]);
  const roleId = roleRows.length ? roleRows[0].id : 1;

  const passwordHash = await bcrypt.hash(password, 10);
  const r = await query(
    `INSERT INTO users(role_id, name, email, password_hash, verified, created_at) VALUES (?, ?, ?, ?, 1, NOW())`,
    [roleId, name.trim(), email.trim().toLowerCase(), passwordHash]
  );
  const newUserId = r.insertId;

  // Create role-specific profile record
  if (role === 'student') {
    await query(`INSERT INTO student_profiles(user_id, bio, education, interests) VALUES (?, ?, ?, ?)`,
      [newUserId, headline || 'Ecosystem builder', 'Undergraduate', 'Startups, Engineering']);
  } else if (role === 'mentor') {
    await query(`INSERT INTO mentor_profiles(user_id, expertise, industry, years_experience, availability) VALUES (?, ?, ?, ?, ?)`,
      [newUserId, headline || 'Product & Tech Advisor', 'Technology', 5, 'Flexible']);
  } else if (role === 'investor') {
    await query(`INSERT INTO investor_profiles(user_id, sectors, stages, min_ticket, max_ticket, thesis) VALUES (?, ?, ?, ?, ?, ?)`,
      [newUserId, 'SaaS, AI, EdTech', 'MVP, Traction', 25000, 2000000, 'Back early builders solving real problems']);
  } else if (role === 'incubator') {
    await query(`INSERT INTO incubators(user_id, name, description, location, verified) VALUES (?, ?, ?, ?, 1)`,
      [newUserId, name, 'Founder innovation lab & incubation ecosystem', 'Campus', 1]);
  }

  await notify(newUserId, 'Welcome to LaunchLoop!', 'Your professional ecosystem account has been created.', 'system');
  await logAudit(newUserId, 'New account registered', 'User', newUserId);

  const token = jwt.sign(
    { id: newUserId, name, email, role },
    process.env.JWT_SECRET || 'launchloop-super-secure-jwt-secret-2026',
    { expiresIn: '24h' }
  );

  res.status(201).json({
    token,
    user: {
      id: newUserId,
      name,
      email,
      role,
      verified: true
    }
  });
}));

app.get('/api/me', auth, asyncRoute(async (req, res) => {
  const users = await query(
    `SELECT u.id, u.name, u.email, r.name as role, u.verified, u.avatar, u.created_at
     FROM users u 
     JOIN roles r ON r.id = u.role_id 
     WHERE u.id = ?`,
    [req.user.id]
  );

  if (!users.length) {
    return res.status(404).json({ message: 'User not found' });
  }

  const u = users[0];
  let profile = {};

  if (u.role === 'student') {
    const sp = await query('SELECT * FROM student_profiles WHERE user_id = ?', [u.id]);
    profile = sp[0] || {};
  } else if (u.role === 'mentor') {
    const mp = await query('SELECT * FROM mentor_profiles WHERE user_id = ?', [u.id]);
    profile = mp[0] || {};
  } else if (u.role === 'investor') {
    const ip = await query('SELECT * FROM investor_profiles WHERE user_id = ?', [u.id]);
    profile = ip[0] || {};
  } else if (u.role === 'incubator') {
    const inc = await query('SELECT * FROM incubators WHERE user_id = ?', [u.id]);
    profile = inc[0] || {};
  }

  res.json({ ...u, verified: Boolean(u.verified), profile });
}));

app.put('/api/me/profile', auth, asyncRoute(async (req, res) => {
  const { name, bio, education, interests, github_url, portfolio_url, expertise, industry, years_experience, availability, sectors, stages, thesis } = req.body;

  if (name) {
    await query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
  }

  if (req.user.role === 'student') {
    const exists = await query('SELECT user_id FROM student_profiles WHERE user_id = ?', [req.user.id]);
    if (exists.length) {
      await query(
        `UPDATE student_profiles SET bio = ?, education = ?, interests = ?, github_url = ?, portfolio_url = ? WHERE user_id = ?`,
        [bio || '', education || '', interests || '', github_url || '', portfolio_url || '', req.user.id]
      );
    } else {
      await query(
        `INSERT INTO student_profiles(user_id, bio, education, interests, github_url, portfolio_url) VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, bio || '', education || '', interests || '', github_url || '', portfolio_url || '']
      );
    }
  } else if (req.user.role === 'mentor') {
    const exists = await query('SELECT user_id FROM mentor_profiles WHERE user_id = ?', [req.user.id]);
    if (exists.length) {
      await query(
        `UPDATE mentor_profiles SET expertise = ?, industry = ?, years_experience = ?, availability = ? WHERE user_id = ?`,
        [expertise || '', industry || '', Number(years_experience || 0), availability || '', req.user.id]
      );
    } else {
      await query(
        `INSERT INTO mentor_profiles(user_id, expertise, industry, years_experience, availability) VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, expertise || '', industry || '', Number(years_experience || 0), availability || '']
      );
    }
  } else if (req.user.role === 'investor') {
    const exists = await query('SELECT user_id FROM investor_profiles WHERE user_id = ?', [req.user.id]);
    if (exists.length) {
      await query(
        `UPDATE investor_profiles SET sectors = ?, stages = ?, thesis = ? WHERE user_id = ?`,
        [sectors || '', stages || '', thesis || '', req.user.id]
      );
    } else {
      await query(
        `INSERT INTO investor_profiles(user_id, sectors, stages, min_ticket, max_ticket, thesis) VALUES (?, ?, ?, 50000, 5000000, ?)`,
        [req.user.id, sectors || '', stages || '', thesis || '']
      );
    }
  }

  await logAudit(req.user.id, 'Updated profile', 'User', req.user.id);
  res.json({ ok: true, message: 'Profile updated successfully' });
}));

// -------------------------------------------------------------
// 3. DASHBOARD METRICS
// -------------------------------------------------------------
app.get('/api/dashboard', auth, asyncRoute(async (req, res) => {
  const counts = {};
  const queries = {
    users: 'SELECT COUNT(*) as n FROM users',
    students: "SELECT COUNT(*) as n FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'student'",
    mentors: "SELECT COUNT(*) as n FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'mentor'",
    startups: 'SELECT COUNT(*) as n FROM startups',
    projects: 'SELECT COUNT(*) as n FROM projects',
    ideas: 'SELECT COUNT(*) as n FROM ideas',
    applications: 'SELECT COUNT(*) as n FROM incubation_applications',
    deals: 'SELECT COUNT(*) as n FROM deals',
    challenges: 'SELECT COUNT(*) as n FROM challenges',
    mentorships: 'SELECT COUNT(*) as n FROM mentorship_requests WHERE status = "Accepted"',
    unread_notifications: `SELECT COUNT(*) as n FROM notifications WHERE user_id = ${req.user.id} AND is_read = 0`
  };

  for (const [k, sql] of Object.entries(queries)) {
    try {
      const r = await query(sql);
      counts[k] = Number(r[0]?.n || 0);
    } catch {
      counts[k] = 0;
    }
  }

  res.json(counts);
}));

// -------------------------------------------------------------
// 4. IDEA LAB & CONVERSION WORKFLOW
// -------------------------------------------------------------
app.get('/api/ideas', auth, asyncRoute(async (req, res) => {
  let sql = `SELECT i.*, u.name as creator_name, u.email as creator_email 
             FROM ideas i 
             JOIN users u ON u.id = i.creator_id 
             WHERE 1=1`;
  const params = [];

  if (req.query.stage) {
    sql += ' AND i.stage = ?';
    params.push(req.query.stage);
  }
  if (req.query.industry) {
    sql += ' AND i.industry = ?';
    params.push(req.query.industry);
  }
  if (req.query.search) {
    sql += ' AND (i.title LIKE ? OR i.problem LIKE ? OR i.technologies LIKE ?)';
    const term = `%${req.query.search}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY i.created_at DESC';
  const rows = await query(sql, params);
  res.json(rows);
}));

app.post('/api/ideas', auth, asyncRoute(async (req, res) => {
  const { title, problem, solution, target_users, industry, technologies, stage = 'Validation', required_skills } = req.body;
  if (!title || !problem || !solution) {
    return res.status(400).json({ message: 'Title, problem statement, and solution are required.' });
  }

  const r = await query(
    `INSERT INTO ideas(creator_id, title, problem, solution, target_users, industry, technologies, stage, required_skills, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', NOW())`,
    [req.user.id, title, problem, solution, target_users || 'College students', industry || 'EdTech', technologies || 'React, Node, MySQL', stage, required_skills || 'Fullstack']
  );

  await logAudit(req.user.id, `Created idea "${title}"`, 'Idea', r.insertId);
  res.status(201).json({ id: r.insertId, message: 'Idea published successfully' });
}));

app.get('/api/ideas/:id', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT i.*, u.name as creator_name, u.email as creator_email 
     FROM ideas i 
     JOIN users u ON u.id = i.creator_id 
     WHERE i.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Idea not found' });
  res.json(rows[0]);
}));

app.post('/api/ideas/:id/convert-to-project', auth, asyncRoute(async (req, res) => {
  const ideas = await query('SELECT * FROM ideas WHERE id = ?', [req.params.id]);
  if (!ideas.length) return res.status(404).json({ message: 'Idea not found' });
  const idea = ideas[0];

  const p = await query(
    `INSERT INTO projects(owner_id, idea_id, name, description, domain, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'Active', NOW())`,
    [req.user.id, idea.id, idea.title, idea.solution || idea.problem, idea.industry || 'General']
  );
  const projectId = p.insertId;

  // Add owner to project_members
  await query(
    `INSERT INTO project_members(project_id, user_id, member_role, joined_at) VALUES (?, ?, 'Owner', NOW())`,
    [projectId, req.user.id]
  );

  // Seed default starter issues
  await query(
    `INSERT INTO project_issues(project_id, title, description, issue_type, priority, status, assignee_id, created_at)
     VALUES (?, 'Define project architecture & team roles', 'Set up initial repo and assign components', 'Task', 'High', 'Backlog', ?, NOW()),
            (?, 'Build prototype / MVP', 'Deliver core user workflow', 'Feature', 'High', 'In Progress', ?, NOW())`,
    [projectId, req.user.id, projectId, req.user.id]
  );

  await query('UPDATE ideas SET status = "In Development" WHERE id = ?', [idea.id]);
  await logAudit(req.user.id, `Converted idea #${idea.id} into project #${projectId}`, 'Project', projectId);

  res.status(201).json({ projectId, message: 'Idea converted to collaborative project!' });
}));

app.post('/api/ideas/:id/collaborate', auth, asyncRoute(async (req, res) => {
  const ideas = await query('SELECT * FROM ideas WHERE id = ?', [req.params.id]);
  if (!ideas.length) return res.status(404).json({ message: 'Idea not found' });
  const idea = ideas[0];

  const { message = 'I would like to collaborate on your idea.' } = req.body;
  await notify(idea.creator_id, 'New collaboration interest!', `${req.user.name} wants to collaborate on "${idea.title}": "${message}"`, 'collaboration');

  res.json({ ok: true, message: 'Collaboration request sent to the creator!' });
}));

// -------------------------------------------------------------
// 5. PROJECTS, KANBAN ISSUES, MEMBERS & MILESTONES
// -------------------------------------------------------------
app.get('/api/projects', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as members,
      (SELECT COUNT(*) FROM project_issues pi WHERE pi.project_id = p.id) as issues
     FROM projects p 
     JOIN users u ON u.id = p.owner_id 
     ORDER BY p.created_at DESC`
  );
  res.json(rows);
}));

app.post('/api/projects', auth, asyncRoute(async (req, res) => {
  const { name, description, domain, idea_id = null } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });

  const r = await query(
    `INSERT INTO projects(owner_id, idea_id, name, description, domain, status, created_at) VALUES (?, ?, ?, ?, ?, 'Active', NOW())`,
    [req.user.id, idea_id, name, description || '', domain || 'Technology']
  );
  const projectId = r.insertId;

  await query(
    `INSERT INTO project_members(project_id, user_id, member_role, joined_at) VALUES (?, ?, 'Owner', NOW())`,
    [projectId, req.user.id]
  );

  await logAudit(req.user.id, `Created project "${name}"`, 'Project', projectId);
  res.status(201).json({ id: projectId, message: 'Project created successfully' });
}));

app.get('/api/projects/:id', auth, asyncRoute(async (req, res) => {
  const projects = await query(
    `SELECT p.*, u.name as owner_name, u.email as owner_email 
     FROM projects p 
     JOIN users u ON u.id = p.owner_id 
     WHERE p.id = ?`,
    [req.params.id]
  );
  if (!projects.length) return res.status(404).json({ message: 'Project not found' });
  res.json(projects[0]);
}));

app.get('/api/projects/:id/issues', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT i.*, u.name as assignee_name 
     FROM project_issues i 
     LEFT JOIN users u ON u.id = i.assignee_id 
     WHERE i.project_id = ? 
     ORDER BY i.created_at DESC`,
    [req.params.id]
  );
  res.json(rows);
}));

app.post('/api/projects/:id/issues', auth, asyncRoute(async (req, res) => {
  const { title, description, issue_type = 'Task', priority = 'Medium', assignee_id = null } = req.body;
  if (!title) return res.status(400).json({ message: 'Issue title is required' });

  const r = await query(
    `INSERT INTO project_issues(project_id, title, description, issue_type, priority, status, assignee_id, created_at)
     VALUES (?, ?, ?, ?, ?, 'Backlog', ?, NOW())`,
    [req.params.id, title, description || '', issue_type, priority, assignee_id || req.user.id]
  );

  if (assignee_id && assignee_id !== req.user.id) {
    await notify(assignee_id, 'New task assigned to you', `${req.user.name} assigned: "${title}"`, 'project');
  }

  res.status(201).json({ id: r.insertId, message: 'Issue added' });
}));

app.patch('/api/issues/:id', auth, asyncRoute(async (req, res) => {
  const { status, title, priority, assignee_id } = req.body;
  if (status) {
    await query('UPDATE project_issues SET status = ? WHERE id = ?', [status, req.params.id]);
  }
  if (title) {
    await query('UPDATE project_issues SET title = ? WHERE id = ?', [title, req.params.id]);
  }
  if (priority) {
    await query('UPDATE project_issues SET priority = ? WHERE id = ?', [priority, req.params.id]);
  }
  if (assignee_id !== undefined) {
    await query('UPDATE project_issues SET assignee_id = ? WHERE id = ?', [assignee_id || null, req.params.id]);
  }
  res.json({ message: 'Issue updated' });
}));

app.delete('/api/issues/:id', auth, asyncRoute(async (req, res) => {
  await query('DELETE FROM project_issues WHERE id = ?', [req.params.id]);
  res.json({ ok: true, message: 'Issue deleted' });
}));

app.get('/api/projects/:id/members', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT pm.*, u.name, u.email, r.name as role 
     FROM project_members pm 
     JOIN users u ON u.id = pm.user_id 
     JOIN roles r ON r.id = u.role_id 
     WHERE pm.project_id = ?`,
    [req.params.id]
  );
  res.json(rows);
}));

app.post('/api/projects/:id/members', auth, asyncRoute(async (req, res) => {
  const { user_id, member_role = 'Contributor' } = req.body;
  await query(
    `INSERT INTO project_members(project_id, user_id, member_role, joined_at) VALUES (?, ?, ?, NOW())`,
    [req.params.id, user_id, member_role]
  );
  await notify(user_id, 'Joined project team', `You have been added to project #${req.params.id}`, 'project');
  res.status(201).json({ ok: true });
}));

app.get('/api/projects/:id/milestones', auth, asyncRoute(async (req, res) => {
  const rows = await query('SELECT * FROM project_milestones WHERE project_id = ? ORDER BY due_date ASC', [req.params.id]);
  res.json(rows);
}));

app.post('/api/projects/:id/milestones', auth, asyncRoute(async (req, res) => {
  const { title, due_date, status = 'Planned' } = req.body;
  const r = await query(
    `INSERT INTO project_milestones(project_id, title, due_date, status) VALUES (?, ?, ?, ?)`,
    [req.params.id, title, due_date || null, status]
  );
  res.status(201).json({ id: r.insertId });
}));

app.patch('/api/milestones/:id', auth, asyncRoute(async (req, res) => {
  const { status, title, due_date } = req.body;
  if (status) await query('UPDATE project_milestones SET status = ? WHERE id = ?', [status, req.params.id]);
  if (title) await query('UPDATE project_milestones SET title = ? WHERE id = ?', [title, req.params.id]);
  if (due_date) await query('UPDATE project_milestones SET due_date = ? WHERE id = ?', [due_date, req.params.id]);
  res.json({ ok: true });
}));

// -------------------------------------------------------------
// 6. MENTORS & MENTORSHIP WORKFLOWS
// -------------------------------------------------------------
app.get('/api/mentors', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.name, u.email, m.expertise, m.industry, m.years_experience, m.availability, m.preferred_stages 
     FROM users u 
     JOIN mentor_profiles m ON m.user_id = u.id 
     ORDER BY u.name`
  );
  res.json(rows);
}));

app.post('/api/mentorship-requests', auth, asyncRoute(async (req, res) => {
  const { mentor_id, goal, startup_id } = req.body;
  if (!mentor_id || !goal) {
    return res.status(400).json({ message: 'Mentor selection and mentorship goal are required.' });
  }

  const r = await query(
    `INSERT INTO mentorship_requests(requester_id, mentor_id, goal, startup_id, status, created_at)
     VALUES (?, ?, ?, ?, 'Pending', NOW())`,
    [req.user.id, mentor_id, goal, startup_id || null]
  );

  await notify(mentor_id, 'New mentorship request', `${req.user.name} sent you a mentorship request: "${goal}"`, 'mentorship');
  await logAudit(req.user.id, `Sent mentorship request to mentor #${mentor_id}`, 'MentorshipRequest', r.insertId);

  res.status(201).json({ id: r.insertId, message: 'Mentorship request sent successfully' });
}));

app.get('/api/mentorship-requests', auth, asyncRoute(async (req, res) => {
  let sql = '';
  let params = [];
  if (req.user.role === 'mentor') {
    sql = `SELECT mr.*, u.name as requester_name, u.email as requester_email, s.name as startup_name 
           FROM mentorship_requests mr 
           JOIN users u ON u.id = mr.requester_id 
           LEFT JOIN startups s ON s.id = mr.startup_id 
           WHERE mr.mentor_id = ? 
           ORDER BY mr.created_at DESC`;
    params = [req.user.id];
  } else {
    sql = `SELECT mr.*, u.name as mentor_name, u.email as mentor_email, s.name as startup_name 
           FROM mentorship_requests mr 
           JOIN users u ON u.id = mr.mentor_id 
           LEFT JOIN startups s ON s.id = mr.startup_id 
           WHERE mr.requester_id = ? 
           ORDER BY mr.created_at DESC`;
    params = [req.user.id];
  }
  const rows = await query(sql, params);
  res.json(rows);
}));

app.patch('/api/mentorship-requests/:id', auth, asyncRoute(async (req, res) => {
  const { status } = req.body;
  await query('UPDATE mentorship_requests SET status = ? WHERE id = ?', [status, req.params.id]);

  const reqRow = (await query('SELECT * FROM mentorship_requests WHERE id = ?', [req.params.id]))[0];
  if (reqRow && status === 'Accepted') {
    // Automatically create a mentorship record
    await query('INSERT INTO mentorships(request_id, goal, progress, status) VALUES (?, ?, 10, "Active")', [reqRow.id, reqRow.goal]);
    await notify(reqRow.requester_id, 'Mentorship request accepted! 🎉', `Your mentorship request has been accepted. You can now schedule sessions.`, 'mentorship');
  } else if (reqRow && status === 'Rejected') {
    await notify(reqRow.requester_id, 'Mentorship request update', `Your mentorship request was not accepted at this time.`, 'mentorship');
  }

  res.json({ ok: true, message: `Request marked as ${status}` });
}));

app.get('/api/sessions', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT ms.*, m.goal, mr.mentor_id, mr.requester_id, 
            u1.name as mentor_name, u2.name as mentee_name 
     FROM mentorship_sessions ms 
     JOIN mentorships m ON m.id = ms.mentorship_id 
     JOIN mentorship_requests mr ON mr.id = m.request_id 
     JOIN users u1 ON u1.id = mr.mentor_id 
     JOIN users u2 ON u2.id = mr.requester_id 
     WHERE mr.mentor_id = ? OR mr.requester_id = ? 
     ORDER BY ms.scheduled_at ASC`,
    [req.user.id, req.user.id]
  );
  res.json(rows);
}));

app.post('/api/sessions', auth, asyncRoute(async (req, res) => {
  const { mentorship_id, scheduled_at, topic, notes } = req.body;
  const r = await query(
    `INSERT INTO mentorship_sessions(mentorship_id, scheduled_at, topic, notes, status) VALUES (?, ?, ?, ?, 'Scheduled')`,
    [mentorship_id || 1, scheduled_at || new Date().toISOString(), topic || 'Progress check-in', notes || '']
  );
  res.status(201).json({ id: r.insertId, message: 'Session scheduled' });
}));

app.patch('/api/sessions/:id', auth, asyncRoute(async (req, res) => {
  const { status, notes } = req.body;
  if (status) await query('UPDATE mentorship_sessions SET status = ? WHERE id = ?', [status, req.params.id]);
  if (notes !== undefined) await query('UPDATE mentorship_sessions SET notes = ? WHERE id = ?', [notes, req.params.id]);
  res.json({ ok: true });
}));

app.get('/api/evaluations', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT me.*, u.name as mentor_name, s.name as startup_name 
     FROM mentor_evaluations me 
     JOIN users u ON u.id = me.mentor_id 
     JOIN startups s ON s.id = me.startup_id 
     ORDER BY me.created_at DESC`
  );
  res.json(rows);
}));

app.post('/api/evaluations', auth, asyncRoute(async (req, res) => {
  const {
    startup_id = 1,
    problem_validation = 8,
    solution_score = 8,
    market_score = 7,
    team_score = 9,
    product_score = 8,
    business_model_score = 7,
    traction_score = 6,
    fundraising_readiness = 6,
    comments
  } = req.body;

  const r = await query(
    `INSERT INTO mentor_evaluations(mentor_id, startup_id, problem_validation, solution_score, market_score, team_score, product_score, business_model_score, traction_score, fundraising_readiness, comments, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      req.user.id,
      startup_id,
      problem_validation,
      solution_score,
      market_score,
      team_score,
      product_score,
      business_model_score,
      traction_score,
      fundraising_readiness,
      comments || 'Evaluation submitted'
    ]
  );

  const startup = (await query('SELECT owner_id, name FROM startups WHERE id = ?', [startup_id]))[0];
  if (startup) {
    await notify(startup.owner_id, 'Mentor Evaluation Received! 📊', `A new readiness evaluation has been submitted for ${startup.name}.`, 'mentorship');
  }

  res.status(201).json({ id: r.insertId, message: 'Evaluation submitted successfully' });
}));

// -------------------------------------------------------------
// 7. STARTUP ECOSYSTEM & FOUNDER WORKSPACES
// -------------------------------------------------------------
app.get('/api/startups', auth, asyncRoute(async (req, res) => {
  let sql = `SELECT s.*, u.name as owner_name, u.email as owner_email FROM startups s JOIN users u ON u.id = s.owner_id WHERE 1=1`;
  const p = [];

  if (req.query.stage) {
    sql += ' AND s.stage = ?';
    p.push(req.query.stage);
  }
  if (req.query.industry) {
    sql += ' AND s.industry LIKE ?';
    p.push(`%${req.query.industry}%`);
  }
  if (req.query.search) {
    sql += ' AND (s.name LIKE ? OR s.problem LIKE ? OR s.solution LIKE ?)';
    const t = `%${req.query.search}%`;
    p.push(t, t, t);
  }

  sql += ' ORDER BY s.created_at DESC';
  res.json(await query(sql, p));
}));

app.post('/api/startups', auth, asyncRoute(async (req, res) => {
  const { name, industry, location, problem, solution, business_model, target_market, stage = 'Idea', traction, revenue = 0, funding_requirement = 0, website } = req.body;
  if (!name) return res.status(400).json({ message: 'Startup name is required' });

  const r = await query(
    `INSERT INTO startups(owner_id, name, industry, location, problem, solution, business_model, target_market, stage, traction, revenue, funding_requirement, website, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Approved', NOW())`,
    [req.user.id, name, industry || 'Technology', location || 'Remote', problem || '', solution || '', business_model || 'B2B', target_market || 'Students', stage, traction || 'Initial users', revenue || 0, funding_requirement || 0, website || '']
  );

  const startupId = r.insertId;
  await query(`INSERT INTO startup_members(startup_id, user_id, member_role) VALUES (?, ?, 'Founder')`, [startupId, req.user.id]);
  await logAudit(req.user.id, `Registered startup "${name}"`, 'Startup', startupId);

  res.status(201).json({ id: startupId, message: 'Startup workspace created successfully' });
}));

app.put('/api/startups/:id', auth, asyncRoute(async (req, res) => {
  const { name, industry, location, problem, solution, business_model, target_market, stage, traction, revenue, funding_requirement, website } = req.body;
  await query(
    `UPDATE startups 
     SET name = COALESCE(?, name),
         industry = COALESCE(?, industry),
         location = COALESCE(?, location),
         problem = COALESCE(?, problem),
         solution = COALESCE(?, solution),
         business_model = COALESCE(?, business_model),
         target_market = COALESCE(?, target_market),
         stage = COALESCE(?, stage),
         traction = COALESCE(?, traction),
         revenue = COALESCE(?, revenue),
         funding_requirement = COALESCE(?, funding_requirement),
         website = COALESCE(?, website)
     WHERE id = ?`,
    [name, industry, location, problem, solution, business_model, target_market, stage, traction, revenue, funding_requirement, website, req.params.id]
  );
  res.json({ ok: true, message: 'Startup updated successfully' });
}));

app.get('/api/startups/:id/members', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT sm.*, u.name, u.email, r.name as role 
     FROM startup_members sm 
     JOIN users u ON u.id = sm.user_id 
     JOIN roles r ON r.id = u.role_id 
     WHERE sm.startup_id = ?`,
    [req.params.id]
  );
  res.json(rows);
}));

app.post('/api/startups/:id/members', auth, asyncRoute(async (req, res) => {
  const { user_id, member_role = 'Team Member' } = req.body;
  await query(`INSERT INTO startup_members(startup_id, user_id, member_role) VALUES (?, ?, ?)`, [req.params.id, user_id, member_role]);
  await notify(user_id, 'Added to startup team', `You have been added to the team for startup #${req.params.id}`, 'startup');
  res.status(201).json({ ok: true });
}));

app.delete('/api/startups/:id/members/:userId', auth, asyncRoute(async (req, res) => {
  await query(`DELETE FROM startup_members WHERE startup_id = ? AND user_id = ?`, [req.params.id, req.params.userId]);
  res.json({ ok: true });
}));

app.get('/api/support-requests', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT sr.*, s.name as startup_name 
     FROM support_requests sr 
     JOIN startups s ON s.id = sr.startup_id 
     ORDER BY sr.id DESC`
  );
  res.json(rows);
}));

app.post('/api/support-requests', auth, asyncRoute(async (req, res) => {
  const { startup_id = 1, category = 'General', description } = req.body;
  const r = await query(
    `INSERT INTO support_requests(startup_id, category, description, status) VALUES (?, ?, ?, 'Requested')`,
    [startup_id, category, description || '']
  );
  res.status(201).json({ id: r.insertId, message: 'Support request submitted' });
}));

app.patch('/api/support-requests/:id', auth, asyncRoute(async (req, res) => {
  const { status } = req.body;
  await query('UPDATE support_requests SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
}));

// -------------------------------------------------------------
// 8. INCUBATION PROGRAMS, APPLICATIONS & COHORTS
// -------------------------------------------------------------
app.get('/api/programs', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT p.*, i.name as incubator_name, 
      (SELECT COUNT(*) FROM incubation_applications ia WHERE ia.program_id = p.id) as applications_count 
     FROM incubation_programs p 
     JOIN incubators i ON i.id = p.incubator_id 
     ORDER BY p.deadline ASC`
  );
  res.json(rows);
}));

app.post('/api/programs', auth, allow('incubator', 'admin'), asyncRoute(async (req, res) => {
  const { name, description, duration_months = 3, eligibility, focus_areas, cohort_size = 20, deadline } = req.body;
  let incubatorId = 1;
  const inc = await query('SELECT id FROM incubators WHERE user_id = ?', [req.user.id]);
  if (inc.length) incubatorId = inc[0].id;

  const r = await query(
    `INSERT INTO incubation_programs(incubator_id, name, description, duration_months, eligibility, focus_areas, cohort_size, deadline, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open')`,
    [incubatorId, name, description || '', duration_months, eligibility || '', focus_areas || '', cohort_size, deadline || '2026-12-31']
  );
  res.status(201).json({ id: r.insertId, message: 'Program created successfully' });
}));

app.get('/api/applications', auth, asyncRoute(async (req, res) => {
  let sql = `SELECT ia.*, s.name as startup_name, p.name as program_name, i.name as incubator_name 
             FROM incubation_applications ia 
             JOIN startups s ON s.id = ia.startup_id 
             JOIN incubation_programs p ON p.id = ia.program_id 
             JOIN incubators i ON i.id = p.incubator_id`;
  const params = [];

  if (req.user.role === 'startup') {
    sql += ' WHERE s.owner_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'incubator') {
    sql += ' WHERE i.user_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY ia.applied_at DESC';
  const rows = await query(sql, params);
  res.json(rows);
}));

app.post('/api/applications', auth, asyncRoute(async (req, res) => {
  const { startup_id, program_id, problem, solution, market, team, business_model, traction, funding_requirement, pitch_deck } = req.body;
  const r = await query(
    `INSERT INTO incubation_applications(startup_id, program_id, problem, solution, market, team, business_model, traction, funding_requirement, pitch_deck, status, applied_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', NOW())`,
    [startup_id || 1, program_id || 1, problem || '', solution || '', market || '', team || '', business_model || '', traction || '', funding_requirement || 0, pitch_deck || '']
  );

  const prog = (await query('SELECT p.name, i.user_id FROM incubation_programs p JOIN incubators i ON i.id = p.incubator_id WHERE p.id = ?', [program_id || 1]))[0];
  if (prog) {
    await notify(prog.user_id, 'New incubation application!', `A startup applied to "${prog.name}".`, 'application');
  }

  res.status(201).json({ id: r.insertId, message: 'Application submitted!' });
}));

app.patch('/api/applications/:id', auth, allow('incubator', 'admin'), asyncRoute(async (req, res) => {
  const { status } = req.body;
  await query('UPDATE incubation_applications SET status = ? WHERE id = ?', [status, req.params.id]);

  const appRow = (await query('SELECT ia.*, s.owner_id, s.name as startup_name FROM incubation_applications ia JOIN startups s ON s.id = ia.startup_id WHERE ia.id = ?', [req.params.id]))[0];
  if (appRow) {
    await notify(appRow.owner_id, 'Incubation application status updated', `Your application for ${appRow.startup_name} has moved to "${status}".`, 'application');
  }

  res.json({ ok: true, message: `Application updated to ${status}` });
}));

app.get('/api/cohorts', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT c.*, p.name as program_name 
     FROM cohorts c 
     JOIN incubation_programs p ON p.id = c.program_id 
     ORDER BY c.start_date DESC`
  );
  res.json(rows);
}));

app.post('/api/cohorts', auth, allow('incubator', 'admin'), asyncRoute(async (req, res) => {
  const { program_id = 1, name, start_date, end_date } = req.body;
  const r = await query(
    `INSERT INTO cohorts(program_id, name, start_date, end_date) VALUES (?, ?, ?, ?)`,
    [program_id, name, start_date || '2026-12-01', end_date || '2027-02-28']
  );
  res.status(201).json({ id: r.insertId, message: 'Cohort created' });
}));

// -------------------------------------------------------------
// 9. INVESTOR DEALS, DUE DILIGENCE & PORTFOLIO
// -------------------------------------------------------------
app.get('/api/deals', auth, asyncRoute(async (req, res) => {
  let sql = `SELECT d.*, s.name as startup_name, s.industry, s.stage as startup_stage, s.traction, u.name as investor_name 
             FROM deals d 
             JOIN startups s ON s.id = d.startup_id 
             JOIN users u ON u.id = d.investor_id`;
  const params = [];

  if (req.user.role === 'investor') {
    sql += ' WHERE d.investor_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'startup') {
    sql += ' WHERE s.owner_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY d.created_at DESC';
  const rows = await query(sql, params);
  res.json(rows);
}));

app.post('/api/deals', auth, asyncRoute(async (req, res) => {
  const { startup_id = 1, title, stage = 'New Opportunity', amount = 1000000, notes } = req.body;
  const r = await query(
    `INSERT INTO deals(investor_id, startup_id, title, stage, amount, interest, notes, created_at)
     VALUES (?, ?, ?, ?, ?, 'Interested', ?, NOW())`,
    [req.user.id, startup_id, title || 'Investment Opportunity', stage, amount, notes || 'Added to deal flow']
  );

  const startup = (await query('SELECT owner_id, name FROM startups WHERE id = ?', [startup_id]))[0];
  if (startup) {
    await notify(startup.owner_id, 'Investor interest! 🚀', `${req.user.name} added ${startup.name} to deal flow pipeline.`, 'deal');
  }

  await logAudit(req.user.id, `Created deal #${r.insertId}`, 'Deal', r.insertId);
  res.status(201).json({ id: r.insertId, message: 'Deal added to pipeline' });
}));

app.patch('/api/deals/:id', auth, asyncRoute(async (req, res) => {
  const { stage, notes, amount } = req.body;
  if (stage) await query('UPDATE deals SET stage = ? WHERE id = ?', [stage, req.params.id]);
  if (notes !== undefined) await query('UPDATE deals SET notes = ? WHERE id = ?', [notes, req.params.id]);
  if (amount !== undefined) await query('UPDATE deals SET amount = ? WHERE id = ?', [amount, req.params.id]);

  const deal = (await query('SELECT d.*, s.owner_id, s.name as startup_name FROM deals d JOIN startups s ON s.id = d.startup_id WHERE d.id = ?', [req.params.id]))[0];
  if (deal && stage) {
    await notify(deal.owner_id, 'Deal pipeline stage update', `Your deal "${deal.title}" moved to "${stage}".`, 'deal');
  }

  res.json({ message: 'Deal updated successfully' });
}));

app.get('/api/deals/:id/documents', auth, asyncRoute(async (req, res) => {
  const rows = await query('SELECT * FROM due_diligence_documents WHERE deal_id = ? ORDER BY id ASC', [req.params.id]);
  res.json(rows);
}));

app.post('/api/deals/:id/documents', auth, upload.single('file'), asyncRoute(async (req, res) => {
  const { category = 'Business', document_name } = req.body;
  const file = req.file;
  const url = file ? `/uploads/${file.filename}` : null;
  const docName = document_name || file?.originalname || 'Uploaded Document';

  const r = await query(
    `INSERT INTO due_diligence_documents(deal_id, category, document_name, status, file_url)
     VALUES (?, ?, ?, 'Uploaded', ?)`,
    [req.params.id, category, docName, url]
  );

  res.status(201).json({ id: r.insertId, document_name: docName, url, message: 'Document uploaded' });
}));

app.patch('/api/due-diligence/:id', auth, asyncRoute(async (req, res) => {
  const { status } = req.body;
  await query('UPDATE due_diligence_documents SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true, message: `Document marked as ${status}` });
}));

app.get('/api/portfolio', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT d.*, s.name as startup_name, s.industry, s.stage as startup_stage, s.traction, s.revenue,
            COALESCE(i.amount, d.amount) as invested_amount,
            COALESCE(i.equity_percent, 8.5) as equity_percent,
            COALESCE(i.investment_date, d.created_at) as investment_date 
     FROM deals d 
     JOIN startups s ON s.id = d.startup_id 
     LEFT JOIN investments i ON i.deal_id = d.id 
     WHERE d.stage = 'Invested' OR d.stage = 'Negotiation' OR d.stage = 'Term Sheet' 
     ORDER BY d.created_at DESC`
  );
  res.json(rows);
}));

app.post('/api/investments', auth, allow('investor', 'admin'), asyncRoute(async (req, res) => {
  const { deal_id, amount, equity_percent, investment_date, notes } = req.body;
  const r = await query(
    `INSERT INTO investments(deal_id, amount, equity_percent, investment_date, notes) VALUES (?, ?, ?, ?, ?)`,
    [deal_id, amount, equity_percent, investment_date || new Date().toISOString().split('T')[0], notes || '']
  );
  await query('UPDATE deals SET stage = "Invested" WHERE id = ?', [deal_id]);
  res.status(201).json({ id: r.insertId, message: 'Investment finalized and recorded' });
}));

// -------------------------------------------------------------
// 10. INNOVATION CHALLENGES & SUBMISSIONS
// -------------------------------------------------------------
app.get('/api/challenges', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT c.*, u.name as creator_name,
      (SELECT COUNT(*) FROM challenge_submissions cs WHERE cs.challenge_id = c.id) as submissions_count 
     FROM challenges c 
     JOIN users u ON u.id = c.creator_id 
     ORDER BY c.deadline ASC`
  );
  res.json(rows);
}));

app.post('/api/challenges', auth, asyncRoute(async (req, res) => {
  const { title, problem_statement, description, domain, deadline, eligibility } = req.body;
  if (!title || !problem_statement) {
    return res.status(400).json({ message: 'Title and problem statement are required' });
  }

  const r = await query(
    `INSERT INTO challenges(creator_id, title, problem_statement, description, domain, deadline, eligibility, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Open')`,
    [req.user.id, title, problem_statement, description || '', domain || 'Innovation', deadline || '2026-12-31', eligibility || 'All students']
  );
  res.status(201).json({ id: r.insertId, message: 'Challenge published' });
}));

app.get('/api/challenges/:id/submissions', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT cs.*, u.name as student_name, u.email as student_email 
     FROM challenge_submissions cs 
     JOIN users u ON u.id = cs.student_id 
     WHERE cs.challenge_id = ? 
     ORDER BY cs.submitted_at DESC`,
    [req.params.id]
  );
  res.json(rows);
}));

app.post('/api/challenges/:id/submissions', auth, asyncRoute(async (req, res) => {
  const { title, solution } = req.body;
  if (!solution) return res.status(400).json({ message: 'Solution is required' });

  const r = await query(
    `INSERT INTO challenge_submissions(challenge_id, student_id, title, solution, status, submitted_at)
     VALUES (?, ?, ?, ?, 'Submitted', NOW())`,
    [req.params.id, req.user.id, title || 'Challenge Solution', solution]
  );

  res.status(201).json({ id: r.insertId, message: 'Challenge solution submitted!' });
}));

// -------------------------------------------------------------
// 11. MESSAGING & NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/conversations', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT c.id, c.created_at,
      u.id as partner_id, u.name as partner_name, u.email as partner_email, r.name as partner_role,
      (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
     FROM conversations c
     JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = ?
     JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id != ?
     JOIN users u ON u.id = cm2.user_id
     JOIN roles r ON r.id = u.role_id
     ORDER BY last_message_at DESC`,
    [req.user.id, req.user.id]
  );
  res.json(rows);
}));

app.post('/api/conversations', auth, asyncRoute(async (req, res) => {
  const { target_user_id } = req.body;
  if (!target_user_id) return res.status(400).json({ message: 'Target user ID is required' });

  // Check if conversation already exists between these 2 users
  const existing = await query(
    `SELECT c.id 
     FROM conversations c 
     JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = ? 
     JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = ?`,
    [req.user.id, target_user_id]
  );

  if (existing.length) {
    return res.json({ id: existing[0].id });
  }

  const r = await query('INSERT INTO conversations(created_at) VALUES (NOW())');
  const convId = r.insertId;
  await query('INSERT INTO conversation_members(conversation_id, user_id) VALUES (?, ?), (?, ?)', [convId, req.user.id, convId, target_user_id]);

  res.status(201).json({ id: convId });
}));

app.get('/api/conversations/:id/messages', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT m.*, u.name as sender_name 
     FROM messages m 
     JOIN users u ON u.id = m.sender_id 
     WHERE m.conversation_id = ? 
     ORDER BY m.created_at ASC`,
    [req.params.id]
  );
  res.json(rows);
}));

app.get('/api/messages', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT m.*, u.name as sender_name 
     FROM messages m 
     JOIN users u ON u.id = m.sender_id 
     JOIN conversation_members cm ON cm.conversation_id = m.conversation_id 
     WHERE cm.user_id = ? 
     ORDER BY m.created_at ASC 
     LIMIT 100`,
    [req.user.id]
  );
  res.json(rows);
}));

app.post('/api/messages', auth, asyncRoute(async (req, res) => {
  let { conversation_id, body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ message: 'Message body cannot be empty' });

  if (!conversation_id) {
    const r = await query('INSERT INTO conversations(created_at) VALUES (NOW())');
    conversation_id = r.insertId;
    await query('INSERT INTO conversation_members(conversation_id, user_id) VALUES (?, ?)', [conversation_id, req.user.id]);
  }

  const r = await query(
    `INSERT INTO messages(conversation_id, sender_id, body, is_read, created_at) VALUES (?, ?, ?, 0, NOW())`,
    [conversation_id, req.user.id, body.trim()]
  );

  const payload = {
    id: r.insertId,
    conversation_id,
    sender_id: req.user.id,
    sender_name: req.user.name,
    body: body.trim(),
    created_at: new Date().toISOString()
  };

  io.emit('message', payload);
  io.emit(`conv:${conversation_id}`, payload);

  res.status(201).json(payload);
}));

app.get('/api/notifications', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(rows);
}));

app.patch('/api/notifications/:id/read', auth, asyncRoute(async (req, res) => {
  await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

app.post('/api/notifications/read-all', auth, asyncRoute(async (req, res) => {
  await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
}));

// -------------------------------------------------------------
// 12. ADMIN: USERS, VERIFICATION & AUDIT LOGS
// -------------------------------------------------------------
app.get('/api/users', auth, asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.name, u.email, r.name as role, u.verified, u.created_at 
     FROM users u 
     JOIN roles r ON r.id = u.role_id 
     ORDER BY u.created_at DESC`
  );
  res.json(rows.map(x => ({ ...x, verified: Boolean(x.verified) })));
}));

app.patch('/api/users/:id/verify', auth, allow('admin'), asyncRoute(async (req, res) => {
  const current = (await query('SELECT verified, name FROM users WHERE id = ?', [req.params.id]))[0];
  if (!current) return res.status(404).json({ message: 'User not found' });

  const nextVal = current.verified ? 0 : 1;
  await query('UPDATE users SET verified = ? WHERE id = ?', [nextVal, req.params.id]);

  await notify(req.params.id, 'Verification Status Update', `Your account verification is now ${nextVal ? 'Approved' : 'Revoked'}.`, 'system');
  await logAudit(req.user.id, `Toggled verification for user "${current.name}"`, 'User', req.params.id);

  res.json({ ok: true, verified: Boolean(nextVal) });
}));

app.patch('/api/users/:id/role', auth, allow('admin'), asyncRoute(async (req, res) => {
  const { role } = req.body;
  const roleRow = (await query('SELECT id FROM roles WHERE name = ?', [role]))[0];
  if (!roleRow) return res.status(400).json({ message: 'Invalid role' });

  await query('UPDATE users SET role_id = ? WHERE id = ?', [roleRow.id, req.params.id]);
  await logAudit(req.user.id, `Changed role of user #${req.params.id} to ${role}`, 'User', req.params.id);

  res.json({ ok: true });
}));

app.delete('/api/users/:id', auth, allow('admin'), asyncRoute(async (req, res) => {
  if (Number(req.params.id) === Number(req.user.id)) {
    return res.status(400).json({ message: 'Cannot delete your own admin account' });
  }
  await query('DELETE FROM users WHERE id = ?', [req.params.id]);
  await logAudit(req.user.id, `Deleted user #${req.params.id}`, 'User', req.params.id);
  res.json({ ok: true });
}));

app.get('/api/audit', auth, allow('admin'), asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT a.*, u.name as user_name, u.email as user_email, r.name as role 
     FROM audit_logs a 
     LEFT JOIN users u ON u.id = a.user_id 
     LEFT JOIN roles r ON r.id = u.role_id 
     ORDER BY a.created_at DESC 
     LIMIT 100`
  );
  res.json(rows);
}));

// -------------------------------------------------------------
// 13. GLOBAL SEARCH
// -------------------------------------------------------------
app.get('/api/search', auth, asyncRoute(async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const [users, startups, projects, ideas, programs] = await Promise.all([
    query(`SELECT u.id, u.name, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.name LIKE ? OR u.email LIKE ? LIMIT 5`, [q, q]),
    query(`SELECT id, name, industry, stage FROM startups WHERE name LIKE ? OR industry LIKE ? LIMIT 5`, [q, q]),
    query(`SELECT id, name, domain, status FROM projects WHERE name LIKE ? OR domain LIKE ? LIMIT 5`, [q, q]),
    query(`SELECT id, title as name, industry, stage FROM ideas WHERE title LIKE ? OR problem LIKE ? LIMIT 5`, [q, q]),
    query(`SELECT id, name, focus_areas, duration_months FROM incubation_programs WHERE name LIKE ? OR focus_areas LIKE ? LIMIT 5`, [q, q])
  ]);
  res.json({ users, startups, projects, ideas, programs });
}));

// Fallback for React Router in production
if (fs.existsSync(clientDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

io.on('connection', socket => {
  socket.emit('connected', { message: 'Realtime ecosystem channel connected' });
});

const port = Number(process.env.PORT || 5000);

async function startServer() {
  await testDatabase();

  server.listen(port, () => {
    console.log('');
    console.log('======================================');
    console.log(' Startup & Innovation Portal API');
    console.log('======================================');
    console.log(`✓ Server:   http://localhost:${port}`);
    console.log(`✓ Database: ${process.env.DB_NAME}`);
    console.log('✓ Status:   Running');
    console.log('======================================');
    console.log('');
  });
}

startServer();
 
