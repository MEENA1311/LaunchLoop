// SQLite fallback schema and initial seed data
export const SQLITE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INTEGER PRIMARY KEY,
  bio TEXT,
  education TEXT,
  interests TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentor_profiles (
  user_id INTEGER PRIMARY KEY,
  expertise TEXT,
  industry TEXT,
  years_experience INTEGER DEFAULT 0,
  availability TEXT,
  preferred_stages TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS investor_profiles (
  user_id INTEGER PRIMARY KEY,
  sectors TEXT,
  stages TEXT,
  min_ticket REAL,
  max_ticket REAL,
  geography TEXT,
  thesis TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS incubators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  verified INTEGER DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS startups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  problem TEXT,
  solution TEXT,
  business_model TEXT,
  target_market TEXT,
  stage TEXT DEFAULT 'Idea',
  traction TEXT,
  revenue REAL DEFAULT 0,
  funding_requirement REAL DEFAULT 0,
  website TEXT,
  pitch_info TEXT,
  status TEXT DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS startup_members (
  startup_id INTEGER,
  user_id INTEGER,
  member_role TEXT,
  PRIMARY KEY(startup_id, user_id),
  FOREIGN KEY(startup_id) REFERENCES startups(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  problem TEXT,
  solution TEXT,
  target_users TEXT,
  industry TEXT,
  technologies TEXT,
  stage TEXT,
  required_skills TEXT,
  status TEXT DEFAULT 'Idea',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  idea_id INTEGER NULL,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  status TEXT DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id),
  FOREIGN KEY(idea_id) REFERENCES ideas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id INTEGER,
  user_id INTEGER,
  member_role TEXT DEFAULT 'Contributor',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(project_id, user_id),
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issue_type TEXT DEFAULT 'Task',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Backlog',
  assignee_id INTEGER NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY(assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'Planned',
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collaboration_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  requester_id INTEGER NOT NULL,
  target_id INTEGER NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(requester_id) REFERENCES users(id),
  FOREIGN KEY(target_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mentorship_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requester_id INTEGER NOT NULL,
  mentor_id INTEGER NOT NULL,
  startup_id INTEGER NULL,
  goal TEXT,
  status TEXT DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(requester_id) REFERENCES users(id),
  FOREIGN KEY(mentor_id) REFERENCES users(id),
  FOREIGN KEY(startup_id) REFERENCES startups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS mentorships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  goal TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  FOREIGN KEY(request_id) REFERENCES mentorship_requests(id)
);

CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentorship_id INTEGER NOT NULL,
  scheduled_at TEXT,
  topic TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Scheduled',
  FOREIGN KEY(mentorship_id) REFERENCES mentorships(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mentor_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentor_id INTEGER NOT NULL,
  startup_id INTEGER NOT NULL,
  problem_validation INTEGER,
  solution_score INTEGER,
  market_score INTEGER,
  team_score INTEGER,
  product_score INTEGER,
  business_model_score INTEGER,
  traction_score INTEGER,
  fundraising_readiness INTEGER,
  comments TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(mentor_id) REFERENCES users(id),
  FOREIGN KEY(startup_id) REFERENCES startups(id)
);

CREATE TABLE IF NOT EXISTS incubation_programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incubator_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_months INTEGER,
  eligibility TEXT,
  focus_areas TEXT,
  cohort_size INTEGER,
  deadline TEXT,
  status TEXT DEFAULT 'Open',
  FOREIGN KEY(incubator_id) REFERENCES incubators(id)
);

CREATE TABLE IF NOT EXISTS cohorts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  FOREIGN KEY(program_id) REFERENCES incubation_programs(id)
);

CREATE TABLE IF NOT EXISTS incubation_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  startup_id INTEGER NOT NULL,
  program_id INTEGER NOT NULL,
  problem TEXT,
  solution TEXT,
  market TEXT,
  team TEXT,
  business_model TEXT,
  traction TEXT,
  funding_requirement REAL,
  pitch_deck TEXT,
  status TEXT DEFAULT 'Draft',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(startup_id) REFERENCES startups(id),
  FOREIGN KEY(program_id) REFERENCES incubation_programs(id)
);

CREATE TABLE IF NOT EXISTS startup_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  startup_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'Planned',
  FOREIGN KEY(startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS support_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  startup_id INTEGER NOT NULL,
  category TEXT,
  description TEXT,
  status TEXT DEFAULT 'Requested',
  FOREIGN KEY(startup_id) REFERENCES startups(id)
);

CREATE TABLE IF NOT EXISTS investor_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investor_id INTEGER NOT NULL,
  sector TEXT,
  stage TEXT,
  min_ticket REAL,
  max_ticket REAL,
  FOREIGN KEY(investor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investor_id INTEGER NOT NULL,
  startup_id INTEGER NOT NULL,
  title TEXT,
  stage TEXT DEFAULT 'New Opportunity',
  amount REAL,
  interest TEXT DEFAULT 'Interested',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(investor_id) REFERENCES users(id),
  FOREIGN KEY(startup_id) REFERENCES startups(id)
);

CREATE TABLE IF NOT EXISTS due_diligence_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  category TEXT,
  document_name TEXT,
  status TEXT DEFAULT 'Requested',
  file_url TEXT,
  FOREIGN KEY(deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS investments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id INTEGER NOT NULL,
  amount REAL,
  equity_percent REAL,
  investment_date TEXT,
  notes TEXT,
  FOREIGN KEY(deal_id) REFERENCES deals(id)
);

CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  problem_statement TEXT,
  description TEXT,
  domain TEXT,
  deadline TEXT,
  eligibility TEXT,
  status TEXT DEFAULT 'Open',
  FOREIGN KEY(creator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  title TEXT,
  solution TEXT,
  status TEXT DEFAULT 'Submitted',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(challenge_id) REFERENCES challenges(id),
  FOREIGN KEY(student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id INTEGER,
  user_id INTEGER,
  PRIMARY KEY(conversation_id, user_id),
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY(sender_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entity_type TEXT,
  status TEXT DEFAULT 'Pending',
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
`;

export const SQLITE_SEEDS = [
  "INSERT INTO roles(id, name) VALUES (1,'student'),(2,'mentor'),(3,'startup'),(4,'investor'),(5,'incubator'),(6,'admin')",
  `INSERT INTO users(id, role_id, name, email, password_hash, verified) VALUES
    (1, 1, 'Arun Kumar', 'student@startup.local', '$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi', 1),
    (2, 2, 'Priya Menon', 'mentor@startup.local', '$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi', 1),
    (3, 3, 'NeonLabs Founder', 'startup@startup.local', '$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi', 1),
    (4, 4, 'VentureX Capital', 'investor@startup.local', '$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi', 1),
    (5, 5, 'Innovation Hub', 'incubator@startup.local', '$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi', 1),
    (6, 6, 'Portal Admin', 'admin@startup.local', '$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi', 1)`,
  "INSERT INTO student_profiles VALUES (1,'Computer science student building practical products.','B.E. Computer Science','AI, Web, Product Design','https://github.com/arun','https://arun.dev')",
  "INSERT INTO mentor_profiles VALUES (2,'Product strategy and startup growth mentor.','Technology',9,'Weekends','MVP,Traction,Fundraising')",
  "INSERT INTO investor_profiles VALUES (4,'AI,SaaS,FinTech','MVP,Traction,Growth',50000,5000000,'India,SEA','Back founders solving large operational problems with scalable software.')",
  "INSERT INTO incubators(id, user_id, name, description, location, verified) VALUES (1, 5, 'Innovation Hub', 'University-linked incubation and founder support ecosystem.', 'Coimbatore', 1)",
  "INSERT INTO ideas(id, creator_id, title, problem, solution, target_users, industry, technologies, stage, required_skills) VALUES (1, 1, 'Campus Skill Exchange', 'Students struggle to find reliable project teammates.', 'A verified skill and project collaboration network.', 'College students', 'EdTech', 'React,Node,MySQL', 'Validation', 'React,UI/UX,Marketing')",
  "INSERT INTO projects(id, owner_id, idea_id, name, description, domain, status) VALUES (1, 1, 1, 'SkillBridge', 'A collaboration workspace connecting students by skills and project needs.', 'EdTech', 'Active')",
  "INSERT INTO project_members (project_id, user_id, member_role) VALUES (1, 1, 'Owner')",
  "INSERT INTO project_issues(id, project_id, title, description, issue_type, priority, status, assignee_id) VALUES (1, 1, 'Design onboarding flow', 'Create profile and skill onboarding screens.', 'Feature', 'High', 'In Progress', 1), (2, 1, 'Validate student needs', 'Interview 10 students and summarize findings.', 'Research', 'Medium', 'Backlog', 1)",
  "INSERT INTO project_milestones(id, project_id, title, due_date, status) VALUES (1, 1, 'MVP prototype', '2026-11-10', 'In Progress'), (2, 1, 'Pilot with 50 students', '2026-12-01', 'Planned')",
  "INSERT INTO startups(id, owner_id, name, industry, location, problem, solution, business_model, target_market, stage, traction, revenue, funding_requirement, website, status) VALUES (1, 3, 'NeonLabs', 'SaaS', 'Coimbatore', 'Small teams lose time coordinating fragmented work.', 'A workflow platform for early-stage teams.', 'B2B SaaS', 'Student founders and small startups', 'Traction', '120 active users; 12 pilot teams', 45000, 1200000, 'https://neonlabs.example', 'Approved')",
  "INSERT INTO startup_members (startup_id, user_id, member_role) VALUES (1, 3, 'Founder'), (1, 1, 'Collaborator')",
  "INSERT INTO startup_milestones(id, startup_id, title, due_date, status) VALUES (1, 1, 'Reach 250 active users', '2026-12-15', 'In Progress'), (2, 1, 'Prepare seed round', '2027-01-15', 'Planned')",
  "INSERT INTO incubation_programs(id, incubator_id, name, description, duration_months, eligibility, focus_areas, cohort_size, deadline, status) VALUES (1, 1, 'Innovation Cohort 2026', 'A 12-week founder program with mentor and investor access.', 3, 'Student/founder teams with validated problem', 'Product,Go-to-market,Fundraising', 20, '2026-11-20', 'Open')",
  "INSERT INTO cohorts(id, program_id, name, start_date, end_date) VALUES (1, 1, 'Cohort 2026-A', '2026-12-01', '2027-02-28')",
  "INSERT INTO incubation_applications(id, startup_id, program_id, problem, solution, market, team, business_model, traction, funding_requirement, pitch_deck, status) VALUES (1, 1, 1, 'Teams lose time coordinating work.', 'Unified startup workflow.', 'Early-stage teams', '2 founders', 'B2B SaaS', '120 active users', 1200000, '/uploads/neonlabs-pitch.pdf', 'Shortlisted')",
  "INSERT INTO deals(id, investor_id, startup_id, title, stage, amount, interest, notes) VALUES (1, 4, 1, 'NeonLabs Seed Opportunity', 'Due Diligence', 1200000, 'Interested', 'Strong early traction; reviewing product and financial documents.')",
  "INSERT INTO due_diligence_documents(id, deal_id, category, document_name, status, file_url) VALUES (1, 1, 'Financial', 'Revenue & bank summary', 'Under Review', '/uploads/financial-summary.pdf'), (2, 1, 'Legal', 'Company incorporation documents', 'Uploaded', '/uploads/incorporation.pdf'), (3, 1, 'Product', 'Architecture overview', 'Verified', '/uploads/architecture.pdf'), (4, 1, 'Business', 'Pitch deck', 'Verified', '/uploads/neonlabs-pitch.pdf')",
  "INSERT INTO challenges(id, creator_id, title, problem_statement, description, domain, deadline, eligibility) VALUES (1, 5, 'AI for Campus Operations', 'How can colleges reduce operational friction?', 'Build a practical prototype using AI or automation.', 'AI & EdTech', '2026-12-20', 'College students and student teams')",
  "INSERT INTO notifications(user_id, title, message, type) VALUES (1, 'Welcome to the ecosystem', 'Your innovator workspace is ready.', 'system'), (3, 'Investor interest', 'VentureX Capital added NeonLabs to Deal Flow.', 'deal'), (2, 'Mentor workspace', 'You have a new mentor profile ready to review.', 'mentorship'), (4, 'Due diligence update', 'NeonLabs uploaded a legal document.', 'deal'), (5, 'New application', 'NeonLabs submitted an incubation application.', 'application')",
  "INSERT INTO conversations(id) VALUES (1)",
  "INSERT INTO conversation_members(conversation_id, user_id) VALUES (1, 1), (1, 2)",
  "INSERT INTO messages(conversation_id, sender_id, body) VALUES (1, 1, 'Hi Priya, I would like feedback on our MVP onboarding.'), (1, 2, 'Sure Arun. Let us review the user flow in the next session.')",
  "INSERT INTO audit_logs(user_id, action, entity_type, entity_id) VALUES (1, 'Created project', 'Project', 1), (3, 'Submitted incubation application', 'IncubationApplication', 1), (4, 'Added startup to deal flow', 'Deal', 1)"
];
