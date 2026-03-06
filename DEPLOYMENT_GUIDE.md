# Deployment & Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# JWT
JWT_SECRET=your_jwt_secret_here

# OAuth - Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth - GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI API
GROQ_API_KEY=your_groq_api_key_here

# Stripe (for backend payment processing)
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key

# Frontend Environment (for Vite)
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_STRIPE_KEY=pk_live_your_stripe_key
```

## Prerequisites

- Node.js 18+ 
- npm 9+
- Supabase account setup
- Groq API key
- Stripe account (optional, for payments)
- Google OAuth credentials (optional)
- GitHub OAuth credentials (optional)

## Installation

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Run in production
npm start

# Or for development with auto-reload
npm run dev
```

## Database Setup

### Supabase Tables Required

Make sure your Supabase instance has these tables:

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  avatar_url TEXT,
  provider TEXT,
  provider_id TEXT,
  plan TEXT DEFAULT 'free',
  subscription_status TEXT,
  subscription_ends_at TIMESTAMP,
  role TEXT DEFAULT 'user',
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### datasets
```sql
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  file_format TEXT,
  row_count INTEGER,
  file_size INTEGER,
  status TEXT DEFAULT 'ready',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### insights
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id),
  title TEXT,
  content TEXT,
  type TEXT,
  confidence FLOAT,
  border_color TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### comments
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id),
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  message TEXT,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT,
  description TEXT,
  type TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### settings
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id),
  name TEXT,
  timezone TEXT DEFAULT 'UTC',
  anonymizeData BOOLEAN DEFAULT FALSE,
  shareMetrics BOOLEAN DEFAULT TRUE,
  retentionDays INTEGER DEFAULT 90,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### team_members
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES users(id),
  user_id UUID REFERENCES users(id),
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### team_invitations
```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES users(id),
  email TEXT,
  role TEXT DEFAULT 'member',
  invited_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  payment_intent_id TEXT,
  cardholder_name TEXT,
  country TEXT,
  status TEXT,
  plan TEXT,
  amount INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Docker Deployment

Create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t nexus-analytics .
docker run -p 5000:5000 --env-file .env nexus-analytics
```

## Deployment Checklist

- [ ] Environment variables configured in production
- [ ] Database migrations run successfully
- [ ] npm install completed and dependencies locked
- [ ] npm run build passes without errors
- [ ] API keys secured (not in version control)
- [ ] CORS origins configured for your domain
- [ ] JWT secret is strong and secure
- [ ] OAuth credentials obtained from providers
- [ ] Supabase RLS policies configured if needed
- [ ] Groq API key validated
- [ ] Stripe account configured with webhook endpoints
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] SSL/TLS certificate installed
- [ ] Domain DNS pointed to server

## Testing in Production

```bash
# Health check
curl http://localhost:5000/

# API health
curl http://localhost:5000/auth/me -H "Cookie: token=<valid_token>"

# Test dataset creation
curl -X POST http://localhost:5000/api/datasets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<valid_token>" \
  -d '{"name":"Test","description":"Test dataset","file_format":"CSV"}'
```

## Monitoring

Monitor these metrics in production:
- API response times
- Error rates (500/401/404)
- Database connection pool usage
- Memory usage
- CPU usage
- Groq API quota usage
- Stripe API errors

## Support & Troubleshooting

### Common Issues

**Issue**: "GROQ_API_KEY is not defined"
- **Solution**: Check `.env` file has `GROQ_API_KEY` set

**Issue**: "Database connection failed"
- **Solution**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in .env

**Issue**: "OAuth redirect failed"
- **Solution**: Ensure `CLIENT_URL` matches your domain exactly

**Issue**: "Payment failed with Stripe"
- **Solution**: Check Stripe keys and webhook configuration

## Scale & Performance Optimization

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Enable connection pooling
   - Archive old data regularly

2. **API Caching**
   - Cache reports and insights with Redis
   - Set cache expiration policies
   - Invalidate cache on data updates

3. **Frontend Optimization**
   - Code splitting with Vite
   - Lazy load components
   - Compress images and assets
   - Use CDN for static files

4. **Backend Optimization**
   - Use clustering for Node.js
   - Load balance across instances
   - Async job processing with queues
   - Rate limiting on public endpoints

## Maintenance

Regular tasks:
- Monitor error logs weekly
- Review API usage metrics
- Update dependencies monthly
- Rotate JWT secrets quarterly
- Backup databases daily
- Review security advisories
- Update SSL certificate annually

---

**Last Updated**: 2024
**Version**: 1.0.0 Production
