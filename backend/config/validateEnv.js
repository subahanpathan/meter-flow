const required = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

function validateEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    throw new Error('Missing required environment variables: ' + missing.join(', '));
  }
}

module.exports = validateEnv;
