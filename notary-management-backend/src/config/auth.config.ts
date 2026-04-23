export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'super-secret',
  jwtExpiration: '8h',
  roles: ['OWNER', 'SECRETARIAT', 'ACCOUNTANT', 'RECEPTIONIST'],
};
