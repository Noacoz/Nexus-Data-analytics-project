-- Nexus Platform PostgreSQL Schema
-- Complete implementation with all required tables, indexes, and extensions

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(20) DEFAULT 'email',
  provider_id VARCHAR(255),
  plan VARCHAR(20) DEFAULT 'starter',
  role VARCHAR(50),
  bio TEXT,
  subscription_status VARCHAR(20),
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- TABLE 2: datasets
-- ============================================================================
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  description TEXT,
  file_format VARCHAR(10) NOT NULL,
  file_size INTEGER DEFAULT 0,
  row_count INTEGER DEFAULT 0,
  column_count INTEGER DEFAULT 0,
  columns JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'uploaded',
  version INTEGER DEFAULT 1,
  status_reason TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processing_started_at TIMESTAMP,
  processed_at TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('uploaded', 'processing', 'completed', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
CREATE INDEX IF NOT EXISTS idx_datasets_user_status ON datasets(user_id, status);

-- ============================================================================
-- TABLE 3: dataset_rows
-- ============================================================================
CREATE TABLE IF NOT EXISTS dataset_rows (
  id BIGSERIAL PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dataset_rows_dataset_id ON dataset_rows(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_rows_data ON dataset_rows USING GIN (data);

-- ============================================================================
-- TABLE 4: statistical_snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS statistical_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  row_count INTEGER NOT NULL,
  column_stats JSONB NOT NULL,
  correlations JSONB,
  outliers JSONB,
  trends JSONB,
  anomalies JSONB,
  data_quality JSONB,
  computation_id UUID NOT NULL,
  dataset_version INTEGER NOT NULL,
  confidence_base FLOAT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_statistical_snapshots_dataset_id ON statistical_snapshots(dataset_id);
CREATE INDEX IF NOT EXISTS idx_statistical_snapshots_computed_at ON statistical_snapshots(dataset_id, computed_at DESC);

-- ============================================================================
-- TABLE 5: insights
-- ============================================================================
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES statistical_snapshots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger_type VARCHAR(20) NOT NULL DEFAULT 'user_query',
  insight_type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  confidence_label VARCHAR(10) NOT NULL,
  computation_id UUID,
  dataset_version INTEGER,
  assumptions JSONB,
  limitations JSONB,
  hypotheses JSONB,
  evidence JSONB,
  recommended_actions JSONB,
  reasoning_trace JSONB,
  is_proactive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_insight_type CHECK (insight_type IN ('trend', 'anomaly', 'correlation', 'summary', 'risk', 'opportunity', 'data_quality', 'forecast')),
  CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('auto', 'user_query', 'monitor')),
  CONSTRAINT valid_confidence_label CHECK (confidence_label IN ('High', 'Medium', 'Low'))
);

CREATE INDEX IF NOT EXISTS idx_insights_dataset_id ON insights(dataset_id);
CREATE INDEX IF NOT EXISTS idx_insights_confidence ON insights(dataset_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(dataset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_is_proactive ON insights(is_proactive);

-- ============================================================================
-- TABLE 6: chat_sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_dataset_id ON chat_sessions(dataset_id);

-- ============================================================================
-- TABLE 7: chat_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  referenced_insight_ids JSONB,
  reasoning_used JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(session_id, created_at DESC);

-- ============================================================================
-- TABLE 8: monitoring_alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  alert_type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB,
  linked_insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  seen BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_alert_type CHECK (alert_type IN ('drift', 'anomaly', 'threshold', 'trend_reversal', 'weekly_summary')),
  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'info'))
);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_dataset_id ON monitoring_alerts(dataset_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_seen ON monitoring_alerts(seen, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_triggered_at ON monitoring_alerts(triggered_at DESC);

-- ============================================================================
-- TABLE 9: reasoning_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS reasoning_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  input JSONB,
  output JSONB,
  duration_ms INTEGER,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reasoning_logs_insight_id ON reasoning_logs(insight_id);

-- ============================================================================
-- TABLE 10: reasoning_outputs
-- ============================================================================
CREATE TABLE IF NOT EXISTS reasoning_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  snapshot_id UUID REFERENCES statistical_snapshots(id) ON DELETE CASCADE,
  computation_id UUID NOT NULL,
  dataset_version INTEGER NOT NULL,
  reasoning JSONB NOT NULL,
  confidence FLOAT NOT NULL,
  uncertainty_factors JSONB,
  recommended_next_steps JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_reasoning_linkage CHECK (insight_id IS NOT NULL OR snapshot_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_reasoning_outputs_dataset_id ON reasoning_outputs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_outputs_computation_id ON reasoning_outputs(computation_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_outputs_created_at ON reasoning_outputs(dataset_id, created_at DESC);

-- ============================================================================
-- TABLE 11: audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  action_type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_action_type CHECK (action_type IN ('UPLOAD', 'ANALYSIS', 'INSIGHT_GEN', 'REASONING_GEN', 'RECOMPUTE', 'VALIDATION')),
  CONSTRAINT valid_status CHECK (status IN ('started', 'success', 'warning', 'failed', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_dataset_id ON audit_logs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(dataset_id, action_type, created_at DESC);

-- ============================================================================
-- TABLE 12: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(30) NOT NULL DEFAULT 'system',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read, created_at DESC);

-- ============================================================================
-- TABLE 13: comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_dataset_id ON comments(dataset_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(dataset_id, created_at DESC);

-- ============================================================================
-- TABLE 14: reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'Analytics',
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_created_at ON reports(user_id, created_at DESC);

-- ============================================================================
-- TABLE 15: settings
-- ============================================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'UTC',
  anonymizeData BOOLEAN DEFAULT FALSE,
  shareMetrics BOOLEAN DEFAULT FALSE,
  retentionDays INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_user_id ON settings(user_id);

-- ============================================================================
-- TABLE 16: team_members
-- ============================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_members_workspace_id ON team_members(workspace_id);
CREATE INDEX idx_team_members_created_at ON team_members(workspace_id, created_at DESC);

-- ============================================================================
-- TABLE 17: team_invitations
-- ============================================================================
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_invitations_workspace_id ON team_invitations(workspace_id);

-- ============================================================================
-- TABLE 18: payments
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) NOT NULL,
  cardholder_name VARCHAR(255),
  country VARCHAR(10),
  status VARCHAR(20) NOT NULL,
  plan VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_created_at ON payments(user_id, created_at DESC);

