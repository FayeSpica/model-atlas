import test from 'node:test';
import assert from 'node:assert/strict';
import { concepts } from '../src/data/catalog.mjs';
import { stations, trails } from '../src/data/infra-map.mjs';

test('lab stations cover each published concept exactly once', () => {
  const ids=stations.flatMap(station=>station.concepts);
  assert.equal(new Set(ids).size,ids.length);
  assert.deepEqual([...ids].sort(),concepts.map(concept=>concept.id).sort());
  assert.equal(new Set(stations.map(station=>station.id)).size,stations.length);
});

test('learning paths resolve to concepts and their lab stations', () => {
  for(const trail of trails) {
    assert(trail.steps.length>1);
    assert.equal(new Set(trail.steps).size,trail.steps.length);
    for(const id of trail.steps) {
      assert(concepts.some(concept=>concept.id===id),`${trail.id}: ${id}`);
      assert(stations.some(station=>station.concepts.includes(id)));
    }
  }
});
