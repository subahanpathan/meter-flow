# MeterFlow - Issues & Improvement Plan

**Date:** April 29, 2026  
**Status:** Ready for Implementation

---

## 🔴 CRITICAL ISSUES (Must Fix)

### 1. **Expired Tokens Not Handled Properly**
**Severity:** HIGH  
**File:** [frontend/src/store/authStore.js](frontend/src/store/authStore.js)  
**Issue:** No token refresh mechanism implemented. When JWT expires, user gets logged out without attempting refresh.

**Impact:** Poor UX - users forced to re-login frequently  
**Fix:**
```javascript
// Add refresh token logic
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    const { accessToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    set({ accessToken });
    return accessToken;
  } catch (error) {
    // Force logout if refresh fails
    logout();
  }
};
```

---

### 2. **API Key Expiration Not Enforced**
**Severity:** HIGH  
**File:** [backend/models/apikey.model.js](backend/models/apikey.model.js)  
**Issue:** Model has no `expiresAt` field, and validation doesn't check expiration during gateway requests.

**Impact:** Keys that should be expired remain active  
**Fix:**
- Add `expiresAt` optional field to APIKey model
- Check expiration in `validateApiKey.middleware.js`
```javascript
if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
  return errorResponse(res, 'API key has expired', 401);
}
```

---

### 3. **Rate Limit Logic is Incorrect**
**Severity:** HIGH  
**File:** [backend/middleware/rateLimiter.middleware.js](backend/middleware/rateLimiter.middleware.js)  
**Issue:** 
- Rate limit reset is per-minute, but should be per-hour or per-day
- Free plan limit is 100/min = 6000/hour (unreasonably high)
- Pro plan is 1000/min = 60,000/hour (unreasonable)
- The sliding window doesn't match billing period (monthly)

**Impact:** Rate limiting ineffective, doesn't align with billing model  
**Fix:**
```javascript
// Change to daily/monthly limits
const limit = plan === 'pro' ? 100000 : 10000; // per day
const windowSeconds = 86400; // 24 hours
// Better: implement moving window for monthly billing
```

---

### 4. **SQL Injection / NoSQL Injection Vulnerability**
**Severity:** HIGH  
**File:** [backend/server.js](backend/server.js) line 25  
**Issue:** `mongoSanitize` is commented out:
```javascript
// app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
```

**Impact:** Application vulnerable to NoSQL injection attacks  
**Fix:** Enable sanitization middleware

---

### 5. **No Input Validation on Gateway Requests**
**Severity:** HIGH  
**File:** [backend/controllers/gateway.controller.js](backend/controllers/gateway.controller.js)  
**Issue:** 
- `req.body.endpoint` not validated (path traversal risk)
- `req.body.method` not validated
- `req.body.data` can be any structure

**Impact:** Open to malicious requests  
**Fix:**
```javascript
// Add validation middleware
const { body, validationResult } = require('express-validator');

router.post('/', 
  validateApiKey,
  body('apiId').isMongoId(),
  body('endpoint').trim().matches(/^\/[a-zA-Z0-9\-\/_]*$/),
  body('method').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  rateLimiter,
  proxyRequest
);
```

---

### 6. **Billing Calculation Missing User's Plan**
**Severity:** HIGH  
**File:** [backend/services/billing.service.js](backend/services/billing.service.js)  
**Issue:** 
- Function doesn't consider user's plan
- Free tier might have different free request limit than Pro
- No currency conversion support

**Impact:** Incorrect billing amounts, overcharging users  
**Fix:**
```javascript
const calculateBilling = async (userId, periodStart, periodEnd) => {
  const user = await User.findById(userId);
  const freeRequests = user.plan === 'pro' ? 5000 : 1000;
  // ... rest of calculation
};
```

---

### 7. **No Audit Logging**
**Severity:** MEDIUM-HIGH  
**Issue:** No logs for:
- User logins
- API key creation/revocation
- Payment status changes
- Billing modifications

**Impact:** Compliance violation, unable to debug issues  
**Fix:** Create AuditLog model and log all sensitive operations

---

## 🟠 MAJOR ISSUES (Should Fix)

### 8. **Weak Password Requirements**
**Severity:** MEDIUM  
**File:** [backend/models/user.model.js](backend/models/user.model.js)  
**Issue:** Only checks `minlength: 8`, no complexity requirements

**Fix:**
```javascript
password: {
  type: String,
  required: [true, 'Please add a password'],
  minlength: 8,
  validate: {
    validator: function(pwd) {
      // At least 1 uppercase, 1 number, 1 special char
      return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pwd);
    },
    message: 'Password must contain uppercase, number, and special character'
  }
}
```

---

### 9. **No CORS Error Handling**
**Severity:** MEDIUM  
**File:** [backend/server.js](backend/server.js)  
**Issue:** CORS errors aren't caught in global error handler

