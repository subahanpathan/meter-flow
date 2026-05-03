require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { scheduleBillingJob } = require('./jobs/billingJob');
const globalErrorHandler = require('./middleware/error.middleware');
const requestIdMiddleware = require('./middleware/requestId.middleware');
const AppError = require('./utils/AppError');

// Initialize Express
const app = express();

// If running behind a proxy (nginx, load balancer), ensure req.ip reflects client IP
app.set('trust proxy', 1);

// 1. Security Middleware
app.use(requestIdMiddleware); // ✅ SECURITY: Add request ID for tracing
app.use(helmet()); // Security headers
// CORS: allow configured origins, plus localhost loopback ports in development.
const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';
const devLoopbackOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (isDev && devLoopbackOriginRegex.test(origin)) return callback(null, true);

    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// 2. Logging & Parsing
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10kb' })); // Body parser with limit
// app.use(mongoSanitize()); // ⚠️ Temporarily disabled due to Express 5 incompatibility with req.query
app.use(hpp()); // Prevent HTTP Parameter Pollution

// 3. Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/apis', require('./routes/api.routes'));
app.use('/api/usage', require('./routes/usage.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/gateway', require('./routes/gateway.routes'));

app.get('/', (req, res) => {
  res.json({ message: 'MeterFlow API is running...' });
});

// 4. Handle undefined routes
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5. Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const validateEnv = require('./config/validateEnv');

// Connect to Database & Start Jobs
const startApp = async () => {
  try {
    validateEnv();
    await connectDB();
    console.log('Database connected...');

    // Ensure mock guest user exists
    const User = require('./models/user.model');
    const guestUser = await User.findById('67bc6477e68225ea14ffc123');
    if (!guestUser) {
      await User.create({
        _id: '67bc6477e68225ea14ffc123',
        name: 'Guest User',
        email: 'guest@meterflow.com',
        password: 'GuestPassword123!', // Compliant password
        role: 'owner',
        plan: 'pro'
      });
      console.log('Mock guest user created.');
    }

    await scheduleBillingJob();
    console.log('Billing jobs scheduled...');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start app:', err);
  }
};

startApp();
