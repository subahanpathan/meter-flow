# ⚡ MeterFlow

**MeterFlow** is a production-grade, usage-based API billing and metering platform. It allows developers to monetize their APIs by tracking requests, enforcing rate limits, and automating billing using a tiered pricing model.

## 🚀 Features

-   **API Gateway**: Secure proxy for external APIs with real-time usage tracking.
-   **Intelligent Metering**: Track every request with latency and status code logging.
-   **Flexible Rate Limiting**: Plan-based limits (Free/Pro) powered by Redis.
-   **Automated Billing**: Tiered pricing model with automated monthly invoicing.
-   **Payment Integration**: Secure Razorpay checkout for seamless monetization.
-   **Developer Dashboard**: Premium analytics with Recharts visualizations.
-   **API Key Management**: Secure key generation (hashed) with rotation and revocation.
-   **Playground**: Interactive console for testing endpoints and keys.

## 🛠️ Tech Stack

-   **Backend**: Node.js, Express, MongoDB, Redis (Upstash).
-   **Frontend**: React, Tailwind CSS, Zustand, React Query, Recharts.
-   **Infrastructure**: BullMQ (Background Jobs), Razorpay (Payments).

## 📦 Installation

### Prerequisites
-   Node.js (v16+)
-   MongoDB Atlas Account
-   Upstash Redis Account
-   Razorpay Developer Account

### 1. Clone the repository
```bash
git clone <repo-url>
cd meterflow
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your environment variables in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Ensure VITE_API_URL in src/services/api.service.js is correct
npm run dev
```

## 🛡️ Security
-   **JWT Auth**: Access & Refresh token rotation.
-   **Hashed Keys**: API keys are stored using SHA-256 (only visible once).
-   **Helmet & CORS**: Hardened headers and origin validation.
-   **Rate Limiting**: Sliding window limits in Redis.

## 📄 License
MIT License.
