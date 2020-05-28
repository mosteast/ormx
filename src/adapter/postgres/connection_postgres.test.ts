import { N_db_type } from '../../connection/connection';
import { Connection_postgres, T_config_connection_postgres } from './connection_postgres';

const e = process.env;

const conf: T_config_connection_postgres = {
  dialect: N_db_type.postgres,
  host: e.postgres_host,
  port: +e.postgres_port,
  user: e.postgres_user,
  password: e.postgres_password,
  log: { log_params: true },
};

let con: Connection_postgres;

beforeEach(async () => {
  con = new Connection_postgres();
  con.set_config(conf);
  await con.connect();
});

it('can connect', async () => {
  expect(await con.ping()).toBeTruthy();
});

it('database_create', async () => {
  const name = 'a';
  await con.database_drop(name);
  expect((await con.database_create(name)).name).toBe(name);
});

it('database_pick', async () => {
  const name = 'a';
  await con.database_drop(name);
  await con.database_create(name);
  expect((await con.database_pick(name)).name).toBe(name);
});

it('database_drop', async () => {
  const name = 'a';
  await con.database_ensure(name);
  expect((await con.database_pick(name))).toBeTruthy();
  await con.database_drop(name);
  expect((await con.database_pick(name))).toBeFalsy();
});