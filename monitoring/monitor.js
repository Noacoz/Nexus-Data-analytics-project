/**
 * Nexus Autonomous Monitoring System
 * BullMQ-based worker for scheduled dataset monitoring
 * Port: 5001 (for manual triggers)
 */

import { Worker, Queue, QueueScheduler } from "bullmq";
import { Pool } from "pg";
import Redis from "ioredis";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import {
  generateInsights,
} from "./reasoning/promptArchitecture.js";

dotenv.config();

// ============================================================================
// SETUP
// ============================================================================

const ANALYTICS_ENGINE_URL = process.env.ANALYTICS_ENGINE_URL || "http://localhost:8001";

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// BullMQ
const nexusQueue = new Queue("nexus-monitor", { connection: redis });
const queueScheduler = new QueueScheduler("nexus-monitor", { connection: redis });

// ============================================================================
// WORKER
// ============================================================================

const worker = new Worker("nexus-monitor", async (job) => {
  const { datasetId, userId, datasetName } = job.data;
  console.log(`[Monitor] Processing dataset: ${datasetId}`);

  try {
    await monitorDataset(datasetId, userId, datasetName);
    return { success: true };
  } catch (error) {
    console.error(`[Monitor] Error monitoring ${datasetId}:`, error);
    throw error;
  }
}, { connection: redis, concurrency: 3 });

worker.on("failed", (job, err) => {
  console.error(`[Monitor] Job failed: ${job.id}`, err);
});

// ============================================================================
// MONITORING LOGIC
// ============================================================================

/**
 * Main monitoring function
 */
