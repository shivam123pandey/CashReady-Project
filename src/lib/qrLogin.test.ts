import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLoginQrPayload, parseLoginQrPayload } from './qrLogin.ts';

test('buildLoginQrPayload round-trips correctly for a customer login', () => {
  const payload = buildLoginQrPayload('customer', 'customer@cashready.test', 'Customer@123');
  const parsed = parseLoginQrPayload(payload);

  assert.deepStrictEqual(parsed, {
    role: 'customer',
    username: 'customer@cashready.test',
    password: 'Customer@123',
  });
});

test('parseLoginQrPayload rejects invalid QR payloads', () => {
  assert.equal(parseLoginQrPayload('not-a-valid-cashready-qr'), null);
  assert.equal(parseLoginQrPayload('cashready-login://%7B%22role%22%3A%22admin%22%7D'), null);
});
