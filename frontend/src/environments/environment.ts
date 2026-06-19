export const environment = {
  production: false,
  apiBaseUrl: `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000/api`,
};