**Fix:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add CORS error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return errorResponse(res, 'CORS policy violation', 403);
  }
  next(err);
});
```

---

### 10. **Insufficient Error Context in Catch Blocks**
**Severity:** MEDIUM  
**Files:** Multiple controllers  
**Issue:** Generic error handling loses context
```javascript
catch (error) {
  return errorResponse(res, 'Gateway internal error', 500); // No logging
}
```

**Fix:**
```javascript
catch (error) {
  logger.error('Gateway Error:', {
    userId: req.apiOwner,
    apiId: apiId,
    endpoint: endpoint,
    error: error.message
  });
  return errorResponse(res, 'Gateway internal error', 500);
}
```

---

### 11. **Race Condition in Billing Generation**
**Severity:** MEDIUM  
**File:** [backend/services/billing.service.js](backend/services/billing.service.js)  
**Issue:** No transaction/lock when checking & creating billing record
```javascript
let billing = await Billing.findOne({...});
if (billing) { /* update */ }
else { /* create */ } // Between check & create, another request could create it
```

**Fix:** Use MongoDB transactions or unique constraint with upsert

---

### 12. **API Gateway Timeout is Too Low**
**Severity:** MEDIUM  
**File:** [backend/controllers/gateway.controller.js](backend/controllers/gateway.controller.js)  
**Issue:** `timeout: 10000` (10s) may not be enough for some upstream APIs

**Fix:**
```javascript
timeout: parseInt(process.env.GATEWAY_TIMEOUT || '30000') // configurable
```

---

### 13. **No Request ID for Tracing**
**Severity:** MEDIUM  
**Issue:** Can't trace requests across logs

**Fix:**
```javascript
const requestId = require('express-request-id');
app.use(requestId());
```

---

### 14. **Missing Refresh Token Endpoint**
**Severity:** MEDIUM  
**File:** [backend/routes/auth.routes.js](backend/routes/auth.routes.js)  
**Issue:** Auth controller has refresh token generation but no route

**Fix:** Add route:
```javascript
router.post('/refresh', (req, res) => {
  // Verify refresh token, issue new access token
});
```

---

### 15. **No Rate Limit on Auth Endpoints**
**Severity:** MEDIUM  
**File:** [backend/routes/auth.routes.js](backend/routes/auth.routes.js)  
**Issue:** Login/register endpoints not protected from brute force

**Fix:**
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per 15 min
});

router.post('/login', authLimiter, validate(...), login);
router.post('/register', authLimiter, validate(...), register);
```

---

## 🟡 MODERATE ISSUES

### 16. **Missing Frontend Error Boundaries**
**Severity:** MEDIUM  
**File:** [frontend/src/App.jsx](frontend/src/App.jsx)  
**Issue:** No error boundary component for catching React errors

**Impact:** App crashes instead of showing error UI  
**Fix:** Implement React Error Boundary component

---

### 17. **Hardcoded API URLs**
**Severity:** MEDIUM  
**File:** [frontend/src/services/api.service.js](frontend/src/services/api.service.js)  
**Issue:** API base URL might be hardcoded

**Fix:** Use environment variables:
```javascript
const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

---

### 18. **No Pagination on Endpoints**
**Severity:** MEDIUM  
**Files:** [backend/controllers/*.controller.js](backend/controllers/)  
**Issue:** `getBillingHistory()`, usage endpoints could return millions of records

**Fix:**
```javascript
const page = parseInt(req.query.page || 1);
const limit = parseInt(req.query.limit || 20);
const skip = (page - 1) * limit;

const data = await Billing.find({...})
  .skip(skip)
  .limit(limit)
  .sort(...);

const total = await Billing.countDocuments({...});
res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total/limit) } });
```

---

### 19. **No Soft Delete for Data Compliance**
**Severity:** MEDIUM  
**Issue:** When API or APIKey is deleted, usage history is lost

**Fix:** Add `deletedAt` field instead of hard delete (soft delete)

---

### 20. **Billing Job Not Persisted After Shutdown**
**Severity:** MEDIUM  
**File:** [backend/jobs/billingJob.js](backend/jobs/billingJob.js)  
**Issue:** If server crashes during billing job, some users won't get invoiced

**Fix:** Use persistent job queue (BullMQ already available)
```javascript
const billingQueue = new Queue('billing', process.env.REDIS_URL);

