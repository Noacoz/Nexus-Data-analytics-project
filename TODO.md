# Phase 2 Security Hardening Progress

- [x] Create TODO.md
- [ ] Add auth middleware to analytics_service/main.py
- [ ] Update docker-compose.yml with ANALYTICS_API_KEY env
- [ ] Rebuild analytics service: docker compose up -d --build analytics
- [ ] Test health endpoint without auth: curl http://localhost:8001/health
- [ ] Test protected endpoint without key: curl POST http://localhost:8001/query ...
- [ ] Test protected endpoint with key: curl POST with X-API-Key
- [ ] Complete phase 2