async function monitorDataset(datasetId, userId, datasetName) {
  try {
    const client = await pool.connect();

    try {
      const alerts = [];

      // Step 1: Drift Detection
      console.log("[Monitor] Step 1: Detecting drift...");
      try {
        const driftResponse = await axios.post(
          `${ANALYTICS_ENGINE_URL}/drift/${datasetId}`,
          {},
          { timeout: 30000 }
        );

        if (driftResponse.data.drift_detected && driftResponse.data.signals.length > 0) {
          for (const signal of driftResponse.data.signals) {
            alerts.push({
              id: uuidv4(),
              dataset_id: datasetId,
              alert_type: "drift",
              severity: signal.severity,
              title: `Statistical drift detected in ${signal.column}`,
              description:
                `Column "${signal.column}" mean shifted from ${signal.previous_mean.toFixed(2)} to ${signal.latest_mean.toFixed(2)} (Z-score: ${signal.z_score.toFixed(2)})`,
              evidence: JSON.stringify(signal),
              linked_insight_id: null,
              seen: false,
              triggered_at: new Date(),
            });
          }
        }
      } catch (error) {
        console.error("[Monitor] Drift detection error:", error.message);
      }

      // Step 2: Anomaly Comparison
      console.log("[Monitor] Step 2: Comparing anomalies...");
      try {
        const snapshotResponse = await axios.get(
          `${ANALYTICS_ENGINE_URL}/snapshot/${datasetId}/latest`,
          { timeout: 30000 }
        );

        const latestSnapshot = snapshotResponse.data;
        const latestAnomalyCount = latestSnapshot.anomalies.extreme_values.length;

        // Fetch previous snapshot
        const previousResult = await client.query(
          `SELECT anomalies FROM statistical_snapshots
           WHERE dataset_id = $1
           ORDER BY computed_at DESC
           LIMIT 2 OFFSET 1`,
          [datasetId]
        );

        if (previousResult.rows.length > 0) {
          const previousAnomalyCount = previousResult.rows[0].anomalies?.extreme_values?.length || 0;

          if (latestAnomalyCount > previousAnomalyCount * 1.5) {
            for (const anomaly of latestSnapshot.anomalies.extreme_values.slice(0, 3)) {
              alerts.push({
                id: uuidv4(),
                dataset_id: datasetId,
                alert_type: "anomaly",
                severity: anomaly.severity,
                title: `New anomaly detected in ${anomaly.column}`,
                description:
                  `Extreme value ${anomaly.value} detected (Z-score: ${anomaly.z_score.toFixed(2)})`,
                evidence: JSON.stringify(anomaly),
                linked_insight_id: null,
                seen: false,
                triggered_at: new Date(),
              });
            }
          }
        }

        // Step 3: Proactive Insight Generation
        if (alerts.length > 0) {
          console.log("[Monitor] Step 3: Generating proactive insights...");
          try {
            const insightResult = await generateInsights(latestSnapshot, datasetName);

            if (insightResult.insights && insightResult.insights.length > 0) {
              const topInsight = insightResult.insights[0];
              const insightRecord = {
                id: uuidv4(),
                dataset_id: datasetId,
                snapshot_id: latestSnapshot.id,
                user_id: userId,
                trigger_type: "monitor",
                insight_type: topInsight.insight_type,
                title: topInsight.title,
                explanation: topInsight.explanation,
                confidence: topInsight.confidence,
                confidence_label: topInsight.confidence_label,
                assumptions: JSON.stringify(topInsight.assumptions),
                limitations: JSON.stringify(topInsight.limitations),
                hypotheses: JSON.stringify(topInsight.hypotheses),
                evidence: JSON.stringify(topInsight.evidence),
                recommended_actions: JSON.stringify(topInsight.recommended_actions),
                reasoning_trace: JSON.stringify(topInsight.reasoning_trace),
                is_proactive: true,
                created_at: new Date(),
              };

              await client.query(
                `INSERT INTO insights 
                (id, dataset_id, snapshot_id, user_id, trigger_type, insight_type, title, explanation,
                 confidence, confidence_label, assumptions, limitations, hypotheses, evidence,
                 recommended_actions, reasoning_trace, is_proactive, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
                [
                  insightRecord.id,
                  insightRecord.dataset_id,
                  insightRecord.snapshot_id,
                  insightRecord.user_id,
                  insightRecord.trigger_type,
                  insightRecord.insight_type,
                  insightRecord.title,
                  insightRecord.explanation,
                  insightRecord.confidence,
                  insightRecord.confidence_label,
                  insightRecord.assumptions,
                  insightRecord.limitations,
                  insightRecord.hypotheses,
                  insightRecord.evidence,
                  insightRecord.recommended_actions,
                  insightRecord.reasoning_trace,
                  insightRecord.is_proactive,
                  insightRecord.created_at,
                ]
              );

              // Link first alert to insight
              if (alerts.length > 0) {
                alerts[0].linked_insight_id = insightRecord.id;
              }
            }
          } catch (error) {
            console.error("[Monitor] Proactive insight generation error:", error.message);
          }
        }
      } catch (error) {
        console.error("[Monitor] Anomaly comparison error:", error.message);
      }

      // Step 4: Weekly Executive Summary
      console.log("[Monitor] Step 4: Checking for weekly summary...");
      try {
        const weekAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const summaryCheckResult = await client.query(
          `SELECT id FROM monitoring_alerts
           WHERE dataset_id = $1 AND alert_type = 'weekly_summary'
           AND triggered_at > $2
           LIMIT 1`,
          [datasetId, weekAgoDate]
        );

        if (summaryCheckResult.rows.length === 0) {
          // Generate weekly summary
          const insightsResult = await client.query(
            `SELECT * FROM insights WHERE dataset_id = $1
             ORDER BY confidence DESC LIMIT 10`,
            [datasetId]
          );

          const snapshotResult = await client.query(
            `SELECT * FROM statistical_snapshots WHERE dataset_id = $1
             ORDER BY computed_at DESC LIMIT 1`,
            [datasetId]
          );

          if (snapshotResult.rows.length > 0) {
            const insights = insightsResult.rows.map((row) => ({
              ...row,
              assumptions: JSON.parse(row.assumptions || "[]"),
              limitations: JSON.parse(row.limitations || "[]"),
              hypotheses: JSON.parse(row.hypotheses || "[]"),
              evidence: JSON.parse(row.evidence || "{}"),
            }));

            try {
              const summaryResult = await generateInsights(snapshotResult.rows[0], datasetName);

              const summaryAlert = {
                id: uuidv4(),
                dataset_id: datasetId,
                alert_type: "weekly_summary",
                severity: "info",
                title: `Weekly Intelligence Report: ${datasetName}`,
                description: summaryResult.meta?.dataset_quality_note || "Weekly summary generated",
                evidence: JSON.stringify(summaryResult),
                linked_insight_id: null,
                seen: false,
                triggered_at: new Date(),
              };

              alerts.push(summaryAlert);
            } catch (error) {
              console.error("[Monitor] Summary generation error:", error.message);
            }
          }
        }
      } catch (error) {
        console.error("[Monitor] Weekly summary error:", error.message);
      }

      // Step 5: Persist all alerts
      if (alerts.length > 0) {
        console.log(`[Monitor] Persisting ${alerts.length} alerts...`);
        for (const alert of alerts) {
          await client.query(
            `INSERT INTO monitoring_alerts 
            (id, dataset_id, alert_type, severity, title, description, evidence, linked_insight_id, seen, triggered_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              alert.id,
              alert.dataset_id,
              alert.alert_type,
              alert.severity,
              alert.title,
              alert.description,
              alert.evidence,
              alert.linked_insight_id,
              alert.seen,
              alert.triggered_at,
            ]
          );
        }
      }

      await client.query("COMMIT");
      console.log("[Monitor] Complete");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Monitor] Fatal error:", error);
    throw error;
  }
}

// ============================================================================
// JOB SCHEDULING
// ============================================================================

/**
 * Schedule monitoring for all ready datasets
 */
async function scheduleAllDatasets() {
  try {
    console.log("[Scheduler] Starting dataset scheduling...");

    const result = await pool.query(
      `SELECT id, name, user_id FROM datasets WHERE status = 'ready'`
    );

    for (const dataset of result.rows) {
      const jobId = `monitor-${dataset.id}`;

      try {
        await nexusQueue.upsertJob(
          jobId,
          {
            datasetId: dataset.id,
            userId: dataset.user_id,
            datasetName: dataset.name,
          },
          {
            repeat: {
              pattern: "0 */6 * * *", // Every 6 hours
            },
            removeOnComplete: true,
            removeOnFail: false,
          }
        );

        console.log(`[Scheduler] Scheduled: ${dataset.name} (${dataset.id})`);
      } catch (error) {
        console.error(`[Scheduler] Failed to schedule ${dataset.id}:`, error.message);
      }
    }

    console.log("[Scheduler] Scheduling complete");
  } catch (error) {
    console.error("[Scheduler] Error:", error);
  }
}

/**
 * Manual trigger endpoint
 */
import express from "express";

const app = express();
const MONITOR_PORT = process.env.MONITOR_PORT || 5001;

app.post("/trigger/:datasetId", async (req, res) => {
  try {
    const { datasetId } = req.params;

    const result = await pool.query(
      `SELECT name, user_id FROM datasets WHERE id = $1`,
      [datasetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const dataset = result.rows[0];

    const job = await nexusQueue.add(
      `manual-${datasetId}-${Date.now()}`,
      {
        datasetId,
        userId: dataset.user_id,
        datasetName: dataset.name,
      }
    );

    res.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error("Trigger error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(MONITOR_PORT, () => {
  console.log(`[Monitor Service] Running on port ${MONITOR_PORT}`);
});

// ============================================================================
// STARTUP
// ============================================================================

console.log("[Nexus Monitoring] Initializing...");
scheduleAllDatasets().then(() => {
  console.log("[Nexus Monitoring] Ready");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Monitor] Shutting down...");
  await worker.close();
  await queueScheduler.close();
  await pool.end();
  redis.disconnect();
  process.exit(0);
});
