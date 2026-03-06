"""
Nexus Analytics Engine - FastAPI Service
Pure statistical computation service - NO LLM calls
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
import psycopg2
from psycopg2.pool import SimpleConnectionPool
import json
import os
from datetime import datetime
from typing import Optional, Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Nexus Analytics Engine", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection pool
db_pool = SimpleConnectionPool(
    1, 20,
    database=os.getenv("DATABASE_NAME", "nexus"),
    user=os.getenv("DATABASE_USER", "postgres"),
    password=os.getenv("DATABASE_PASSWORD", "postgres"),
    host=os.getenv("DATABASE_HOST", "localhost"),
    port=int(os.getenv("DATABASE_PORT", 5432))
)


class NexusAnalyticsEngine:
    """Core statistical analysis engine"""
    
    def __init__(self, rows: List[Dict], dataset_id: str = None):
        self.df = pd.DataFrame(rows)
        self.dataset_id = dataset_id
        self.numeric_cols = []
        self.categorical_cols = []
        self.n_rows = len(self.df)
        self._infer_column_types()
        self.confidence_base = 0.0
        
    def _infer_column_types(self):
        """Infer numeric vs categorical columns"""
        for col in self.df.columns:
            # Try to convert to numeric
            try:
                numeric_data = pd.to_numeric(self.df[col], errors='coerce')
                null_pct = numeric_data.isnull().sum() / len(numeric_data)
                # If >80% of values are numeric, classify as numeric
                if null_pct < 0.8 and numeric_data.notna().sum() > 0:
                    self.numeric_cols.append(col)
                else:
                    self.categorical_cols.append(col)
            except:
                self.categorical_cols.append(col)
    
    def compute_column_stats(self) -> Dict[str, Any]:
        """Compute comprehensive statistics for each column"""
        col_stats = {}
        
        for col in self.df.columns:
            stats_dict = {
                "type": "numeric" if col in self.numeric_cols else "categorical",
                "null_count": int(self.df[col].isnull().sum()),
                "null_pct": float(self.df[col].isnull().sum() / len(self.df)),
                "unique_count": int(self.df[col].nunique()),
                "completeness": float(1 - (self.df[col].isnull().sum() / len(self.df)))
            }
            
            if col in self.numeric_cols:
                numeric_data = pd.to_numeric(self.df[col], errors='coerce')
                numeric_clean = numeric_data.dropna()
                
                if len(numeric_clean) > 0:
                    stats_dict.update({
                        "mean": float(numeric_clean.mean()),
                        "median": float(numeric_clean.median()),
                        "std": float(numeric_clean.std()),
                        "min": float(numeric_clean.min()),
                        "max": float(numeric_clean.max()),
                        "q1": float(numeric_clean.quantile(0.25)),
                        "q3": float(numeric_clean.quantile(0.75)),
                        "iqr": float(numeric_clean.quantile(0.75) - numeric_clean.quantile(0.25)),
                        "skewness": float(stats.skew(numeric_clean)),
                        "kurtosis": float(stats.kurtosis(numeric_clean)),
                        "cv": float(numeric_clean.std() / numeric_clean.mean()) if numeric_clean.mean() != 0 else 0
                    })
                    
                    # Skew label
                    skewness = stats.skew(numeric_clean)
                    if abs(skewness) < 0.5:
                        stats_dict["skew_label"] = "symmetric"
                    elif skewness > 0:
                        stats_dict["skew_label"] = "right-skewed"
                    else:
                        stats_dict["skew_label"] = "left-skewed"
                    
                    # Normality test
                    if len(numeric_clean) <= 5000:
                        stat, p_value = stats.shapiro(numeric_clean)
                    else:
                        stat, p_value = stats.normaltest(numeric_clean)
                    
                    stats_dict["is_normal_distribution"] = p_value > 0.05
                    stats_dict["normality_p_value"] = float(p_value)
                    
                    # Outliers (IQR method)
                    q1 = numeric_clean.quantile(0.25)
                    q3 = numeric_clean.quantile(0.75)
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outliers = ((numeric_clean < lower_bound) | (numeric_clean > upper_bound)).sum()
                    stats_dict["outlier_count_iqr"] = int(outliers)
            
            else:  # Categorical
                top_values = self.df[col].value_counts().head(5).to_dict()
                stats_dict.update({
                    "top_values": {str(k): int(v) for k, v in top_values.items()},
                    "mode": str(self.df[col].mode()[0]) if len(self.df[col].mode()) > 0 else None
                })
            
            col_stats[col] = stats_dict
        
        return col_stats
    
    def compute_correlations(self) -> Dict[str, Any]:
        """Compute Pearson correlations between numeric columns"""
        correlations = {
            "strong_correlations": [],
            "all_pairs": []
        }
        
        if len(self.numeric_cols) < 2:
            return correlations
        
        numeric_df = self.df[self.numeric_cols].apply(pd.to_numeric, errors='coerce')
        
        for i, col1 in enumerate(self.numeric_cols):
            for col2 in self.numeric_cols[i+1:]:
                # Drop NaN for this pair
                clean_data = numeric_df[[col1, col2]].dropna()
                
                if len(clean_data) > 1:
                    r, p_value = stats.pearsonr(clean_data[col1], clean_data[col2])
                    
                    pair = {
                        "columns": [col1, col2],
                        "r": float(r),
                        "p_value": float(p_value),
                        "significant": p_value < 0.05,
                        "strength": "strong" if abs(r) >= 0.6 else ("moderate" if abs(r) >= 0.3 else "weak"),
                        "direction": "positive" if r > 0 else "negative",
                        "sample_size": len(clean_data)
                    }
                    
                    correlations["all_pairs"].append(pair)
                    
                    if abs(r) >= 0.6 and p_value < 0.05:
                        correlations["strong_correlations"].append(pair)
        
        return correlations
    
    def detect_outliers(self) -> Dict[str, Any]:
        """Detect outliers using IQR and Isolation Forest"""
        if self.n_rows < 10:
            return {
                "available": False,
                "reason": "Minimum 10 rows required"
            }
        
        numeric_df = self.df[self.numeric_cols].apply(pd.to_numeric, errors='coerce')
        
        outlier_result = {
            "available": True,
            "isolation_forest": {
                "count": 0,
                "pct": 0.0,
                "sample_rows": []
            },
            "iqr_method": {},
            "total_outlier_count": 0,
            "total_outlier_pct": 0.0
        }
        
        # Isolation Forest
        if len(numeric_df.dropna()) > 10:
            try:
                iso_forest = IsolationForest(contamination=0.05, random_state=42)
                outlier_labels = iso_forest.fit_predict(numeric_df.dropna())
                outlier_indices = np.where(outlier_labels == -1)[0]
                
                outlier_result["isolation_forest"]["count"] = int(len(outlier_indices))
                outlier_result["isolation_forest"]["pct"] = float(len(outlier_indices) / len(numeric_df))
                
                # Sample 5 outlier rows
                if len(outlier_indices) > 0:
                    sample_idx = np.random.choice(outlier_indices, min(5, len(outlier_indices)), replace=False)
                    for idx in sample_idx:
                        outlier_result["isolation_forest"]["sample_rows"].append(
                            numeric_df.iloc[idx].to_dict()
                        )
            except:
                pass
        
        # IQR method per column
        for col in self.numeric_cols:
            numeric_col = pd.to_numeric(self.df[col], errors='coerce').dropna()
            if len(numeric_col) > 0:
                q1 = numeric_col.quantile(0.25)
                q3 = numeric_col.quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                outlier_mask = (numeric_col < lower) | (numeric_col > upper)
                count = outlier_mask.sum()
                
                outlier_result["iqr_method"][col] = {
                    "count": int(count),
                    "pct": float(count / len(numeric_col))
                }
        
        outlier_result["total_outlier_count"] = outlier_result["isolation_forest"]["count"]
        outlier_result["total_outlier_pct"] = outlier_result["isolation_forest"]["pct"]
        
        return outlier_result
    
    def compute_trends(self) -> Dict[str, Any]:
        """Detect trends in numeric columns"""
        trends = {}
        
        for col in self.numeric_cols:
            numeric_col = pd.to_numeric(self.df[col], errors='coerce')
            
            if len(numeric_col.dropna()) >= 5:
                clean_col = numeric_col.dropna()
                X = np.arange(len(clean_col)).reshape(-1, 1)
                y = clean_col.values
                
                lr = LinearRegression()
                lr.fit(X, y)
                
                slope = float(lr.coef_[0])
                r2 = float(lr.score(X, y))
                
                # Direction
                if abs(slope) < 0.001:
                    direction = "flat"
                    strength = "weak"
                elif slope > 0:
                    direction = "upward"
                else:
                    direction = "downward"
                
                # Strength based on R²
                if r2 > 0.7:
                    strength = "strong"
                elif r2 > 0.4:
                    strength = "moderate"
                else:
                    strength = "weak"
                
                # Percent change
                pct_change = float((y[-1] - y[0]) / y[0] * 100) if y[0] != 0 else 0
                
                trends[col] = {
                    "slope": slope,
                    "r_squared": r2,
                    "direction": direction,
                    "strength": strength,
                    "pct_change": pct_change
                }
        
        return trends
    
    def detect_anomalies(self) -> Dict[str, Any]:
        """Detect anomalies (extreme values, high missing data)"""
        anomalies = {
            "extreme_values": [],
            "high_missing_data": []
        }
        
        # Extreme values (Z-score > 3)
        for col in self.numeric_cols:
            numeric_col = pd.to_numeric(self.df[col], errors='coerce')
            clean_col = numeric_col.dropna()
            
            if len(clean_col) > 0:
                mean = clean_col.mean()
                std = clean_col.std()
                
                if std > 0:
                    z_scores = np.abs((clean_col - mean) / std)
                    extreme_mask = z_scores > 3
                    
                    if extreme_mask.any():
                        extreme_values = clean_col[extreme_mask]
                        for val in extreme_values.head(5):
                            anomalies["extreme_values"].append({
                                "column": col,
                                "value": float(val),
                                "z_score": float((val - mean) / std),
                                "severity": "critical"
                            })
        
        # High missing data (>20%)
        for col in self.df.columns:
            null_pct = self.df[col].isnull().sum() / len(self.df)
            if null_pct > 0.2:
                anomalies["high_missing_data"].append({
                    "column": col,
                    "null_count": int(self.df[col].isnull().sum()),
                    "null_pct": float(null_pct),
                    "severity": "warning"
                })
        
        return anomalies
    
    def compute_data_quality(self) -> Dict[str, Any]:
        """Compute data quality metrics"""
        total_cells = len(self.df) * len(self.df.columns)
        missing_cells = self.df.isnull().sum().sum()
        duplicate_rows = len(self.df) - len(self.df.drop_duplicates())
        
        completeness = 1 - (missing_cells / total_cells)
        uniqueness = 1 - (duplicate_rows / len(self.df))
        
        overall_score = (completeness * 0.6) + (uniqueness * 0.4)
        
        if overall_score > 0.85:
            quality_label = "High"
        elif overall_score > 0.65:
            quality_label = "Medium"
        else:
            quality_label = "Low"
        
        return {
            "completeness": float(completeness),
            "uniqueness": float(uniqueness),
            "duplicate_row_count": int(duplicate_rows),
            "missing_cell_count": int(missing_cells),
            "overall_score": float(overall_score),
            "quality_label": quality_label
        }
    
    def compute_confidence_base(self, data_quality: Dict) -> float:
        """Compute system confidence ceiling"""
        sample_score = min(1.0, self.n_rows / 500)
        quality_score = data_quality["overall_score"]
        numeric_ratio = len(self.numeric_cols) / len(self.df.columns)
        
        confidence = (sample_score * 0.5) + (quality_score * 0.35) + (numeric_ratio * 0.15)
        
        # Cap at 0.97
        return min(0.97, float(confidence))
    
    def generate_top_findings(self, col_stats: Dict, correlations: Dict, trends: Dict, anomalies: Dict) -> List[Dict]:
        """Synthesize top 10 findings"""
        findings = []
        
        # Strong correlations
        for corr in correlations.get("strong_correlations", [])[:3]:
            findings.append({
                "type": "correlation",
                "title": f"Strong correlation between {corr['columns'][0]} and {corr['columns'][1]}",
                "r_value": corr["r"],
                "direction": corr["direction"]
            })
        
        # Strong trends
        for col, trend_data in trends.items():
            if trend_data["strength"] in ["strong", "moderate"]:
                findings.append({
                    "type": "trend",
                    "title": f"{col} shows {trend_data['strength']} {trend_data['direction']} trend",
                    "r_squared": trend_data["r_squared"],
                    "pct_change": trend_data["pct_change"]
                })
        
        # Data quality warnings
        dq = self.compute_data_quality()
        if dq["overall_score"] < 0.7:
            findings.append({
                "type": "data_quality",
                "title": f"Data quality is {dq['quality_label'].lower()}",
                "score": dq["overall_score"]
            })
        
        # Anomalies
        for anomaly in anomalies.get("extreme_values", [])[:2]:
            findings.append({
                "type": "anomaly",
                "title": f"Extreme value detected in {anomaly['column']}",
                "severity": anomaly["severity"]
            })
        
        return findings[:10]
    
    def run(self) -> Dict[str, Any]:
        """Execute full analytics pipeline"""
        try:
            col_stats = self.compute_column_stats()
            correlations = self.compute_correlations()
            outliers = self.detect_outliers()
            trends = self.compute_trends()
            anomalies = self.detect_anomalies()
            data_quality = self.compute_data_quality()
            
            confidence_base = self.compute_confidence_base(data_quality)
            self.confidence_base = confidence_base
            
            top_findings = self.generate_top_findings(col_stats, correlations, trends, anomalies)
            
            return {
                "row_count": self.n_rows,
                "column_count": len(self.df.columns),
                "column_stats": col_stats,
                "correlations": correlations,
                "outliers": outliers,
                "trends": trends,
                "anomalies": anomalies,
                "data_quality": data_quality,
                "confidence_base": confidence_base,
                "top_findings": top_findings,
                "computed_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Analytics engine error: {str(e)}")
            raise


def get_db_connection():
    """Get database connection from pool"""
    return db_pool.getconn()


def release_db_connection(conn):
    """Release database connection back to pool"""
    db_pool.putconn(conn)


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Nexus Analytics Engine"
    }


@app.post("/analyze/dataset/{dataset_id}")
async def analyze_dataset(dataset_id: str):
    """Fetch dataset rows and run full analytics"""
    try:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            
            # Fetch all rows
            cur.execute(
                "SELECT data FROM dataset_rows WHERE dataset_id = %s ORDER BY row_index",
                (dataset_id,)
            )
            rows = [row[0] for row in cur.fetchall()]
            cur.close()
            
            if not rows:
                raise HTTPException(status_code=404, detail="No rows found for dataset")
            
            # Run analytics
            engine = NexusAnalyticsEngine(rows, dataset_id)
            result = engine.run()
            
            # Store snapshot
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO statistical_snapshots 
                (dataset_id, row_count, column_stats, correlations, outliers, trends, anomalies, data_quality, confidence_base)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    dataset_id,
                    result["row_count"],
                    json.dumps(result["column_stats"]),
                    json.dumps(result["correlations"]),
                    json.dumps(result["outliers"]),
                    json.dumps(result["trends"]),
                    json.dumps(result["anomalies"]),
                    json.dumps(result["data_quality"]),
                    result["confidence_base"]
                )
            )
            snapshot_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            
            result["snapshot_id"] = snapshot_id
            return result
        
        finally:
            release_db_connection(conn)
    
    except Exception as e:
        logger.error(f"Dataset analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze/inline")
async def analyze_inline(request_data: dict):
    """Analyze provided rows without database fetch"""
    try:
        rows = request_data.get("rows", [])
        if not rows:
            raise HTTPException(status_code=400, detail="No rows provided")
        
        engine = NexusAnalyticsEngine(rows)
        result = engine.run()
        return result
    
    except Exception as e:
        logger.error(f"Inline analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/snapshot/{dataset_id}/latest")
async def get_latest_snapshot(dataset_id: str):
    """Fetch latest snapshot for dataset"""
    try:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, computed_at, row_count, column_stats, correlations, outliers, 
                       trends, anomalies, data_quality, confidence_base
                FROM statistical_snapshots
                WHERE dataset_id = %s
                ORDER BY computed_at DESC
                LIMIT 1
                """,
                (dataset_id,)
            )
            row = cur.fetchone()
            cur.close()
            
            if not row:
                raise HTTPException(status_code=404, detail="No snapshot found")
            
            return {
                "id": row[0],
                "computed_at": row[1].isoformat(),
                "row_count": row[2],
                "column_stats": row[3],
                "correlations": row[4],
                "outliers": row[5],
                "trends": row[6],
                "anomalies": row[7],
                "data_quality": row[8],
                "confidence_base": row[9]
            }
        
        finally:
            release_db_connection(conn)
    
    except Exception as e:
        logger.error(f"Snapshot fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/drift/{dataset_id}")
