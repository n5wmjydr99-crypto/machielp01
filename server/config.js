'use strict';
process.env.TZ = process.env.TZ || 'America/Asuncion';
const env = process.env;
const PUBLIC_URL = (env.PUBLIC_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/$/, '');
const bancardBase = env.BANCARD_ENV === 'production' ? 'https://vpos.infonet.com.py' : 'https://vpos.infonet.com.py:8888';
module.exports = {
  PORT: +env.PORT || 3000,
  PUBLIC_URL,
  SECURE: PUBLIC_URL.startsWith('https://'),
  PROD: env.NODE_ENV === 'production',
  ADMIN_USER: env.ADMIN_USER || 'HOST',
  ADMIN_PASSWORD: env.ADMIN_PASSWORD || 'Melo.2012',
  ADMIN_PASSWORD_IS_DEFAULT: !env.ADMIN_PASSWORD,
  SEED_DEMO: env.SEED_DEMO !== '0',
  google: { id: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET },
  apple: { clientId: env.APPLE_CLIENT_ID, teamId: env.APPLE_TEAM_ID, keyId: env.APPLE_KEY_ID, privateKey: (env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n') },
  bancard: { publicKey: env.BANCARD_PUBLIC_KEY, privateKey: env.BANCARD_PRIVATE_KEY, base: bancardBase },
  // sin credenciales de Bancard solo se permite el pago simulado fuera de producción (o con ALLOW_MOCK_PAYMENTS=1)
  ALLOW_MOCK: env.ALLOW_MOCK_PAYMENTS === '1' || env.NODE_ENV !== 'production'
};
