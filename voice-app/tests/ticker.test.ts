import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publishedHeadlines } from '../src/lib/breaking-headlines';
const now = Date.parse('2026-11-14T20:00:00Z');
const published = {slug:'published-story',status:'published',published_at:'2026-11-14T12:00:00Z'};
test('ticker omits missing, withdrawn and future articles instead of linking to undefined', () => {
  const rows = [null, [], {...published,status:'needs_changes'}, {...published,published_at:'2026-12-01T00:00:00Z'}, {...published,published_at:'invalid'}, {...published,slug:''}].map(articles => ({headline:'Title',external_url:null,articles}));
  assert.deepEqual(publishedHeadlines(rows,now),[]);
  assert.deepEqual(publishedHeadlines([{headline:'Title',external_url:null,articles:published}],now),[{text:'Title',href:'/articles/published-story'}]);
});
test('ticker permits safe external destinations and handles array relations', () => {
  assert.deepEqual(publishedHeadlines([{headline:'Title',external_url:null,articles:[published]}],now),[{text:'Title',href:'/articles/published-story'}]);
  assert.deepEqual(publishedHeadlines([{headline:'Title',external_url:'javascript:alert(1)',articles:null}],now),[]);
  assert.deepEqual(publishedHeadlines([{headline:'Title',external_url:'https://example.com/news',articles:null}],now),[{text:'Title',href:'https://example.com/news'}]);
});
