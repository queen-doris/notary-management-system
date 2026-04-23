export const notificationConfig = {
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  sms: {
    provider: process.env.SMS_PROVIDER,
    apiKey: process.env.SMS_API_KEY,
  },
  push: {
    fcmKey: process.env.FCM_KEY,
  },
};
