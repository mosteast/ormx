import { key_replacer } from './obj'

it('key_replacer', async () => {
  const o: any = { a: 1, b: 2, c: 3 }

  key_replacer(o, { a: 'A' })
  expect(o.A).toBeTruthy()
  expect(o.b).toBeTruthy()
  expect(o.c).toBeTruthy()
  expect(o.a).toBeFalsy()
})
