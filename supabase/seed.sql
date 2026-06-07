-- ============================================================
-- SessionPilot Ops — Seed data (PK Foods Group demo org)
-- Demo auth users are created by scripts/setup-demo.mjs
-- ============================================================

-- Organization
insert into public.organizations (id, name) values
  ('a0000000-0000-4000-8000-000000000001', 'PK Foods Group');

-- Brands
insert into public.brands (id, organization_id, name) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Little Asia'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Svensk24'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Östra Street Food');

-- Locations (chat disabled by default — admin can enable in Settings)
insert into public.locations (id, organization_id, brand_id, name, address, city, postal_code, country, phone, email, chat_enabled) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'Little Asia', 'Storgatan 12', 'Stockholm', '111 23', 'Sweden', '+46 8 123 456', 'littleasia@pkfoods.se', false),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
   'Svensk24', 'Kungsgatan 4', 'Stockholm', '111 35', 'Sweden', '+46 8 234 567', 'svensk24@pkfoods.se', false),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003',
   'Östra Street Food', 'Östra Hamngatan 22', 'Gothenburg', '411 09', 'Sweden', '+46 31 345 678', 'ostra@pkfoods.se', false);

-- Departments
insert into public.departments (id, organization_id, name) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Kitchen'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Front of House'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Bar'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Delivery'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Inventory'),
  ('d0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Cleaning'),
  ('d0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'Management');

-- Job roles
insert into public.job_roles (id, organization_id, name, description) values
  ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Cashier', 'Handles register and customer payments'),
  ('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Kitchen Staff', 'General kitchen duties'),
  ('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Prep Cook', 'Ingredient preparation'),
  ('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Chef', 'Cooking and plating'),
  ('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Head Chef', 'Kitchen leadership'),
  ('e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Shift Leader', 'Leads a shift'),
  ('e0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'Cleaner', 'Cleaning duties'),
  ('e0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'Restaurant Manager', 'Runs the restaurant');

-- Responsibilities
insert into public.responsibilities (id, organization_id, department_id, name, description, estimated_minutes, priority) values
  ('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Opening Kitchen', 'Prepare the kitchen for service', 30, 'high'),
  ('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Closing Kitchen', 'Shut down and secure the kitchen', 45, 'high'),
  ('f0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'Cash Register Reconciliation', 'Count and reconcile the register', 20, 'critical'),
  ('f0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000006', 'Daily Cleaning', 'Clean all front and back areas', 60, 'medium'),
  ('f0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000005', 'Inventory Count', 'Count stock levels', 40, 'medium'),
  ('f0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Equipment Inspection', 'Inspect kitchen equipment condition', 25, 'high');

-- SOPs
insert into public.sops (id, organization_id, department_id, name, description, category) values
  ('aa000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Opening Kitchen', 'Standard procedure for opening the kitchen each morning', 'Opening'),
  ('aa000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Closing Kitchen', 'Standard procedure for closing the kitchen at end of day', 'Closing'),
  ('aa000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002',
   'Cash Register Reconciliation', 'How to count and reconcile the cash register', 'Finance');

insert into public.sop_steps (sop_id, step_number, title, description) values
  ('aa000000-0000-4000-8000-000000000001', 1, 'Unlock kitchen', 'Unlock the kitchen entrance and disable the alarm.'),
  ('aa000000-0000-4000-8000-000000000001', 2, 'Turn on ventilation', 'Switch on the main ventilation system and verify airflow.'),
  ('aa000000-0000-4000-8000-000000000001', 3, 'Check refrigeration temperature', 'Record fridge and freezer temperatures. Fridges must be ≤ 4°C, freezers ≤ -18°C.'),
  ('aa000000-0000-4000-8000-000000000001', 4, 'Prepare workstations', 'Sanitize and set up all prep stations with required tools.'),
  ('aa000000-0000-4000-8000-000000000001', 5, 'Verify ingredients', 'Check ingredient stock against today''s prep list and flag shortages.'),
  ('aa000000-0000-4000-8000-000000000002', 1, 'Store perishables', 'Label, date and refrigerate all perishable items.'),
  ('aa000000-0000-4000-8000-000000000002', 2, 'Clean equipment', 'Clean grills, fryers and surfaces according to cleaning chart.'),
  ('aa000000-0000-4000-8000-000000000002', 3, 'Empty waste', 'Empty all bins and replace liners.'),
  ('aa000000-0000-4000-8000-000000000002', 4, 'Power down', 'Switch off equipment except refrigeration. Confirm gas is off.'),
  ('aa000000-0000-4000-8000-000000000002', 5, 'Lock up', 'Set the alarm and lock the kitchen entrance.'),
  ('aa000000-0000-4000-8000-000000000003', 1, 'Count the drawer', 'Count all cash in the register drawer twice.'),
  ('aa000000-0000-4000-8000-000000000003', 2, 'Compare with system', 'Compare counted total with the POS end-of-day report.'),
  ('aa000000-0000-4000-8000-000000000003', 3, 'Record discrepancies', 'Log any difference over 50 SEK and notify the manager.');

-- Task templates (Little Asia)
insert into public.task_templates
  (id, organization_id, location_id, department_id, sop_id, responsibility_id, name, description, recurrence, recurrence_config, due_time, priority, requires_evidence, evidence_kind, assignment_mode, assigned_job_role_id) values
  ('bb000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'aa000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001',
   'Opening Checklist', 'Complete all kitchen opening steps before service', 'daily', '{}', '10:00', 'high', true, 'photo', 'job_role', 'e0000000-0000-4000-8000-000000000002'),
  ('bb000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', 'aa000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002',
   'Closing Checklist', 'Complete all closing steps after service ends', 'daily', '{}', '22:30', 'high', true, 'photo', 'job_role', 'e0000000-0000-4000-8000-000000000002'),
  ('bb000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000006', null, 'f0000000-0000-4000-8000-000000000004',
   'Kitchen Deep Cleaning', 'Weekly deep clean of the whole kitchen', 'weekly', '{"weekdays":[1]}', '16:00', 'medium', true, 'photo', 'location', null),
  ('bb000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000005', null, 'f0000000-0000-4000-8000-000000000005',
   'Inventory Audit', 'Full stock count and waste log', 'weekly', '{"weekdays":[5]}', '15:00', 'medium', false, 'note', 'location', null),
  ('bb000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'd0000000-0000-4000-8000-000000000001', null, 'f0000000-0000-4000-8000-000000000006',
   'Fire Safety Inspection', 'Monthly fire safety and extinguisher check', 'monthly', '{"day_of_month":1}', '12:00', 'critical', true, 'photo', 'location', null);

-- Checklist items
insert into public.checklist_items (template_id, label, mandatory, requires_evidence, sort_order) values
  ('bb000000-0000-4000-8000-000000000001', 'Unlock kitchen and disable alarm', true, false, 1),
  ('bb000000-0000-4000-8000-000000000001', 'Turn on ventilation', true, false, 2),
  ('bb000000-0000-4000-8000-000000000001', 'Record fridge & freezer temperatures', true, true, 3),
  ('bb000000-0000-4000-8000-000000000001', 'Sanitize and prepare workstations', true, true, 4),
  ('bb000000-0000-4000-8000-000000000001', 'Verify ingredients against prep list', true, false, 5),
  ('bb000000-0000-4000-8000-000000000002', 'Clean counters', true, false, 1),
  ('bb000000-0000-4000-8000-000000000002', 'Sanitize sink', true, false, 2),
  ('bb000000-0000-4000-8000-000000000002', 'Mop floor', true, true, 3),
  ('bb000000-0000-4000-8000-000000000002', 'Empty trash', true, false, 4),
  ('bb000000-0000-4000-8000-000000000002', 'Power down equipment & lock up', true, false, 5),
  ('bb000000-0000-4000-8000-000000000003', 'Degrease hood and filters', true, true, 1),
  ('bb000000-0000-4000-8000-000000000003', 'Clean behind equipment', true, false, 2),
  ('bb000000-0000-4000-8000-000000000003', 'Descale dishwasher', true, false, 3),
  ('bb000000-0000-4000-8000-000000000003', 'Sanitize cold storage', true, true, 4),
  ('bb000000-0000-4000-8000-000000000004', 'Count dry storage', true, false, 1),
  ('bb000000-0000-4000-8000-000000000004', 'Count cold storage', true, false, 2),
  ('bb000000-0000-4000-8000-000000000004', 'Record waste log', true, false, 3),
  ('bb000000-0000-4000-8000-000000000005', 'Check fire extinguishers', true, true, 1),
  ('bb000000-0000-4000-8000-000000000005', 'Test smoke detectors', true, false, 2),
  ('bb000000-0000-4000-8000-000000000005', 'Inspect emergency exits', true, true, 3);

-- Events (kept from the reference app)
insert into public.events (id, location_id, organization_id, title, description, starts_at, image_url) values
  ('cc000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Staff Party 🌟', 'Annual staff party — food, drinks and prizes!', date_trunc('day', now()) + interval '12 days' + interval '19 hours', '/dummy_image4.jpg'),
  ('cc000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Food Safety Training', 'Mandatory refresher for all kitchen staff', date_trunc('day', now()) + interval '5 days' + interval '14 hours', '/dummy_image2.jpg');

-- Approval policy: most tasks complete without review; critical inspections need a manager sign-off
update public.task_templates set requires_approval = true where name = 'Fire Safety Inspection';

-- Opening hours (Little Asia closed Sundays)
update public.locations set opening_hours =
  '{"1":{"open":"10:00","close":"22:00"},"2":{"open":"10:00","close":"22:00"},"3":{"open":"10:00","close":"22:00"},"4":{"open":"10:00","close":"22:00"},"5":{"open":"10:00","close":"23:00"},"6":{"open":"11:00","close":"23:00"},"7":null}'::jsonb
  where id = 'c0000000-0000-4000-8000-000000000001';
update public.locations set opening_hours =
  '{"1":{"open":"09:00","close":"21:00"},"2":{"open":"09:00","close":"21:00"},"3":{"open":"09:00","close":"21:00"},"4":{"open":"09:00","close":"21:00"},"5":{"open":"09:00","close":"22:00"},"6":{"open":"10:00","close":"22:00"},"7":{"open":"11:00","close":"20:00"}}'::jsonb
  where id in ('c0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000003');

-- Job roles carry responsibilities
insert into public.job_role_responsibilities (job_role_id, responsibility_id) values
  ('e0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000007', 'f0000000-0000-4000-8000-000000000004'),
  ('e0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000003');

-- Roles Little Asia needs on its schedule
insert into public.location_required_roles (location_id, job_role_id) values
  ('c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000006');