// Scheduled job
await billingQueue.add('monthly-invoice', null, {
  repeat: { cron: '0 1 1 * *' } // 1st day of month, 1 AM
});
```

---

## 🟢 MINOR ISSUES / ENHANCEMENTS

### 21. **No Environment Variable Examples**
**Fix:** Create `.env.example` file with all required variables

---

### 22. **Missing TypeScript Support**
**Suggestion:** Migrate to TypeScript for type safety

---

### 23. **No API Documentation**
**Suggestion:** Add Swagger/OpenAPI documentation

---

### 24. **No Frontend Tests**
**Suggestion:** Add Vitest + React Testing Library

---

### 25. **No Backend Unit Tests**
**Suggestion:** Add Jest tests for controllers & services

---

### 26. **Missing Health Check Endpoint**
**Suggestion:** Add `/health` endpoint for monitoring

---

### 27. **No Request Logging**
**Suggestion:** Add structured logging (Winston/Pino)

---

### 28. **No Database Migrations**
**Suggestion:** Use Mongoose migrations or separate migration system

---

### 29. **Billing Currency Hardcoded**
**File:** [backend/models/billing.model.js](backend/models/billing.model.js)  
**Issue:** Currency is always INR

**Fix:** Make configurable per user

---

### 30. **No Webhook Support**
**Suggestion:** Add webhooks for payment status updates

---

---

## 📋 IMPROVEMENT PLAN - PHASE BREAKDOWN

### **Phase 1: Critical Security Fixes (Week 1)**
Priority: MUST DO
- [ ] Enable mongoSanitize middleware
- [ ] Add input validation to gateway requests
- [ ] Fix API key expiration check
- [ ] Add rate limiting to auth endpoints
- [ ] Implement stronger password requirements
- [ ] Enable request ID tracking

**Estimated Time:** 8-10 hours

---

### **Phase 2: Core Functionality Fixes (Week 2)**
Priority: HIGH
- [ ] Fix rate limiter logic (move from per-minute to per-hour/day)
- [ ] Fix billing calculation (consider user plan)
- [ ] Add token refresh endpoint & mechanism
- [ ] Implement transaction for billing upsert
- [ ] Add audit logging model & middleware
- [ ] Add pagination to list endpoints

**Estimated Time:** 12-15 hours

---

### **Phase 3: Error Handling & Logging (Week 3)**
Priority: MEDIUM-HIGH
- [ ] Add structured logging (Winston/Pino)
- [ ] Add request tracing
- [ ] Add error context to catch blocks
- [ ] Add React error boundary
- [ ] Add CORS error handler
- [ ] Add health check endpoint

**Estimated Time:** 10-12 hours

---

### **Phase 4: Testing & Quality (Week 4)**
Priority: MEDIUM
- [ ] Add backend unit tests (Jest)
- [ ] Add integration tests
- [ ] Add frontend component tests (Vitest)
- [ ] Add smoke tests
- [ ] Fix test coverage

**Estimated Time:** 15-20 hours

---

### **Phase 5: Documentation & DevOps (Week 5)**
Priority: MEDIUM
- [ ] Add Swagger/OpenAPI documentation
- [ ] Create `.env.example` file
- [ ] Add API documentation comments
- [ ] Add deployment guide
- [ ] Add monitoring setup
- [ ] Add GitHub CI/CD workflows

**Estimated Time:** 8-10 hours

---

### **Phase 6: Advanced Features (Week 6+)**
Priority: LOW (Optional)
- [ ] TypeScript migration
- [ ] Webhook support
- [ ] Database migrations framework
- [ ] Advanced analytics
- [ ] Multi-currency support
- [ ] Custom pricing models

**Estimated Time:** 20+ hours

---

## 🎯 Quick Start: Critical Fixes (Most Urgent)

**Start with these 5:**
1. Enable mongoSanitize in [backend/server.js](backend/server.js)
2. Add input validation to [backend/controllers/gateway.controller.js](backend/controllers/gateway.controller.js)
3. Fix rate limiter in [backend/middleware/rateLimiter.middleware.js](backend/middleware/rateLimiter.middleware.js)
4. Check API key expiration in [backend/middleware/validateApiKey.middleware.js](backend/middleware/validateApiKey.middleware.js)
5. Add token refresh in [frontend/src/store/authStore.js](frontend/src/store/authStore.js) & [backend/routes/auth.routes.js](backend/routes/auth.routes.js)

**Expected Time:** 4-5 hours

---

## 📊 Risk Matrix

| Issue | Severity | Likelihood | Priority |
|-------|----------|-----------|----------|
| Rate Limit Logic | HIGH | HIGH | CRITICAL |
| NoSQL Injection | HIGH | MEDIUM | CRITICAL |
| Billing Calculation | HIGH | HIGH | CRITICAL |
| Token Expiration | HIGH | HIGH | CRITICAL |
| API Key Expiration | HIGH | MEDIUM | CRITICAL |
| Input Validation | HIGH | HIGH | CRITICAL |
| Race Condition (Billing) | MEDIUM | MEDIUM | HIGH |
| Audit Logging | MEDIUM | HIGH | HIGH |
| Auth Brute Force | MEDIUM | MEDIUM | HIGH |
| No Testing | MEDIUM | HIGH | MEDIUM |

---

## ✅ Success Criteria

- [ ] All critical security issues fixed
- [ ] Rate limiting working correctly
- [ ] Billing calculations accurate
- [ ] Tests with >80% coverage
- [ ] API documented
- [ ] 0 hardcoded secrets
- [ ] Audit logs in place
- [ ] Error handling comprehensive
- [ ] Performance baseline established
- [ ] Deployment automation in place

---

**Generated:** April 29, 2026  
**Next Review:** After Phase 1 completion
