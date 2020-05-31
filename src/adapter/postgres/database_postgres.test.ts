import { readdir } from 'fs-extra';
import { resolve } from 'path';
import { N_db_type } from '../../rds/connection';
import { Connection_postgres } from './connection_postgres';
import { Database_postgres, T_config_database_postgres } from './database_postgres';

jest.setTimeout(150000);

const e = process.env;

const conf: T_config_database_postgres = {
  database: e.postgres_database!,
  dialect: N_db_type.postgres,
  host: e.postgres_host,
  port: +e.postgres_port!,
  user: e.postgres_user,
  password: e.postgres_password,
  log: { log_params: true },
  migration: {
    file_dir: resolve(__dirname, 'test_asset/migration'),
  },
};

let con: Connection_postgres;
let db: Database_postgres;

beforeEach(async () => {
  con = new Connection_postgres(conf);
  await con.connect();
  await con.database_ensure('a');
  db = new Database_postgres(conf);
  await db.connect();
});

it('table_pick/table_drop', async () => {
  const name = 'a';
  await db.table_create_test(name);
  const r = await db.table_pick(name);
  expect(r?.name).toBe(name);
  await db.table_drop(name);
  expect(await db.table_pick(name)).toBeFalsy();
});

it('table_list', async () => {
  const tbs = [ 'a', 'b', 'c' ];
  await db.table_drop_all();
  for (const it of tbs) { await db.table_create_test(it); }
  const r = await db.table_list_names();
  expect(r?.length).toBe(3);
  for (const it of tbs) { await db.table_drop(it); }
});

it('table_list/table_count', async () => {
  const tbs = [ 'a', 'b', 'c' ];
  for (const it of tbs) { await db.table_create_test(it); }
  const r = await db.table_list();
  expect(r?.length).toBe(3);
  expect(await db.table_pick(tbs[0])).toBeTruthy();
  expect(await db.table_pick(tbs[1])).toBeTruthy();
  expect(await db.table_pick(tbs[2])).toBeTruthy();
  expect(await db.table_pick(tbs[3])).toBeFalsy();
  expect(await db.table_count()).toBe(tbs.length);
  for (const it of tbs) { await db.table_drop(it); }
  expect(await db.table_pick(tbs[0])).toBeFalsy();
  expect(await db.table_pick(tbs[1])).toBeFalsy();
  expect(await db.table_pick(tbs[2])).toBeFalsy();
  expect(await db.table_count()).toBe(0);
});

it('table_pick', async () => {
  await db.table_create_test('a');
  const row = await db.table_pick('a');
  expect(row?.fields?.length).toBeTruthy();
  await db.table_drop('a');
});

it('migration_list_all/migration_list_all_ids', async () => {
  const names = await db.migration_list_all();
  const ids = await db.migration_list_all_ids();
  const files = await readdir(db.get_config().migration?.file_dir!);
  for (const it of files) { expect(names.includes(it)).toBeTruthy(); }
  for (const it of files) { expect(ids.includes(+it.split('.')[0])).toBeTruthy(); }
});

it('state_init', async () => {
  const name = db.get_config().state!.table_name!;
  expect(await db.table_pick(name)).toBeFalsy();
  await db.state_init();
  expect(await db.table_pick(name)).toBeTruthy();
  await db.state_drop_table();
  expect(await db.table_pick(name)).toBeFalsy();
});

it('state_get', async () => {
  await db.state_reset();
  const key = 'a';
  await db.state_unset(key);
  expect(await db.state_get(key)).toBeFalsy();
  await db.state_set(key, 1);
  expect(await db.state_get(key)).toBe(1);
});