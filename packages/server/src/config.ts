import path from 'path';

export const useProxy = process.env.SERVER_USE_PROXY === '1';
export const host = process.env.SERVER_HOST || '0.0.0.0';
export const port = parseInt(process.env.SERVER_PORT || '5001');
export const staticRoot = path.resolve(
  process.env.SERVER_STATIC_ROOT || '../client/dist',
);
