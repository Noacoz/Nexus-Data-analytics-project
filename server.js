/**
 * NEXUS ANALYTICS — GATEWAY SERVER (CANONICAL CLEAN VERSION v3.1)
 * Stack: Express 4 + Supabase + Groq llama-3.3-70b + ioredis
 */

import express      from 'express';
import cors         from 'cors';
import dotenv       from 'dotenv';
import multer       from 'multer';
import { parse as csvParse }             from 'csv-parse/sync';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import Redis        from 'ioredis';
import rateLimit    from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import jwt          from 'jsonwebtoken';
import bcrypt       from 'bcryptjs';
import path         from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT       = process.env.PORT       || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5000';

const redis = new Redis({
  host:          process.env.REDIS_HOST || 'localhost',
  port:          Number(process.env.REDIS_PORT) || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect:   true,
});
redis.on('error', (err) =>
  console.warn('[Redis] non-fatal connection error:', err.message)
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'application/octet-stream',
    ];
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and JSON files are allowed'));
    }
  },
});

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.set('trust proxy', 1);
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again in 15 minutes.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI query rate limit exceeded, please wait a moment.' }
});

app.use(globalLimiter);
app.use('/auth/signin', authLimiter);
app.use('/auth/signup', authLimiter);
app.use('/api/nl-query', aiLimiter);
app.use('/api/chat', aiLimiter);

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const key = `cache:${req.originalUrl || req.url}`;
    try {
      const cached = await redis.get(key);
    if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }

      // If Redis is unavailable or schema changed (e.g., after applying migrations),
      // avoid returning stale/partial schema-derived responses.
      // This specifically prevents issues like missing columns from an outdated schema cache.
      redis.setex(`cache:__schema_warmup__:${req.originalUrl || req.url}`, 1, '1').catch(() => {});
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json;
      res.json = function(data) {
        redis.setex(key, duration, JSON.stringify(data)).catch(err => console.warn('[Cache] set error:', err.message));
        originalJson.call(this, data);
      };
      next();
    } catch (err) {
      console.warn('[Cache] error:', err.message);
      next();
    }
  };
};

app.use(express.static(path.join(__dirname, 'dist')));

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const setAuthCookie = (res, token) =>
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

function parseFile(buffer, mimetype, originalname) {
  if (!mimetype || !originalname) throw new Error('Missing mimetype or filename');

  let rows;
  if (mimetype === 'text/csv' || originalname.endsWith('.csv')) {
    rows = csvParse(buffer.toString(), { columns: true, skip_empty_lines: true, trim: true });
  } else if (mimetype.includes('spreadsheet') || mimetype.includes('excel') || originalname.endsWith('.xlsx') || originalname.endsWith('.xls')) {
    const wb = xlsxRead(buffer);
    rows = xlsxUtils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  } else if (mimetype === 'application/json' || originalname.endsWith('.json')) {
    const parsed = JSON.parse(buffer.toString());
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    throw new Error('Unsupported file format. Use CSV, Excel (.xlsx), or JSON.');
  }

  validateParsedRows(rows);
  return rows;
}

function validateParsedRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Dataset must contain at least one row of tabular JSON objects.');
  }
  if (!rows.every((row) => row && typeof row === 'object' && !Array.isArray(row))) {
    throw new Error('Uploaded file must contain tabular rows with key/value objects.');
  }
  const columns = Object.keys(rows[0]);
  if (columns.length === 0) {
    throw new Error('Uploaded dataset must have at least one column.');
  }
  for (const row of rows) {
    if (Object.keys(row).length !== columns.length) {
      throw new Error('Dataset rows must be consistent and tabular.');
    }
  }
}

async function insertDatasetRows(datasetId, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const batchSize = 250;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize).map((row, index) => ({
      dataset_id: datasetId,
      row_index: offset + index,
      data: row,
    }));
    const { error } = await supabase.from('dataset_rows').insert(batch);
    if (error) throw error;
  }
}

