create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create schema if not exists stage0_geo;
revoke all on schema stage0_geo from public, anon, authenticated;

create table stage0_geo.boundaries (
  id text primary key,
  boundary extensions.geometry(multipolygon, 4326) not null,
  constraint boundaries_valid_geometry check (extensions.st_isvalid(boundary))
);

create index boundaries_boundary_gist
  on stage0_geo.boundaries
  using gist (boundary);

create table stage0_geo.locations (
  id text primary key,
  name text not null,
  position extensions.geography(point, 4326) not null
);

create index locations_position_gist
  on stage0_geo.locations
  using gist (position);

alter table stage0_geo.boundaries enable row level security;
alter table stage0_geo.locations enable row level security;

create or replace function stage0_geo.contains_point(
  p_boundary_id text,
  p_longitude double precision,
  p_latitude double precision
)
returns boolean
language sql
stable
strict
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select extensions.st_covers(
        boundary,
        extensions.st_setsrid(extensions.st_point(p_longitude, p_latitude), 4326)
      )
      from stage0_geo.boundaries
      where id = p_boundary_id
    ),
    false
  );
$$;

create or replace function stage0_geo.nearby_locations(
  p_longitude double precision,
  p_latitude double precision,
  p_limit integer default 20
)
returns table (
  id text,
  name text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision
)
language sql
stable
strict
security invoker
set search_path = ''
as $$
  with query as (
    select extensions.st_setsrid(
      extensions.st_point(p_longitude, p_latitude),
      4326
    )::extensions.geography as position
  )
  select
    location.id,
    location.name,
    extensions.st_y(location.position::extensions.geometry) as latitude,
    extensions.st_x(location.position::extensions.geometry) as longitude,
    extensions.st_distance(location.position, query.position) as distance_meters
  from stage0_geo.locations as location
  cross join query
  order by location.position operator(extensions.<->) query.position, location.id
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on all tables in schema stage0_geo from public, anon, authenticated;
revoke all on all functions in schema stage0_geo from public, anon, authenticated;

comment on schema stage0_geo is
  'Disposable Stage 0 geospatial compatibility objects; not the canonical product schema.';
