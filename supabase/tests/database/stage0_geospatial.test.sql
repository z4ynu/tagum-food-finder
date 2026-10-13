begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select has_schema('stage0_geo', 'Stage 0 geospatial schema exists');
select has_table('stage0_geo', 'boundaries', 'Boundary table exists');
select has_table('stage0_geo', 'locations', 'Location table exists');
select has_index('stage0_geo', 'boundaries', 'boundaries_boundary_gist', 'Boundary GiST index exists');
select has_index('stage0_geo', 'locations', 'locations_position_gist', 'Location GiST index exists');
select has_function(
  'stage0_geo',
  'contains_point',
  array['text', 'double precision', 'double precision'],
  'Boundary function exists'
);
select has_function(
  'stage0_geo',
  'nearby_locations',
  array['double precision', 'double precision', 'integer'],
  'Nearest-place function exists'
);

insert into stage0_geo.boundaries (id, boundary)
values (
  'tagum-test',
  extensions.st_multi(
    extensions.st_geomfromtext(
      'POLYGON((125.60 7.30, 125.90 7.30, 125.90 7.60, 125.60 7.60, 125.60 7.30))',
      4326
    )
  )
);

insert into stage0_geo.locations (id, name, position)
values
  (
    'near',
    'Near fixture',
    extensions.st_setsrid(extensions.st_point(125.8070, 7.4470), 4326)::extensions.geography
  ),
  (
    'far',
    'Far fixture',
    extensions.st_setsrid(extensions.st_point(125.8500, 7.5000), 4326)::extensions.geography
  );

select is(
  stage0_geo.contains_point('tagum-test', 125.8070, 7.4470),
  true,
  'A point inside the synthetic Tagum boundary is accepted'
);

select is(
  stage0_geo.contains_point('tagum-test', 126.0000, 7.4470),
  false,
  'A point outside the synthetic Tagum boundary is rejected'
);

select results_eq(
  $$
    select id
    from stage0_geo.nearby_locations(125.8071, 7.4471, 2)
  $$,
  array['near', 'far']::text[],
  'Locations are ordered from nearest to farthest'
);

select * from finish();
rollback;