function mapConfidenceLabel(confidence) {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

async function createInsightsFromAnalysis(datasetId, snapshotId, analysisResult, userId) {
  if (!snapshotId) {
    throw new Error('Insight generation requires a valid snapshot_id');
  }

  const [{ data: dataset, error: datasetError }, { data: snapshot, error: snapshotError }] = await Promise.all([
    supabase.from('datasets').select('columns, version').eq('id', datasetId).single(),
    supabase.from('statistical_snapshots').select('*').eq('id', snapshotId).single(),
  ]);

  if (datasetError) throw datasetError;
  if (snapshotError) throw snapshotError;
  if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found when generating insights`);

  const findings = Array.isArray(analysisResult.top_findings) ? analysisResult.top_findings : [];
  const filteredFindings = findings.filter((finding) => finding && ['trend', 'anomaly', 'correlation'].includes(finding.type));

  const insightBase = {
    dataset_id: datasetId,
    snapshot_id: snapshotId,
    computation_id: analysisResult.computation_id,
    dataset_version: analysisResult.dataset_version || dataset.version,
    user_id: userId,
    trigger_type: 'auto',
    assumptions: { source: 'deterministic analytics' },
    limitations: [],
    hypotheses: [],
    recommended_actions: [],
    reasoning_trace: { source: 'analytics_engine' },
    is_proactive: false,
  };

  const insights = filteredFindings.map((finding) => {
    const confidence = typeof finding.confidence === 'number'
      ? Math.max(0, Math.min(0.97, finding.confidence))
      : Math.max(0, Math.min(0.97, analysisResult.confidence_base || 0.0));

    return {
      ...insightBase,
      insight_type: finding.type,
      title: finding.title,
      explanation: finding.explanation || finding.title,
      confidence,
      confidence_label: finding.confidence_label || mapConfidenceLabel(confidence),
      assumptions: finding.assumptions || insightBase.assumptions,
      limitations: finding.limitations || [],
      hypotheses: finding.hypotheses || [],
      evidence: finding.evidence || {},
      recommended_actions: finding.recommended_actions || [],
      reasoning_trace: finding.reasoning_trace || insightBase.reasoning_trace,
    };
  });

  if (insights.length === 0) {
    insights.push({
      ...insightBase,
      insight_type: 'summary',
      title: 'No significant patterns detected',
      explanation: 'The dataset does not show statistically significant trends, correlations, or anomalies based on current analysis.',
      confidence: 0.4,
      confidence_label: 'Low',
      evidence: {
        reason: 'No statistical thresholds met',
        sample_size: analysisResult.row_count || 0,
      },
    });
    console.info(`[Analytics] dataset ${datasetId} completed with summary insight fallback.`);
  }

  insights.forEach((insight) => validateInsightIntegrity(insight, dataset, snapshot));

  try {
    await supabase.from('insights').insert(insights);
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Dataset analytics complete',
      message: `${insights.length} structured insights are now available for your dataset.`,
      type: 'insight',
    }).catch(console.error);
    await logAuditEvent(datasetId, 'INSIGHT_GEN', 'success', `Generated ${insights.length} validated insights for snapshot ${snapshotId}`, {
      snapshot_id: snapshotId,
      computation_id: analysisResult.computation_id,
      insight_count: insights.length,
    });
  } catch (err) {
    await logAuditEvent(datasetId, 'INSIGHT_GEN', 'failed', `Insight insertion failed for snapshot ${snapshotId}: ${err.message}`, {
      snapshot_id: snapshotId,
      computation_id: analysisResult.computation_id,
    });
    throw err;
  }
}

async function storeSnapshotFromAnalysis(datasetId, analysisResult) {
  const { data: dataset, error: datasetError } = await supabase.from('datasets').select('version, row_count').eq('id', datasetId).single();
  if (datasetError) throw datasetError;
  if (!dataset) throw new Error('Dataset not found for snapshot storage');

  const snapshotId = analysisResult.snapshot_id || uuidv4();
  const computationId = analysisResult.computation_id || uuidv4();
  const datasetVersion = analysisResult.dataset_version || dataset.version;

  const snapshotPayload = {
    id: snapshotId,
    dataset_id: datasetId,
    computed_at: new Date().toISOString(),
    row_count: typeof analysisResult.row_count === 'number' ? analysisResult.row_count : dataset.row_count || 0,
    column_stats: analysisResult.column_stats || {},
    correlations: analysisResult.correlations || {},
    outliers: analysisResult.outliers || {},
    trends: analysisResult.trends || {},
    anomalies: analysisResult.anomalies || {},
    data_quality: analysisResult.data_quality || {},
    computation_id: computationId,
    dataset_version: datasetVersion,
    confidence_base: analysisResult.confidence_base || 0,
  };

  const { data, error } = await supabase.from('statistical_snapshots').insert(snapshotPayload).select().single();
  if (error) throw error;
  await logAuditEvent(datasetId, 'ANALYSIS', 'success', `Stored snapshot ${snapshotId} for dataset ${datasetId}`, {
    snapshot_id: snapshotId,
    computation_id: computationId,
    dataset_version: datasetVersion,
  });
  return data;
}

function getDatasetColumns(dataset) {
  return Array.isArray(dataset.columns) ? dataset.columns : [];
}

function validateInsightIntegrity(insight, dataset, snapshot) {
  if (!insight.snapshot_id) throw new Error('Insight is missing snapshot_id');
  if (insight.snapshot_id !== snapshot.id) throw new Error('Insight snapshot_id does not match stored snapshot');
  if (insight.dataset_id !== dataset.id) throw new Error('Insight dataset_id does not match dataset');
  if (insight.dataset_version == null || insight.dataset_version !== snapshot.dataset_version) {
    throw new Error('Insight dataset_version mismatch snapshot dataset_version');
  }
  if (typeof insight.confidence !== 'number' || insight.confidence < 0 || insight.confidence > 1) {
    throw new Error('Insight confidence must be a number between 0 and 1');
  }
  const evidence = insight.evidence || {};
  if (evidence.p_value != null) {
    if (typeof evidence.p_value !== 'number' || evidence.p_value < 0 || evidence.p_value > 1) {
      throw new Error('Insight evidence contains invalid p_value');
    }
  }
  if (evidence.correlation_coefficient != null) {
    if (typeof evidence.correlation_coefficient !== 'number' || evidence.correlation_coefficient < -1 || evidence.correlation_coefficient > 1) {
      throw new Error('Insight evidence contains invalid correlation_coefficient');
    }
  }
  if (Array.isArray(evidence.columns)) {
    const allowedColumns = getDatasetColumns(dataset);
    evidence.columns.forEach((column) => {
      if (!allowedColumns.includes(column)) {
        throw new Error(`Insight evidence references unknown column: ${column}`);
      }
    });
  }
  if (typeof evidence.sample_size === 'number' && evidence.sample_size > snapshot.row_count) {
    throw new Error('Insight evidence sample_size exceeds snapshot row_count');
  }
  if (insight.computation_id !== snapshot.computation_id) {
    throw new Error('Insight computation_id does not match snapshot computation_id');
  }
  return true;
}

function computeSnapshotDiff(previous, current) {
  if (!previous) {
    return {
      previous_exists: false,
      row_count_delta: null,
      correlation_count_delta: null,
      anomaly_count_delta: null,
      data_quality_delta: null,
    };
  }

  const prevCorrCount = Array.isArray(previous.correlations?.strong_correlations) ? previous.correlations.strong_correlations.length : 0;
  const currCorrCount = Array.isArray(current.correlations?.strong_correlations) ? current.correlations.strong_correlations.length : 0;
  const prevAnomalyCount = (Array.isArray(previous.anomalies?.extreme_values) ? previous.anomalies.extreme_values.length : 0)
    + (Array.isArray(previous.anomalies?.high_missing_data) ? previous.anomalies.high_missing_data.length : 0);
  const currAnomalyCount = (Array.isArray(current.anomalies?.extreme_values) ? current.anomalies.extreme_values.length : 0)
    + (Array.isArray(current.anomalies?.high_missing_data) ? current.anomalies.high_missing_data.length : 0);

  return {
    previous_exists: true,
    row_count_delta: current.row_count - previous.row_count,
    correlation_count_delta: currCorrCount - prevCorrCount,
    anomaly_count_delta: currAnomalyCount - prevAnomalyCount,
    data_quality_delta: (current.data_quality?.overall_score || 0) - (previous.data_quality?.overall_score || 0),
  };
}

function similarityColumns(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const normalizedLeft = left.map((c) => String(c).trim()).sort();
  const normalizedRight = right.map((c) => String(c).trim()).sort();
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function validateReasoningIntegrity(reasoningOutput, dataset, snapshot, insights = []) {
  if (!reasoningOutput.snapshot_id && !reasoningOutput.insight_id) {
    throw new Error('Reasoning output must reference a snapshot or an insight');
  }
  if (reasoningOutput.dataset_id !== dataset.id) {
    throw new Error('Reasoning output dataset_id mismatch');
  }
  if (reasoningOutput.snapshot_id && reasoningOutput.snapshot_id !== snapshot.id) {
    throw new Error('Reasoning output snapshot_id mismatch');
  }
  if (typeof reasoningOutput.confidence !== 'number' || reasoningOutput.confidence < 0 || reasoningOutput.confidence > 1) {
    throw new Error('Reasoning confidence must be in range [0,1]');
  }

  const primary = reasoningOutput.reasoning?.primary_explanation;
  if (!primary || !primary.supporting_evidence) {
    throw new Error('Reasoning output does not contain a primary explanation with supporting evidence');
  }

  const evidence = primary.supporting_evidence || {};
  const allowedColumns = getDatasetColumns(dataset);
  if (Array.isArray(evidence.columns)) {
    evidence.columns.forEach((column) => {
      if (!allowedColumns.includes(column)) {
        throw new Error(`Reasoning output references unknown column: ${column}`);
      }
    });
  }

  const traceableInsight = insights.find((insight) => insight.id === reasoningOutput.insight_id);
  if (reasoningOutput.insight_id && !traceableInsight) {
    throw new Error('Reasoning output references an insight that does not exist');
  }

  if (evidence.type === 'correlation') {
    const correlations = Array.isArray(snapshot.correlations?.strong_correlations) ? snapshot.correlations.strong_correlations : [];
    const match = correlations.some((corr) => similarityColumns(corr.columns, evidence.columns || []));
    if (!match) {
      throw new Error('Reasoning correlation evidence does not map to a computed correlation in the snapshot');
    }
    if (evidence.correlation_coefficient != null && (evidence.correlation_coefficient < -1 || evidence.correlation_coefficient > 1)) {
      throw new Error('Reasoning correlation coefficient is out of bounds');
    }
    if (evidence.p_value != null && (typeof evidence.p_value !== 'number' || evidence.p_value < 0 || evidence.p_value > 1)) {
      throw new Error('Reasoning evidence contains invalid p_value');
    }
  }

  if (evidence.type === 'trend' && evidence.column) {
    const trend = snapshot.trends?.[evidence.column];
    if (!trend) {
      throw new Error('Reasoning trend evidence does not map to a computed trend in the snapshot');
    }
  }

  if (evidence.type === 'anomaly' && evidence.column) {
    const anomalyMatch = [
      ...(Array.isArray(snapshot.anomalies?.extreme_values) ? snapshot.anomalies.extreme_values : []),
      ...(Array.isArray(snapshot.anomalies?.high_missing_data) ? snapshot.anomalies.high_missing_data : []),
    ].some((anomaly) => anomaly.column === evidence.column || anomaly.columns?.includes(evidence.column));
    if (!anomalyMatch) {
      throw new Error('Reasoning anomaly evidence does not map to a computed anomaly in the snapshot');
    }
  }

  if (reasoningOutput.reasoning?.input_signature) {
    if (reasoningOutput.reasoning.input_signature.dataset_version !== snapshot.dataset_version) {
      throw new Error('Reasoning input_signature dataset_version does not match snapshot');
    }
    if (reasoningOutput.reasoning.input_signature.computation_id !== reasoningOutput.computation_id) {
      throw new Error('Reasoning input_signature computation_id does not match computing record');
    }
  }

  return true;
}

function countAnomalies(anomalies) {
  if (!anomalies) return 0;
  return Object.values(anomalies).reduce((total, group) => {
    if (Array.isArray(group)) return total + group.length;
    return total;
  }, 0);
}

function computeKpis(snapshot) {
  const total_rows = snapshot?.row_count || 0;
  const data_quality_score = snapshot?.data_quality?.overall_score || 0;
  const anomaly_count = countAnomalies(snapshot?.anomalies);

  // Trends summary
  const trends = snapshot?.trends || {};
  const strongTrends = Object.entries(trends).filter(([_, t]) => t.strength && ['strong', 'moderate'].includes(t.strength));
  let trend_summary = 'No significant trends detected';
  if (strongTrends.length > 0) {
    const changes = strongTrends.map(([col, t]) => `${col} ${t.direction} ${Math.abs(t.pct_change).toFixed(0)}%`).slice(0, 3);
    trend_summary = `${strongTrends.length} key trends: ${changes.join(', ')}${strongTrends.length > 3 ? '...' : ''}`;
  }

  // Top correlations
  const corrs = Array.isArray(snapshot?.correlations?.strong_correlations) ? snapshot.correlations.strong_correlations.slice(0, 3) : [];
  const top_correlations = corrs.map(c => `${c.columns[0]}↔${c.columns[1]} (r=${c.r.toFixed(2)})`).join(', ') || 'None';

  return {
    total_rows,
    data_quality_score,
    anomaly_count,
    trend_summary,
    top_correlations,
  };
}

function generateKpiNarrative(kpis) {
  return `
This dataset contains ${kpis.total_rows.toLocaleString()} records with a data quality score of ${(kpis.data_quality_score * 100).toFixed(1)}%.

We detected ${kpis.anomaly_count} anomalies that may require investigation.

Key trends indicate: ${kpis.trend_summary}.

Strong relationships were found in: ${kpis.top_correlations}.
`.trim();
}

async function logAuditEvent(datasetId, actionType, status, message, details = null) {
  try {
    await supabase.from('audit_logs').insert({
      dataset_id: datasetId,
      action_type: actionType,
      status,
      message,
      details,
    });
  } catch (err) {
    console.warn('[Audit] failed to persist event', actionType, datasetId, err.message || err);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sampleWeight(rowCount) {
  if (rowCount <= 30) return 0.15;
  if (rowCount <= 100) return 0.35;
  if (rowCount <= 500) return 0.65;
  return 0.9;
}

function normalizePValue(pValue) {
  if (pValue == null) return null;
  if (typeof pValue !== 'number' || Number.isNaN(pValue)) return null;
  if (pValue <= 0) return 0;
  const capped = Math.min(pValue, 0.1);
  return 1 - capped / 0.1;
}

function buildCorrelationHypothesis(corr, context) {
  const r = Math.abs(corr.r || 0);
  const pValue = corr.p_value || 1;
  const strength = corr.strength || 'weak';
  const sample = corr.sample_size || context.row_count || 0;
  const correlationScore = clamp(0.2 + 0.4 * r + 0.2 * normalizePValue(pValue) + 0.2 * sampleWeight(sample), 0, 0.97);
  const confidenceLabel = correlationScore >= 0.8 ? 'High' : correlationScore >= 0.6 ? 'Medium' : 'Low';

  const uncertainty = [
    'Correlation does not imply causation.',
    'The signal is based on the current sample only.',
  ];
  if (pValue > 0.05) uncertainty.push('Statistical significance is weaker than standard thresholds.');
  if (sample < 50) uncertainty.push('Sample size is limited for this variable pair.');

  return {
    hypothesis: `The strongest evidence points to a ${corr.direction} association between ${corr.columns[0]} and ${corr.columns[1]}, but it is not proof of direct causation.`,
    score: correlationScore,
    supporting_evidence: {
      type: 'correlation',
      columns: corr.columns,
      correlation_coefficient: corr.r,
      p_value: pValue,
      sample_size: sample,
      strength,
      row_count: context.row_count,
      data_quality: context.data_quality?.overall_score,
    },
    limitations: uncertainty,
    recommended_actions: [
      'Validate the relationship with domain expertise.',
      'Check for possible confounders or shared drivers.',
      'Monitor the same variables in fresh data to confirm persistence.',
    ],
  };
}

function buildTrendHypothesis(column, trend, context) {
  const r2 = trend.r_squared || 0;
  const direction = trend.direction || 'flat';
  const strengthScore = trend.strength === 'strong' ? 1 : trend.strength === 'moderate' ? 0.7 : 0.4;
  const trendScore = clamp(0.18 + 0.4 * r2 + 0.22 * strengthScore + 0.2 * sampleWeight(context.row_count || 0), 0, 0.97);

  const uncertainty = [
    'Linear trend models may miss seasonality and non-linear effects.',
    'The pattern is derived from the current dataset only.',
  ];
  if (direction === 'flat') uncertainty.push('The trend is weak and may be noise.');

  return {
    hypothesis: `The data suggests a ${trend.strength} ${direction} trend in ${column} based on the current sample.`,
    score: trendScore,
    supporting_evidence: {
      type: 'trend',
      column,
      r_squared: r2,
      slope: trend.slope,
      pct_change: trend.pct_change,
      row_count: context.row_count,
      data_quality: context.data_quality?.overall_score,
    },
    limitations: uncertainty,
    recommended_actions: [
      'Review the underlying time or index ordering for this column.',
      'Check whether the trend persists in the next sample.',
      'Avoid assuming this trend implies a causal business driver.',
    ],
  };
}

function buildAnomalyHypothesis(anomaly, context) {
  if (anomaly.z_score !== undefined) {
    const z = Math.abs(anomaly.z_score || 0);
    const anomalyScore = clamp(0.25 + 0.25 * Math.min(z / 4, 1) + 0.2 * sampleWeight(context.row_count || 0) + 0.15 * (context.confidence_base || 0), 0, 0.95);
    return {
      hypothesis: `The anomaly in ${anomaly.column} appears driven by an outlier observation (z-score ${anomaly.z_score.toFixed(2)}).`,
      score: anomalyScore,
      supporting_evidence: {
        type: 'anomaly',
        column: anomaly.column,
        value: anomaly.value,
        z_score: anomaly.z_score,
        severity: anomaly.severity,
        row_count: context.row_count,
      },
      limitations: [
        'Outliers may reflect real events rather than data errors.',
        'This conclusion is based on a single statistical signal.',
      ],
      recommended_actions: [
        'Verify the raw source for the outlier record.',
        'Consider whether the value should be treated as a true event or cleaned.',
      ],
    };
  }

  if (anomaly.null_pct !== undefined) {
    const missingScore = clamp(0.25 + 0.25 * Math.min(anomaly.null_pct / 0.4, 1) + 0.2 * sampleWeight(context.row_count || 0) + 0.15 * (context.data_quality?.overall_score || 0), 0, 0.92);
    return {
      hypothesis: `The dataset may be biased by missing values in ${anomaly.column} (${Math.round(anomaly.null_pct * 100)}% missing).`,
      score: missingScore,
      supporting_evidence: {
        type: 'anomaly',
        column: anomaly.column,
        null_pct: anomaly.null_pct,
        null_count: anomaly.null_count,
        severity: anomaly.severity,
        row_count: context.row_count,
      },
      limitations: [
        'Missing data can distort relationships and trend estimates.',
        'The true effect depends on why values are missing.',
      ],
      recommended_actions: [
        'Inspect the data collection process for this column.',
        'Impute or collect missing values before re-running analysis.',
      ],
    };
  }

  return null;
}

function buildNoStrongRelationshipHypothesis(context) {
  const baseScore = clamp(0.35 + 0.15 * (context.data_quality?.overall_score || 0) + 0.15 * sampleWeight(context.row_count || 0), 0, 0.75);
  return {
    hypothesis: 'No strong causal relationship can be established from the available computed statistics; current findings are primarily correlational or trend-based.',
    score: baseScore,
    supporting_evidence: {
      type: 'fallback',
      row_count: context.row_count,
      data_quality: context.data_quality?.overall_score,
      confidence_base: context.confidence_base,
    },
    limitations: [
      'The current data and metrics do not support a definitive causal claim.',
      'This is a conservative interpretation to avoid overstatement.',
    ],
    recommended_actions: [
      'Collect more data and repeated measurements.',
      'Use domain knowledge before inferring cause-and-effect.',
    ],
  };
}

function buildReasoningOutput(dataset, snapshot, analysisResult) {
  const context = {
    row_count: snapshot?.row_count || analysisResult.row_count || dataset?.row_count || 0,
    data_quality: snapshot?.data_quality || analysisResult.data_quality || {},
    confidence_base: analysisResult.confidence_base || 0,
  };

  const candidates = [];
  const correlations = snapshot?.correlations || analysisResult.correlations || {};
  const trendData = snapshot?.trends || analysisResult.trends || {};
  const anomalies = snapshot?.anomalies || analysisResult.anomalies || {};

  if (Array.isArray(correlations?.strong_correlations)) {
    for (const corr of correlations.strong_correlations) {
      candidates.push(buildCorrelationHypothesis(corr, context));
    }
  }

  if (trendData && typeof trendData === 'object') {
    for (const [column, trend] of Object.entries(trendData)) {
      if (trend && (trend.strength === 'strong' || trend.strength === 'moderate')) {
        candidates.push(buildTrendHypothesis(column, trend, context));
      }
    }
  }

  if (anomalies?.extreme_values) {
    for (const anomaly of anomalies.extreme_values.slice(0, 2)) {
      const candidate = buildAnomalyHypothesis(anomaly, context);
      if (candidate) candidates.push(candidate);
    }
  }

  if (anomalies?.high_missing_data) {
    for (const anomaly of anomalies.high_missing_data.slice(0, 2)) {
      const candidate = buildAnomalyHypothesis(anomaly, context);
      if (candidate) candidates.push(candidate);
    }
  }

  if (candidates.length === 0) {
    candidates.push(buildNoStrongRelationshipHypothesis(context));
  }

  const sorted = candidates
    .map((candidate) => ({ ...candidate, score: clamp(candidate.score, 0, 1) }))
    .sort((a, b) => b.score - a.score);

  const primary = sorted[0];
  const alternatives = sorted.slice(1, 3);
  const uncertaintyFactors = Array.from(new Set([
    ...primary.limitations,
    ...alternatives.flatMap((alt) => alt.limitations || []),
  ])).slice(0, 5);

  const recommendedNextSteps = Array.from(new Set([
    ...primary.recommended_actions,
    ...alternatives.flatMap((alt) => alt.recommended_actions || []),
  ])).slice(0, 5);

  return {
    primary_explanation: primary,
    alternative_explanations: alternatives,
    confidence: primary.score,
    uncertainty_factors: uncertaintyFactors,
    recommended_next_steps: recommendedNextSteps,
    input_signature: {
      dataset_name: dataset?.name,
      row_count: context.row_count,
      dataset_version: analysisResult.dataset_version,
      computation_id: analysisResult.computation_id,
    },
  };
}

async function createReasoningFromAnalysis(datasetId, snapshotId, analysisResult, userId) {
  try {
    const [{ data: dataset, error: datasetError }, { data: snapshot, error: snapshotError }, { data: insightRows, error: insightError }] = await Promise.all([
      supabase.from('datasets').select('id, name, original_filename, columns, row_count, file_format, version').eq('id', datasetId).single(),
      supabase.from('statistical_snapshots').select('*').eq('id', snapshotId).single(),
      supabase.from('insights').select('id, insight_type, evidence, snapshot_id, computation_id').eq('dataset_id', datasetId).eq('snapshot_id', snapshotId),
    ]);

    if (datasetError) throw datasetError;
    if (snapshotError) throw snapshotError;
    if (insightError) throw insightError;

    const reasoning = buildReasoningOutput(dataset, snapshot, analysisResult);
    const insightId = insightRows?.[0]?.id || null;
    const reasoningRecord = {
      dataset_id: datasetId,
      insight_id: insightId,
      snapshot_id: snapshotId,
      computation_id: analysisResult.computation_id,
      dataset_version: analysisResult.dataset_version || dataset.version,
      reasoning,
      confidence: reasoning.confidence,
      uncertainty_factors: reasoning.uncertainty_factors,
      recommended_next_steps: reasoning.recommended_next_steps,
    };

    validateReasoningIntegrity(reasoningRecord, dataset, snapshot, insightRows || []);

    await supabase.from('reasoning_outputs').insert(reasoningRecord);
    await logAuditEvent(datasetId, 'REASONING_GEN', 'success', `Generated reasoning output for snapshot ${snapshotId}`, {
      snapshot_id: snapshotId,
      insight_id: insightId,
      computation_id: analysisResult.computation_id,
    });
  } catch (err) {
    await logAuditEvent(datasetId, 'REASONING_GEN', 'failed', `Reasoning generation failed for dataset ${datasetId}: ${err.message}`, {
      dataset_id: datasetId,
      snapshot_id: snapshotId,
      computation_id: analysisResult.computation_id,
    });
    console.error('[Reasoning] generation failed for dataset', datasetId, err.message || err);
    throw err;
  }
}

async function fetchAnalyticsWithRetry(datasetId, maxAttempts = 2, timeoutMs = 45000) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const analyticsUrl = `${ANALYTICS_URL}/analyze/dataset/${datasetId}`;

    try {
      const response = await fetch(analyticsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ANALYTICS_TOKEN,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const analysisResult = await response.json();
      if (!response.ok) {
        const err = new Error(analysisResult.detail || analysisResult.error || `Analytics returned status ${response.status}`);
        lastError = err;
        console.warn('[Analytics Retry] attempt', attempt, 'failed for dataset', datasetId, err.message);
        continue;
      }
      return analysisResult;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      console.warn('[Analytics Retry] attempt', attempt, 'failed for dataset', datasetId, err.message || err);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError || new Error('Analytics retry failed');
}

async function processDatasetAsync(datasetId, userId) {
  const startTime = Date.now();
  console.info(JSON.stringify({ event: 'dataset_processing', dataset_id: datasetId, status: 'processing', user_id: userId, started_at: new Date().toISOString() }));

  try {
    await supabase.from('datasets').update({ status: 'processing', processing_started_at: new Date().toISOString(), status_reason: null }).eq('id', datasetId);
    const analysisResult = await fetchAnalyticsWithRetry(datasetId, 2, 45000);
    await logAuditEvent(datasetId, 'ANALYSIS', 'started', `Analytics request completed, storing snapshot and lineage data.`, {
      computation_id: analysisResult.computation_id,
      snapshot_id: analysisResult.snapshot_id,
    });

    const snapshot = await storeSnapshotFromAnalysis(datasetId, analysisResult);
    await createInsightsFromAnalysis(datasetId, snapshot.id, analysisResult, userId);
    await createReasoningFromAnalysis(datasetId, snapshot.id, analysisResult, userId);
    await supabase.from('datasets').update({ status: 'completed', processed_at: new Date().toISOString(), status_reason: null }).eq('id', datasetId);

    const durationMs = Date.now() - startTime;
    console.info(JSON.stringify({ event: 'dataset_processing', dataset_id: datasetId, status: 'completed', duration_ms: durationMs, insight_count: analysisResult.top_findings?.length || 0, computation_id: analysisResult.computation_id }));
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const reason = err.message || 'Unknown analytics failure';
    console.error(JSON.stringify({ event: 'dataset_processing', dataset_id: datasetId, status: 'error', duration_ms: durationMs, error: reason }));
    await logAuditEvent(datasetId, 'ANALYSIS', 'failed', `Dataset processing failed: ${reason}`, { error: reason });
    await supabase.from('datasets').update({ status: 'error', status_reason: reason }).eq('id', datasetId);
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Dataset processing failed',
      message: `Analytics processing failed for dataset ${datasetId}. Reason: ${reason}`,
      type: 'system',
    }).catch(console.error);
  }
}

async function recomputeDataset(datasetId, userId) {
  const { data: dataset, error: datasetError } = await supabase.from('datasets').select('*').eq('id', datasetId).single();
  if (datasetError) throw datasetError;
  if (!dataset) throw new Error('Dataset not found');

  const { data: previousSnapshot } = await supabase.from('statistical_snapshots').select('*').eq('dataset_id', datasetId).order('computed_at', { ascending: false }).limit(1).maybeSingle();
  await logAuditEvent(datasetId, 'RECOMPUTE', 'started', `Recompute triggered for dataset version ${dataset.version}`, {
    previous_snapshot_id: previousSnapshot?.id || null,
    dataset_version: dataset.version,
  });

  await supabase.from('datasets').update({ status: 'processing', processing_started_at: new Date().toISOString(), status_reason: null }).eq('id', datasetId);
  const analysisResult = await fetchAnalyticsWithRetry(datasetId, 3, 45000);
  analysisResult.computation_id = uuidv4();
  analysisResult.snapshot_id = uuidv4();
  analysisResult.dataset_version = dataset.version;

  const storedSnapshot = await storeSnapshotFromAnalysis(datasetId, analysisResult);
  await createInsightsFromAnalysis(datasetId, storedSnapshot.id, analysisResult, userId);
  await createReasoningFromAnalysis(datasetId, storedSnapshot.id, analysisResult, userId);

  await supabase.from('datasets').update({ status: 'completed', processed_at: new Date().toISOString(), status_reason: null }).eq('id', datasetId);

  const diff = computeSnapshotDiff(previousSnapshot || null, storedSnapshot);
  await logAuditEvent(datasetId, 'RECOMPUTE', 'completed', 'Recompute finished and preserved historical snapshot data.', {
    previous_snapshot_id: previousSnapshot?.id || null,
    new_snapshot_id: storedSnapshot.id,
    diff,
  });

  return { snapshot_id: storedSnapshot.id, computation_id: analysisResult.computation_id };
}

const NEXUS_SYSTEM_PROMPT = `You are Nex — a senior data analytics engineer embedded inside Nexus Analytics. You have deep expertise in data engineering, statistical analysis, business intelligence, and machine learning. You think like a principal data scientist, communicate like a trusted colleague, and you get straight to what matters.

You are NOT a generic chatbot. You are a domain expert.

## IDENTITY AND TONE
- Warm, sharp, and direct — like a brilliant senior colleague who genuinely wants to help
- Confident without being arrogant. Precise without being cold.
- You never say "Great question!", "Certainly!", "Of course!", or "As an AI"
- You never ask multiple questions at once — one focused question maximum per reply
- You match the user's energy: casual when they're casual, technical when they need depth
- You reason out loud on complex problems — show brief thinking before conclusions

## GREETING BEHAVIOR — STRICTLY ENFORCED
When a user says Hi, Hello, Hey, or any casual opener:
- Greet them warmly and genuinely, like a person — not like a help desk
- Introduce yourself in ONE sentence
- Offer ONE clear opening — not a list of options

CORRECT: "Hey, good to meet you! I'm Nex — your analytics co-pilot here. Whether you're knee-deep in a dataset or just getting started, I've got you. What are we working on?"
CORRECT: "Hi there! Nex here — senior data analyst, at your service. What's on your plate today?"

WRONG (never do this): "How can I help you with Nexus Analytics today? Do you have questions about a feature, need help with data analysis, or want to troubleshoot an issue?"

## HOW YOU THINK ABOUT DATA PROBLEMS
When a user shares a business or data problem, you approach it like a senior analyst:
1. Identify the problem type: descriptive, diagnostic, predictive, or prescriptive
2. Ask the ONE most important clarifying question if needed
3. Recommend a specific analytical approach with your reasoning
4. Explain what the output will reveal and why it matters for the decision

You are fluent in:
- EDA: distributions, outliers, correlation, missing data, cardinality, skew
- Business metrics: CAC, LTV, churn, MRR, ARR, DAU/MAU, retention cohorts, conversion funnels
- Statistics: significance testing, confidence intervals, regression, clustering, segmentation, A/B testing
- Data quality: schema issues, duplicates, data drift, sampling bias, null patterns
- Visualization: which chart fits which question and why — you never suggest a pie chart for time series
- SQL: window functions, CTEs, aggregations, self-joins — you write real queries, not pseudocode
- Industry benchmarks: you know what healthy SaaS churn looks like, what a normal LTV:CAC ratio is, what good e-commerce conversion rates are

## INTELLIGENT FOLLOW-UP QUESTIONS
When you need context, ask the single most important question — make it specific:

GOOD: "What time period does this cover — and is this monthly revenue or transaction-level data?"
GOOD: "Is the drop happening across all user segments or concentrated in one cohort?"
GOOD: "Before I suggest a model — what decision will this analysis drive? That changes everything."
BAD: "What kind of data do you have?" (too vague)
BAD: Asking two questions in one reply

## NEXUS PLATFORM KNOWLEDGE
- Upload: CSV, Excel (.xlsx), JSON — up to 100MB per file
- AI insights generated automatically after every upload
- Visualizations: line, bar, scatter, heatmap, funnel, cohort charts
- Anomaly detection, trend recognition, pattern analysis
- Natural language querying — ask questions about data in plain English
- Team collaboration: shared datasets, comments, co-editing
- Automated scheduled reports: PDF, CSV, Excel export
- RBAC and full audit logs
- REST API for custom pipelines and integrations
-Descriptive statistics
-mean
-median
-std
-min/max
-quartiles
-skewness
-normality test
-Correlation analysis
-Pearson correlation
-p-value significance
-strength and direction
-Trend detection
-linear regression slope
-R²
-direction and strength
-percent change
-Outlier detection
-IQR boundaries
-z-score extreme values
-Isolation Forest sampling


## PRICING
- Starter (Free): 1 dataset, basic analytics, 5 visualizations, 7-day Pro trial
- Professional ($79/month or $65/month annually): 20 datasets, advanced analytics, unlimited visualizations, 5-member team, API access
- Enterprise ($149/month or $125/month annually): Unlimited datasets, ML insights, custom IAM, SSO/SAML, SLA support
- Annual billing: 20% savings on all paid plans

## RESPONSE FORMAT
- Lead with the answer — never with preamble or pleasantries mid-conversation
- Bullets only for genuine lists of 3+ items
- Numbered steps for sequential instructions
- Code blocks for all SQL, Python, or JSON
- Under 200 words unless complexity genuinely requires more
- Never fabricate statistics — if uncertain, say so and reason from principles
- Escalate unresolvable issues to support@nexusanalytics.com`;

// ROUTES

app.get('/api/health', cacheMiddleware(30), (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase.from('users').insert({ name, email, password_hash, provider: 'email' }).select().single();
    if (error) { console.error('[signup]', error.message); return res.status(500).json({ error: 'Failed to create account' }); }
    supabase.from('notifications').insert({ user_id: user.id, title: 'Welcome to Nexus Analytics!', message: 'Your account is ready. Upload your first dataset to get AI-powered insights.', type: 'system' }).catch(console.error);
    setAuthCookie(res, signToken(user));
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'starter' } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid email or password' });
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Invalid email or password' });
    setAuthCookie(res, signToken(user));
    return res.json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'starter', avatar_url: user.avatar_url } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error during signin' });
  }
});

app.post('/auth/signout', (_req, res) => { res.clearCookie('token'); return res.json({ success: true }); });

app.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan || 'starter', avatar_url: user.avatar_url, role: user.role, bio: user.bio } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user?.password_hash) return res.status(400).json({ error: 'Cannot change password for OAuth accounts' });
    if (!await bcrypt.compare(currentPassword, user.password_hash)) return res.status(401).json({ error: 'Current password is incorrect' });
    await supabase.from('users').update({ password_hash: await bcrypt.hash(newPassword, 12) }).eq('id', req.user.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/auth/google', (_req, res) => {
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: `${CLIENT_URL}/auth/google/callback`, response_type: 'code', scope: 'openid email profile', access_type: 'offline', prompt: 'select_account' });
  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect('/?auth_error=google_denied');
  try {
    const tokens = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: `${CLIENT_URL}/auth/google/callback`, grant_type: 'authorization_code' }) })).json();
    if (!tokens.access_token) return res.redirect('/?auth_error=google_token_failed');
    const gu = await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } })).json();
    let { data: user } = await supabase.from('users').select('*').eq('email', gu.email).maybeSingle();
    if (!user) {
      const { data: nu, error: ce } = await supabase.from('users').insert({ name: gu.name, email: gu.email, avatar_url: gu.picture, provider: 'google', provider_id: gu.sub }).select().single();
      if (ce) return res.redirect('/?auth_error=db_error');
      user = nu;
      supabase.from('notifications').insert({ user_id: user.id, title: 'Welcome to Nexus Analytics!', message: 'Signed in with Google.', type: 'system' }).catch(console.error);
    } else {
      supabase.from('users').update({ avatar_url: gu.picture }).eq('id', user.id).catch(console.error);
    }
    setAuthCookie(res, signToken(user));
    return res.redirect('/?auth_success=true');
  } catch (err) {
    return res.redirect('/?auth_error=google_failed');
  }
});

app.get('/auth/github', (_req, res) => {
  const params = new URLSearchParams({ client_id: process.env.GITHUB_CLIENT_ID, redirect_uri: `${CLIENT_URL}/auth/github/callback`, scope: 'user:email' });
  return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect('/?auth_error=github_denied');
  try {
    const td = await (await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }) })).json();
    if (!td.access_token) return res.redirect('/?auth_error=github_token_failed');
    const ghH = { Authorization: `Bearer ${td.access_token}`, 'User-Agent': 'Nexus-Analytics' };
    const gu = await (await fetch('https://api.github.com/user', { headers: ghH })).json();
    let email = gu.email;
    if (!email) {
      const emails = await (await fetch('https://api.github.com/user/emails', { headers: ghH })).json();
      email = emails.find((e) => e.primary && e.verified)?.email;
    }
    if (!email) return res.redirect('/?auth_error=github_no_email');
    let { data: user } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!user) {
      const { data: nu, error: ce } = await supabase.from('users').insert({ name: gu.name || gu.login, email, avatar_url: gu.avatar_url, provider: 'github', provider_id: String(gu.id) }).select().single();
      if (ce) return res.redirect('/?auth_error=db_error');
      user = nu;
      supabase.from('notifications').insert({ user_id: user.id, title: 'Welcome to Nexus Analytics!', message: 'Signed in with GitHub.', type: 'system' }).catch(console.error);
    } else {
      supabase.from('users').update({ avatar_url: gu.avatar_url }).eq('id', user.id).catch(console.error);
    }
    setAuthCookie(res, signToken(user));
    return res.redirect('/?auth_success=true');
  } catch (err) {
    return res.redirect('/?auth_error=github_failed');
  }
});

app.get('/api/datasets', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('datasets').select('*').eq('user_id', req.user.id).order('uploaded_at', { ascending: false });
    if (error) throw error;
    return res.json({ datasets: data || [] });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/datasets/:id/status', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('datasets').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/datasets/:id/snapshot', verifyToken, async (req, res) => {
  try {
    const response = await fetch(`${ANALYTICS_URL}/snapshot/${req.params.id}/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANALYTICS_TOKEN,
      },
    });
    const snapshot = await response.json();
    return res.status(response.status).json(snapshot);
  } catch (err) {
    return res.status(500).json({ error: 'Snapshot service unavailable', detail: err.message });
  }
});

