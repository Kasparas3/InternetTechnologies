// config.js — central place for the JWT secret so every file uses the same one.
// In a real app this would come from an environment variable, not source code.

module.exports = {
  JWT_SECRET: 'change-me-in-production-super-secret-key',
  PORT: 3000,
};
