USE startup_portal;
INSERT INTO roles(name) VALUES ('student'),('mentor'),('startup'),('investor'),('incubator'),('admin');
INSERT INTO users(role_id,name,email,password_hash,verified) VALUES
(1,'Arun Kumar','student@startup.local','$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi',1),
(2,'Priya Menon','mentor@startup.local','$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi',1),
(3,'NeonLabs Founder','startup@startup.local','$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi',1),
(4,'VentureX Capital','investor@startup.local','$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi',1),
(5,'Innovation Hub','incubator@startup.local','$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi',1),
(6,'Portal Admin','admin@startup.local','$2a$10$WXaVMW1wLS.ShUH1JgYLpeqPRC5ksoNRXPfI7fcehvsxXTxupu1mi',1);
INSERT INTO student_profiles VALUES (1,'Computer science student building practical products.','B.E. Computer Science','AI, Web, Product Design','https://github.com/arun','https://arun.dev');
INSERT INTO mentor_profiles VALUES (2,'Product strategy and startup growth mentor.','Technology',9,'Weekends','MVP,Traction,Fundraising');
INSERT INTO investor_profiles VALUES (4,'AI,SaaS,FinTech','MVP,Traction,Growth',50000,5000000,'India,SEA','Back founders solving large operational problems with scalable software.');
INSERT INTO incubators(user_id,name,description,location,verified) VALUES (5,'Innovation Hub','University-linked incubation and founder support ecosystem.','Coimbatore',1);
INSERT INTO ideas(creator_id,title,problem,solution,target_users,industry,technologies,stage,required_skills) VALUES (1,'Campus Skill Exchange','Students struggle to find reliable project teammates.','A verified skill and project collaboration network.','College students','EdTech','React,Node,MySQL','Validation','React,UI/UX,Marketing');
INSERT INTO projects(owner_id,idea_id,name,description,domain,status) VALUES (1,1,'SkillBridge','A collaboration workspace connecting students by skills and project needs.','EdTech','Active');
INSERT INTO project_members VALUES (1,1,'Owner',NOW());
INSERT INTO project_issues(project_id,title,description,issue_type,priority,status,assignee_id) VALUES (1,'Design onboarding flow','Create profile and skill onboarding screens.','Feature','High','In Progress',1),(1,'Validate student needs','Interview 10 students and summarize findings.','Research','Medium','Backlog',1);
INSERT INTO project_milestones(project_id,title,due_date,status) VALUES (1,'MVP prototype','2026-11-10','In Progress'),(1,'Pilot with 50 students','2026-12-01','Planned');
INSERT INTO startups(owner_id,name,industry,location,problem,solution,business_model,target_market,stage,traction,revenue,funding_requirement,website,status) VALUES (3,'NeonLabs','SaaS','Coimbatore','Small teams lose time coordinating fragmented work.','A workflow platform for early-stage teams.','B2B SaaS','Student founders and small startups','Traction','120 active users; 12 pilot teams',45000,1200000,'https://neonlabs.example','Approved');
INSERT INTO startup_members VALUES (1,3,'Founder');
INSERT INTO startup_milestones(startup_id,title,due_date,status) VALUES (1,'Reach 250 active users','2026-12-15','In Progress'),(1,'Prepare seed round','2027-01-15','Planned');
INSERT INTO incubation_programs(incubator_id,name,description,duration_months,eligibility,focus_areas,cohort_size,deadline,status) VALUES (1,'Innovation Cohort 2026','A 12-week founder program with mentor and investor access.',3,'Student/founder teams with validated problem','Product,Go-to-market,Fundraising',20,'2026-11-20','Open');
INSERT INTO cohorts(program_id,name,start_date,end_date) VALUES (1,'Cohort 2026-A','2026-12-01','2027-02-28');
INSERT INTO incubation_applications(startup_id,program_id,problem,solution,market,team,business_model,traction,funding_requirement,pitch_deck,status) VALUES (1,1,'Teams lose time coordinating work.','Unified startup workflow.','Early-stage teams','2 founders','B2B SaaS','120 active users',1200000,'/uploads/neonlabs-pitch.pdf','Shortlisted');
INSERT INTO deals(investor_id,startup_id,title,stage,amount,interest,notes) VALUES (4,1,'NeonLabs Seed Opportunity','Due Diligence',1200000,'Interested','Strong early traction; reviewing product and financial documents.');
INSERT INTO due_diligence_documents(deal_id,category,document_name,status) VALUES (1,'Financial','Revenue & bank summary','Under Review'),(1,'Legal','Company incorporation documents','Uploaded'),(1,'Product','Architecture overview','Verified'),(1,'Business','Pitch deck','Verified');
INSERT INTO challenges(creator_id,title,problem_statement,description,domain,deadline,eligibility) VALUES (5,'AI for Campus Operations','How can colleges reduce operational friction?','Build a practical prototype using AI or automation.','AI & EdTech','2026-12-20','College students and student teams');
INSERT INTO notifications(user_id,title,message,type) VALUES (1,'Welcome to the ecosystem','Your innovator workspace is ready.','system'),(3,'Investor interest','VentureX Capital added NeonLabs to Deal Flow.','deal'),(2,'Mentor workspace','You have a new mentor profile ready to review.','mentorship'),(4,'Due diligence update','NeonLabs uploaded a legal document.','deal'),(5,'New application','NeonLabs submitted an incubation application.','application');
INSERT INTO conversations() VALUES ();
INSERT INTO conversation_members VALUES (1,1),(1,2);
INSERT INTO messages(conversation_id,sender_id,body) VALUES (1,1,'Hi Priya, I would like feedback on our MVP onboarding.'),(1,2,'Sure Arun. Let us review the user flow in the next session.');
INSERT INTO audit_logs(user_id,action,entity_type,entity_id) VALUES (1,'Created project','Project',1),(3,'Submitted incubation application','IncubationApplication',1),(4,'Added startup to deal flow','Deal',1);