app.get('/api/datasets/:id/kpi-summary', verifyToken, async (req, res) => {
  try {
    // Fetch snapshot first
    const snapshotResponse = await fetch(`${ANALYTICS_URL}/snapshot/${req.params.id}/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANALYTICS_TOKEN,
      },
    });

    if (!snapshotResponse.ok) {
      return res.status(snapshotResponse.status).json({ error: 'Snapshot unavailable' });
    }

    const snapshot = await snapshotResponse.json();

    if (!snapshot) {
      return res.json({
        kpis: null,
        narrative: null
      });
    }

    const kpis = computeKpis(snapshot);
    const narrative = generateKpiNarrative(kpis);

    return res.json({ kpis, narrative });
  } catch (err) {
    console.error('[KPI Summary] error:', err);
    return res.status(500).json({ error: 'KPI computation failed', detail: err.message });
  }
});

app.post('/api/datasets/:id/recompute', verifyToken, async (req, res) => {
  try {
    const { snapshot_id, computation_id } = await recomputeDataset(req.params.id, req.user.id);
    return res.status(200).json({ status: 'recompute_completed', snapshot_id, computation_id });
  } catch (err) {
    console.error('[Recompute] failed', err.message || err);
    return res.status(500).json({ error: err.message });
  }
});

function sanitizeAuditDetails(details) {
  if (details == null) return null;

  const redactKey = (key) => /token|secret|password|credential|api[_-]?key|access[_-]?token/i.test(key);

  const sanitizeObject = (obj, depth = 0) => {
    if (obj == null || depth > 3) return '[REDACTED]';
    if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item, depth + 1));

    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (redactKey(key)) {
        acc[key] = '[REDACTED]';
        return acc;
      }

      if (typeof value === 'string') {
        acc[key] = value.length > 1000 ? `${value.slice(0, 1000)}...` : value;
      } else if (typeof value === 'object') {
        acc[key] = sanitizeObject(value, depth + 1);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
  };

  if (typeof details === 'string') {
    return details.length > 1000 ? `${details.slice(0, 1000)}...` : details;
  }

  const sanitized = sanitizeObject(details);
  if (typeof sanitized === 'object' && sanitized !== null) {
    const entries = Object.entries(sanitized);
    if (entries.length > 20) {
      return Object.fromEntries(entries.slice(0, 20).concat([['_truncated', true]]));
    }
  }
  return sanitized;
}

app.get('/api/datasets/:id/audit-logs', verifyToken, async (req, res) => {
  try {
    const { limit = 50, action_type, status } = req.query;
    const requestedLimit = parseInt(limit, 10);
    const limitNum = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 50;

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('dataset_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (action_type) query = query.eq('action_type', action_type);
    if (status) query = query.eq('status', status);

    const { data: logs, error } = await query;
    if (error) throw error;

    const sanitizedLogs = (logs || []).map(log => ({
      id: log.id,
      action_type: log.action_type,
      status: log.status,
      message: typeof log.message === 'string'
        ? log.message.length > 500 ? `${log.message.slice(0, 500)}...` : log.message
        : log.message,
      details: sanitizeAuditDetails(log.details),
      created_at: log.created_at,
    }));

    res.json({ audit_logs: sanitizedLogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/datasets/:id/lineage', verifyToken, async (req, res) => {
  try {
    const { data: dataset, error: datasetError } = await supabase.from('datasets').select('id, version, status, processing_started_at, processed_at, status_reason').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (datasetError) throw datasetError;
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const [{ data: snapshot, error: snapshotError }, { data: reasoning, error: reasoningError }] = await Promise.all([
      supabase.from('statistical_snapshots').select('id, computation_id, dataset_version, row_count, computed_at').eq('dataset_id', req.params.id).order('computed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('reasoning_outputs').select('id, insight_id, snapshot_id, computation_id, dataset_version, confidence, created_at').eq('dataset_id', req.params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (snapshotError) throw snapshotError;
    if (reasoningError) throw reasoningError;

    const validation = {
      insights: 'pending',
      reasoning: 'pending',
    };

    if (snapshot) {
      try {
        const { data: insights } = await supabase.from('insights').select('*').eq('dataset_id', req.params.id).eq('snapshot_id', snapshot.id);
        insights.forEach((insight) => validateInsightIntegrity(insight, dataset, snapshot));
        validation.insights = 'valid';
      } catch (err) {
        validation.insights = 'failed';
        validation.insights_error = err.message;
      }
    } else {
      validation.insights = 'missing';
    }

    if (reasoning && snapshot) {
      try {
        validateReasoningIntegrity(reasoning, dataset, snapshot, []);
        validation.reasoning = 'valid';
      } catch (err) {
        validation.reasoning = 'failed';
        validation.reasoning_error = err.message;
      }
    } else if (!reasoning) {
      validation.reasoning = 'missing';
    }

    return res.json({ dataset, latest_snapshot: snapshot, latest_reasoning: reasoning, validation });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/datasets', verifyToken, async (req, res) => {
  try {
    const { name, file_format, row_count, file_size, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Dataset name required' });
    const rowCount = Number(row_count || 0);
    const { data, error } = await supabase.from('datasets').insert({
      user_id: req.user.id,
      name: name.trim(),
      original_filename: name.trim(),
      file_format: file_format || 'CSV',
      row_count: rowCount,
      file_size: Number(file_size || 0),
      column_count: 0,
      columns: [],
      description: description || '',
      status: 'uploaded',
      status_reason: null,
    }).select().single();
    if (error) throw error;
    return res.status(201).json({ dataset: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/datasets/upload', verifyToken, fileUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File upload required. Attach a CSV, Excel, or JSON file.' });
    }

    if (req.file.size > 25 * 1024 * 1024) {
      return res.status(413).json({ error: 'Uploaded file exceeds the 25MB maximum size limit.' });
    }

    let rows;
    try {
      rows = parseFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (parseError) {
      return res.status(400).json({ error: `File parse error: ${parseError.message}` });
    }

    const name = (req.body.name || req.file.originalname.replace(/\.[^/.]+$/, '')).trim();
    const fileFormat = req.file.originalname.split('.').pop().toUpperCase();
    const fileSize = req.file.size;
    const rowCount = rows.length;
    const columns = Object.keys(rows[0] || {});

    if (!name) return res.status(400).json({ error: 'Dataset name required' });
    if (rowCount === 0) return res.status(400).json({ error: 'Dataset must contain at least one row.' });
    if (columns.length === 0) return res.status(400).json({ error: 'Dataset must contain at least one column.' });

    const { data, error } = await supabase.from('datasets').insert({
      user_id: req.user.id,
      name,
      original_filename: req.file.originalname,
      description: req.body.description || '',
      file_format: fileFormat,
      file_size: fileSize,
      row_count: rowCount,
      column_count: columns.length,
      columns,
      status: 'uploaded',
      status_reason: null,
    }).select().single();

    if (error) throw error;

    await logAuditEvent(data.id, 'UPLOAD', 'success', `Dataset ${data.id} uploaded successfully`, {
      original_filename: data.original_filename,
      row_count: data.row_count,
      column_count: data.column_count,
      dataset_version: data.version,
    });

    try {
      await insertDatasetRows(data.id, rows);
      await supabase.from('datasets').update({ status: 'processing', processing_started_at: new Date().toISOString(), status_reason: null }).eq('id', data.id);
      processDatasetAsync(data.id, req.user.id).catch((err) => console.error('[async processDatasetAsync]', err.message || err));
    } catch (rowError) {
      await logAuditEvent(data.id, 'UPLOAD', 'failed', `Failed to store dataset rows: ${rowError.message}`, {
        dataset_id: data.id,
        error: rowError.message,
      });
      await supabase.from('datasets').update({ status: 'error', status_reason: rowError.message || 'Failed to store dataset rows' }).eq('id', data.id);
      throw rowError;
    }

    return res.status(201).json({ dataset: { ...data, status: 'processing', processing_started_at: new Date().toISOString() } });
  } catch (err) {
    console.error('[Upload] failed', err.message || err);
    return res.status(500).json({ error: err.message });
  }
});


app.get('/api/datasets/:id/insights', verifyToken, async (req, res) => {
  try {
    const { data: dataset, error: datasetError } = await supabase.from('datasets').select('status, status_reason').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (datasetError) throw datasetError;
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    if (dataset.status === 'processing' || dataset.status === 'uploaded') {
      return res.status(409).json({ error: 'Insights unavailable until dataset processing completes', status: dataset.status });
    }
    if (dataset.status === 'error') {
      return res.status(500).json({ error: 'Dataset processing failed', reason: dataset.status_reason || 'Unknown error' });
    }

    const { data, error } = await supabase.from('insights').select('*').eq('dataset_id', req.params.id).order('created_at', { ascending: true });
    if (error) throw error;
    const insights = (data || []).map((insight) => ({
      id: insight.id,
      dataset_id: insight.dataset_id,
      snapshot_id: insight.snapshot_id,
      computation_id: insight.computation_id,
      dataset_version: insight.dataset_version,
      type: insight.insight_type,
      title: insight.title,
      description: insight.explanation,
      confidence: Number(insight.confidence),
      confidence_label: insight.confidence_label,
      evidence: insight.evidence || {},
      created_at: insight.created_at,
      source: insight.reasoning_trace || { source: 'analytics_engine' }
    }));
    return res.json({ insights });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/datasets/:id/reasoning', verifyToken, async (req, res) => {
  try {
    const { data: dataset, error: datasetError } = await supabase.from('datasets').select('status, status_reason').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (datasetError) throw datasetError;
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    if (dataset.status === 'processing' || dataset.status === 'uploaded') {
      return res.status(409).json({ error: 'Reasoning unavailable until dataset processing completes', status: dataset.status });
    }
    if (dataset.status === 'error') {
      return res.status(500).json({ error: 'Dataset processing failed', reason: dataset.status_reason || 'Unknown error' });
    }

    const { data, error } = await supabase.from('reasoning_outputs').select('*').eq('dataset_id', req.params.id).order('created_at', { ascending: false }).limit(1).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'No reasoning output found for this dataset' });

    return res.json({ reasoning: data.reasoning, confidence: Number(data.confidence), uncertainty_factors: data.uncertainty_factors || [], recommended_next_steps: data.recommended_next_steps || [], created_at: data.created_at });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/datasets/:id/comments', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('comments').select('*').eq('dataset_id', req.params.id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ comments: data || [] });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/datasets/:id/comments', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    const { data: userRow } = await supabase.from('users').select('name').eq('id', req.user.id).single();
    const { data, error } = await supabase.from('comments').insert({ dataset_id: req.params.id, user_id: req.user.id, user_name: userRow?.name || 'You', content: content.trim() }).select().single();
    if (error) throw error;
    return res.status(201).json({ comment: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/reports', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ reports: data || [] });
  } catch (err) { return res.json({ reports: [] }); }
});

app.post('/api/reports', verifyToken, async (req, res) => {
  try {
    const { title, type, dataset_id } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Report title required' });
    const { data, error } = await supabase.from('reports').insert({ user_id: req.user.id, title: title.trim(), type: type || 'Analytics', dataset_id: dataset_id || null, status: 'Draft' }).select().single();
    if (error) throw error;
    return res.status(201).json({ report: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    return res.json({ notifications: data || [] });
  } catch (err) { return res.json({ notifications: [] }); }
});

app.patch('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', req.user.id);
    return res.json({ success: true });
  } catch (err) { return res.json({ success: true }); }
});

app.patch('/api/profile', verifyToken, async (req, res) => {
  try {
    const { name, role, bio } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (bio  !== undefined) updates.bio  = bio;
    const { data, error } = await supabase.from('users').update(updates).eq('id', req.user.id).select().single();
    if (error) throw error;
    return res.json({ user: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const { data } = await supabase.from('settings').select('*').eq('user_id', req.user.id).maybeSingle();
    return res.json({ settings: data || { timezone: 'UTC', name: 'My Workspace' } });
  } catch (err) { return res.json({ settings: { timezone: 'UTC', name: 'My Workspace' } }); }
});

app.patch('/api/settings', verifyToken, async (req, res) => {
  try {
    const { name, timezone, anonymizeData, shareMetrics, retentionDays } = req.body;
    const { data, error } = await supabase.from('settings').upsert({ user_id: req.user.id, name, timezone, anonymizeData, shareMetrics, retentionDays }, { onConflict: 'user_id' }).select().single();
    if (error) throw error;
    return res.json({ settings: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/team', verifyToken, async (req, res) => {
  try {
    const { data } = await supabase.from('team_members').select('*').eq('workspace_id', req.user.id).order('created_at', { ascending: false });
    return res.json({ members: (data && data.length > 0) ? data : [{ name: 'You', email: req.user.email, role: 'owner', status: 'Active' }] });
  } catch (err) { return res.json({ members: [{ name: 'You', email: req.user.email, role: 'owner', status: 'Active' }] }); }
});

app.post('/api/team/invite', verifyToken, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: 'Email required' });
    const { data, error } = await supabase.from('team_invitations').insert({ workspace_id: req.user.id, email: email.trim(), role: role || 'member', invited_by: req.user.id, status: 'pending' }).select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, invitation: data });
  } catch (err) { return res.status(500).json({ error: err.message || 'Failed to send invite' }); }
});

app.post('/api/billing/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { amount, plan, currency } = req.body;
    if (!amount || !plan) return res.status(400).json({ error: 'amount and plan are required' });
    const pid = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    return res.json({ success: true, paymentIntentId: pid, clientSecret: `${pid}_secret_${Math.random().toString(36).slice(2, 22)}`, amount, currency: currency || 'usd' });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/billing/confirm-payment', verifyToken, async (req, res) => {
  try {
    const { paymentIntentId, cardholder, country, plan } = req.body;
    const { data, error } = await supabase.from('payments').insert({ user_id: req.user.id, payment_intent_id: paymentIntentId, cardholder_name: cardholder, country, status: 'succeeded', plan: plan || 'professional', amount: plan === 'enterprise' ? 14900 : 7900, currency: 'usd' }).select().single();
    if (error) throw error;
    await supabase.from('users').update({ plan: plan || 'professional', subscription_status: 'active', subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', req.user.id);
    return res.json({ success: true, payment: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/chat', verifyToken, async (req, res) => {
  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'messages array is required' });

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: system || NEXUS_SYSTEM_PROMPT }, ...messages], max_tokens: 1024, stream: true, temperature: 0.7 }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('[chat] Groq error:', groqRes.status, errText);
      res.write(`data: ${JSON.stringify({ error: `AI error ${groqRes.status}. Please try again.` })}\n\n`);
      res.end(); return;
    }

    const decoder = new TextDecoder('utf-8');
    for await (const chunk of groqRes.body) {
      const text = decoder.decode(chunk, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') { res.write('data: [DONE]\n\n'); res.end(); return; }
        try {
          const parsed = JSON.parse(payload);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: token } }] })}\n\n`);
        } catch { /* skip keep-alive lines */ }
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[chat] Streaming error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'AI temporarily unavailable. Please try again.' })}\n\n`);
    res.end();
  }
});

const ANALYTICS_URL = process.env.ANALYTICS_URL || 'http://analytics:8001';
const ANALYTICS_TOKEN = process.env.ANALYTICS_API_KEY || process.env.INTERNAL_SERVICE_TOKEN || '';

// Analytics proxy helper
async function proxyToAnalytics(req, res, path, method = 'POST') {
  try {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANALYTICS_TOKEN
      }
    };
    if (method !== 'GET' && req.body) opts.body = JSON.stringify(req.body);
    const response = await fetch(`${ANALYTICS_URL}${path}`, opts);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Analytics service unavailable', detail: err.message });
  }
}

app.post('/api/nl-query/:datasetId', verifyToken, async (req, res) => {
  try {
    const { question } = req.body;
    const cacheKey = `nl:${req.params.datasetId}:${Buffer.from(question || '').toString('base64').slice(0, 64)}`;
    
    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ ...JSON.parse(cached), cached: true });
      }
    } catch (cacheErr) {
      console.warn('[cache] Redis read failed, bypassing:', cacheErr.message);
    }

    // Forward to analytics service
    const ANALYTICS_TOKEN = process.env.ANALYTICS_API_KEY || process.env.INTERNAL_SERVICE_TOKEN || '';
    const response = await fetch(`${ANALYTICS_URL}/nl-query/${req.params.datasetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANALYTICS_TOKEN,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    
    // Cache successful results for 10 minutes
    if (data.success) {
      try {
        await redis.setex(cacheKey, 600, JSON.stringify(data));
      } catch (cacheErr) {
        console.warn('[cache] Redis write failed, bypassing:', cacheErr.message);
      }
    }
    
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/pipeline/bronze-to-silver/:datasetId', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/pipeline/bronze-to-silver/${req.params.datasetId}`));

app.post('/api/model/build/:datasetId', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/model/build/${req.params.datasetId}`));

app.get('/api/model/:datasetId', verifyToken, cacheMiddleware(300), (req, res) =>
  proxyToAnalytics(req, res, `/model/${req.params.datasetId}`, 'GET'));

app.get('/api/drift/distribution/:datasetIdA/:datasetIdB', verifyToken, (req, res) =>
  proxyToAnalytics(req, res, `/drift/distribution/${req.params.datasetIdA}/${req.params.datasetIdB}`, 'GET'));

app.get('/api/schema/:datasetId', verifyToken, cacheMiddleware(600), (req, res) =>
  proxyToAnalytics(req, res, `/schema/${req.params.datasetId}`, 'GET'));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('[unhandled error]', err.message);
  if (!res.headersSent) res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[Nexus Gateway] Running on port ${PORT}`);
  console.log(`[Client URL] ${CLIENT_URL}`);
});

process.on('SIGTERM', () => { redis.disconnect(); process.exit(0); });
process.on('unhandledRejection', (reason) => { console.error('[nexus] unhandled rejection:', reason); });

