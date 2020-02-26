export default {
  kratos: {
    browser: (process.env.KRATOS_BROWSER_URL || 'http://127.0.0.1:1235').replace(/\/+$/, ''),
    admin: (process.env.KRATOS_ADMIN_URL || 'http://127.0.0.1:1234/').replace(/\/+$/, ''),
    public: (process.env.KRATOS_PUBLIC_URL || 'http://127.0.0.1:1235/').replace(/\/+$/, ''),
  },
  baseUrl: (process.env.BASE_URL || '/').replace(/\/+$/, '') + '/',
  jwksUrl: process.env.JWKS_URL || '/',
  projectName: process.env.PROJECT_NAME || 'SecureApp',
}