async def detect_drift(dataset_id: str):
    """Detect statistical drift between snapshots"""
    try:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            
            # Fetch last 2 snapshots
            cur.execute(
                """
                SELECT column_stats FROM statistical_snapshots
                WHERE dataset_id = %s
                ORDER BY computed_at DESC
                LIMIT 2
                """,
                (dataset_id,)
            )
            rows = cur.fetchall()
            cur.close()
            
            if len(rows) < 2:
                return {
                    "drift_detected": False,
                    "reason": "Minimum 2 snapshots required",
                    "signals": []
                }
            
            latest_stats = rows[0][0]
            previous_stats = rows[1][0]
            
            signals = []
            
            # Compare column means using Z-score
            for col in latest_stats:
                if col in previous_stats:
                    if "mean" in latest_stats[col] and "mean" in previous_stats[col]:
                        latest_mean = latest_stats[col]["mean"]
                        latest_std = latest_stats[col].get("std", 0)
                        previous_mean = previous_stats[col]["mean"]
                        
                        if latest_std > 0:
                            z_score = abs((latest_mean - previous_mean) / latest_std)
                            
                            if z_score > 2:
                                signals.append({
                                    "column": col,
                                    "z_score": float(z_score),
                                    "previous_mean": float(previous_mean),
                                    "latest_mean": float(latest_mean),
                                    "severity": "critical" if z_score > 3 else "warning"
                                })
            
            return {
                "drift_detected": len(signals) > 0,
                "signals": signals
            }
        
        finally:
            release_db_connection(conn)
    
    except Exception as e:
        logger.error(f"Drift detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
