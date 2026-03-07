process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-tests-only";
process.env.CLIENT_URL = "http://localhost:3000";
process.env.SMTP_HOST = "smtp.ethereal.email";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "may.kovacek59@ethereal.email";
process.env.SMTP_PASS = "rACcuuXrpzjbfC7eNv";
process.env.EMAIL_FROM = "noreply@bookstore.com";

// Allow longer async setup for in-memory MongoDB startup
(global as any).jest && (global as any).jest.setTimeout && (global as any).jest.setTimeout(30000);
