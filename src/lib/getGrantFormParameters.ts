import type { NelloAuthConfig } from '../config';

export const getGrantFormParameters = (
  config: NelloAuthConfig,
  logError: (message: string) => void,
): Record<string, string> | undefined => {
  if (!config.clientId) {
    logError('No clientId for nello.io provided.');
    return undefined;
  }

  switch (config.authType as string | undefined) {
    case undefined:
    case '':
    case 'password':
      if (!config.username || !config.password) {
        logError('No username and/or password for nello.io provided.');
        return undefined;
      }
      return {
        grant_type: 'password',
        client_id: config.clientId,
        username: config.username,
        password: config.password,
      };

    case 'client':
      if (!config.clientSecret) {
        logError('No clientSecret for nello.io provided.');
        return undefined;
      }
      return {
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      };

    default:
      logError('Invalid authType for nello.io provided.');
      return undefined;
  }
};
