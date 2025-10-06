export const config = {
  userAgent: process.env.USER_AGENT || '',
  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
    timer: process.env.LOG_TIMER === 'true',
  },
  podcastIndex: {
    authKey: process.env.PODCAST_INDEX_AUTH_KEY || '',
    baseUrl: process.env.PODCAST_INDEX_BASE_URL || '',
    secretKey: process.env.PODCAST_INDEX_SECRET_KEY || ''
  },
  queue: {
    protocol: process.env.RABBITMQ_PROTOCOL || 'amqp',
    host: process.env.RABBITMQ_HOST || 'localhost',
    username: process.env.RABBITMQ_USERNAME || 'user',
    password: process.env.RABBITMQ_PASSWORD || 'mysecretpw',
    port: Number(process.env.RABBITMQ_PORT) || 5672,
    vhost: process.env.RABBITMQ_VHOST || '/',
  }
};
