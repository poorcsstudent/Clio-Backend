import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleTours } from './visibleTours';

test('saved active tour remains reachable without a catalog or when delisted', () => {
  const active = { id: 'saved' };
  assert.deepEqual(visibleTours(undefined, active), [active]);
  assert.deepEqual(visibleTours([{ id: 'other' }], active), [active, { id: 'other' }]);
  assert.deepEqual(visibleTours(undefined, undefined), []);
});

test('catalog is not mutated and an active tour is not duplicated', () => {
  const catalog = [{ id: 'saved' }];
  assert.deepEqual(visibleTours(catalog, { id: 'saved' }), catalog);
  visibleTours(catalog, { id: 'new' });
  assert.equal(catalog.length, 1);
});
