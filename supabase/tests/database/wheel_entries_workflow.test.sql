begin;

select plan(3);

select has_function(
  'public',
  'replace_wheel_entries',
  array['uuid', 'jsonb'],
  'Authenticated wheel replacement entry point exists'
);

select ok(
  not has_function_privilege('anon', 'public.replace_wheel_entries(uuid, jsonb)', 'execute'),
  'Anonymous users cannot replace saved wheel entries'
);

select ok(
  has_function_privilege('authenticated', 'public.replace_wheel_entries(uuid, jsonb)', 'execute'),
  'Authenticated users can invoke the owner-scoped wheel workflow'
);

select * from finish();

rollback;
