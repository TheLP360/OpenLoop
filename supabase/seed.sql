-- ════════════════════════════════════════════════════════════════════════════
-- OpenLoop — example seed data (templates)
--
-- Run this AFTER you have signed in once, replacing :owner with your auth user
-- id. From the SQL editor:
--   set local "request.jwt.claims" = '{"sub":"<your-uuid>"}';  -- or pass :owner
-- Simplest: replace every  '00000000-0000-0000-0000-000000000000'  below with
-- your own auth.users id (Authentication → Users in the Supabase dashboard).
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare
  v_owner uuid := '00000000-0000-0000-0000-000000000000'; -- ← replace with your id
  v_tpl uuid;
begin
  -- ── Outcome template: Spring Home Maintenance ──
  insert into templates (owner_id, kind, name, description, default_tags)
  values (v_owner, 'outcome', 'Spring Home Maintenance',
          'Annual spring cleanup around the property.', array['home','seasonal'])
  returning id into v_tpl;

  insert into template_steps (template_id, title, energy, priority, sort_order) values
    (v_tpl, 'Mow pasture',            'high',   'medium', 1),
    (v_tpl, 'Clean gutters',          'medium', 'high',   2),
    (v_tpl, 'Trim bushes',            'medium', 'low',    3),
    (v_tpl, 'Service the mower',      'low',    'medium', 4),
    (v_tpl, 'Power-wash the deck',    'high',   'low',    5),
    (v_tpl, 'Check/replace AC filter','low',    'high',   6);

  -- ── Thought templates: writing prompts ──
  insert into templates (owner_id, kind, name, description, prompt, default_tags) values
    (v_owner, 'thought', 'Daily Reflection',
     'A short end-of-day journaling prompt.',
     E'**Today''s wins:**\n\n**What drained me:**\n\n**One thing to carry forward:**\n',
     array['journal']),
    (v_owner, 'thought', 'Morning Pages',
     'Three pages of stream-of-consciousness to clear the mind.',
     E'Write whatever comes — no editing, no stopping. Begin:\n\n',
     array['journal','creative']),
    (v_owner, 'thought', 'Decision Journal',
     'Capture a decision and your reasoning for later review.',
     E'**The decision:**\n\n**Options considered:**\n\n**Why I chose this:**\n\n**What would change my mind:**\n\n**Revisit on:**\n',
     array['decisions']),
    (v_owner, 'thought', 'Weekly Review',
     'GTD-style weekly review scaffold.',
     E'**Open loops captured?**\n\n**Outcomes — still on track?**\n\n**Next actions defined for each active outcome?**\n\n**Waiting-for list reviewed?**\n\n**Someday/maybe scanned?**\n',
     array['gtd','review']);
end $$;
