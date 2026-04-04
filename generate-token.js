import { SignJWT } from 'jose';
import 'dotenv/config';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_TOKEN_SECRET) throw new Error('ENV: ACCESS_TOKEN_SECRET not set');

function checksum(s) {
  return Buffer.from(s, 'utf8').toString('hex').slice(0, 16);
}

function b64url(input) {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}

export async function makeToken() {
  const key = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
  return await new SignJWT({
    sub: 'testuser123',
    email: 'test@example.com',
    roles: ['user'],
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    // .setIssuer('yobot-api')
    // .setAudience('yobot-web')
    .sign(key);
}

async function main() {
  const token = await makeToken();
  console.log(token);
}

main().catch(console.error);
