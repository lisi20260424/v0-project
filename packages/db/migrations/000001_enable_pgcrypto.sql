-- +migrate Up
create extension if not exists "pgcrypto";

-- +migrate Down
drop extension if exists "pgcrypto";
