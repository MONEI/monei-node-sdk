import {config} from 'dotenv';
import {Monei} from './monei';

config();

const monei = new Monei(process.env.MONEI_API_KEY!);

const rawBody =
  '{"id":"3690bd3f7294db82fed08c7371bace32","amount":11700,"currency":"EUR","orderId":"588439","status":"SUCCEEDED","message":"Transaction Approved"}';

describe('verifySignature', () => {
  it('should verify signature correctly', () => {
    const signature =
      't=1602604555,v1=5af7cf4e7dc206d09bc0b0b6183dead598b0360d87bbcc5110d5e6832b31338e';
    const result = monei.verifySignature(rawBody, signature);
    expect(result).toEqual(JSON.parse(rawBody));
  });

  it('should fail if signature is invalid', () => {
    const signature =
      't=1602604558,v1=5af7cf4e7dc206d09bc0b0b6183dead598b0360d87bbcc5110d5e6832b31338e';
    expect(() => monei.verifySignature(rawBody, signature)).toThrow(
      'Signature verification failed.'
    );
  });
});
