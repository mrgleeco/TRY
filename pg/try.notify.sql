

-- how-to for postgres notify 
-- with elasticsearch river jdbc listener

-- use db=demoz
-- to load this script:
-- psql -d demoz -U postgres -f this_script.sql
-- to load the data, use some perl

CREATE TABLE yak (
    id serial PRIMARY KEY,
    msg varchar(50) NOT NULL,
    val integer NOT NULL,
    t timestamp DEFAULT current_timestamp
);

CREATE TABLE owl (
    id serial PRIMARY KEY,
    msg varchar(50) NOT NULL,
    val integer NOT NULL,
    t timestamp DEFAULT current_timestamp
);



DROP TRIGGER owl_trigger on owl CASCADE;
DROP TRIGGER yak_trigger on yak CASCADE;
drop FUNCTION notify_trigger();

-- listeners will call with 
-- LISTEN <channel>  where channel is a table name
-- we NOTIFY <channel>    ..easy enough
-- doing <channel>, 'string msg' is a bit harder
---
CREATE FUNCTION notify_trigger() RETURNS trigger AS $$
DECLARE

BEGIN
     -- TG_TABLE_NAME is the name of the table who's trigger called this function
      -- TG_OP is the operation that triggered this function: INSERT, UPDATE or DELETE.
       -- SELECT pg_notify(TG_TABLE_NAME, TG_OP);
       -- execute 'NOTIFY ' || TG_TABLE_NAME || '_' || TG_OP;
       -- execute 'NOTIFY ' || TG_TABLE_NAME::text || ', \'' || TG_OP::text || '\'';
       -- simple is easy, but putting a mess
        execute 'NOTIFY ' || TG_TABLE_NAME::text;
        return new;
END;

$$ LANGUAGE plpgsql;

-- Create triggers on the test tables

CREATE TRIGGER yak_trigger BEFORE insert or update or delete on yak execute procedure notify_trigger();
CREATE TRIGGER owl_trigger BEFORE insert or update or delete on owl execute procedure notify_trigger();

