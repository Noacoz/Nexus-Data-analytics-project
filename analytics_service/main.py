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
import uuid
from datetime import datetime
from typing import Optional, Dict, List, Any
import logging
import os
from fastapi import HTTPException, Security, Depends
from fastapi.security import APIKeyHeader

API_KEY = os.getenv("ANALYTICS_API_KEY", "dev-key-nexus-local")
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(API_KEY_HEADER)):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
    return api_key

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
import re
import httpx


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
# Lazy initialize so FastAPI can start even if the database is temporarily unavailable.
db_pool = None

def initialize_db_pool():
    global db_pool
    if db_pool is not None:
        return

    database_url = os.getenv("DATABASE_URL")
    if database_url:
        db_pool = SimpleConnectionPool(1, 20, dsn=database_url)
        return

    db_pool = SimpleConnectionPool(
        1, 20,
        database=os.getenv("DATABASE_NAME", "nexus"),
        user=os.getenv("DATABASE_USER", "postgres"),
        password=os.getenv("DATABASE_PASSWORD", "postgres"),
        host=os.getenv("DATABASE_HOST", "localhost"),
        port=int(os.getenv("DATABASE_PORT", 5432))
    )


def get_db_connection():
    """Get database connection from pool"""
    try:
        initialize_db_pool()
        return db_pool.getconn()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"DB connection unavailable: {e}")


def release_db_connection(conn):
    """Release database connection back to pool"""
    if conn is None:
        return
    db_pool.putconn(conn)


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
                
                # Strength based on RÂ²
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
        numeric_ratio = len(self.numeric_cols) / len(self.df.columns) if len(self.df.columns) > 0 else 0.0
        
        confidence = (sample_score * 0.5) + (quality_score * 0.35) + (numeric_ratio * 0.15)
        
        # Cap at 0.97
        return min(0.97, float(confidence))

    def _confidence_label(self, confidence: float) -> str:
        if confidence >= 0.8:
            return "High"
        if confidence >= 0.6:
            return "Medium"
        return "Low"
    
    def generate_top_findings(self, col_stats: Dict, correlations: Dict, trends: Dict, anomalies: Dict) -> List[Dict]:
        """Synthesize top 10 findings"""
        findings = []
        confidence_base = self.confidence_base or 0.6
        
        # Strong correlations
        for corr in correlations.get("strong_correlations", [])[:3]:
            score = min(0.97, 0.7 + abs(corr["r"]) * 0.2)
            findings.append({
                "type": "correlation",
                "title": f"Strong correlation between {corr['columns'][0]} and {corr['columns'][1]}",
                "explanation": (
                    f"The dataset shows a {corr['direction']} correlation between {corr['columns'][0]} and {corr['columns'][1]} "
                    f"(Pearson r = {corr['r']:.2f}, p = {corr['p_value']:.3f}). This suggests the two variables move together in the current sample."
                ),
                "evidence": {
                    "correlation_coefficient": corr["r"],
                    "p_value": corr["p_value"],
                    "sample_size": corr["sample_size"]
                },
                "confidence": score,
                "confidence_label": self._confidence_label(score)
            })
        
        # Trends
        for col, trend_data in trends.items():
            if trend_data["strength"] in ["strong", "moderate"]:
                score = min(0.97, 0.65 + abs(trend_data["r_squared"]) * 0.25)
                findings.append({
                    "type": "trend",
                    "title": f"{col} shows a {trend_data['strength']} {trend_data['direction']} trend",
                    "explanation": (
                        f"Over the dataset, {col} moves {trend_data['direction']} with an estimated change of "
                        f"{trend_data['pct_change']:.1f}% and R² = {trend_data['r_squared']:.2f}. "
                        f"The trend is {trend_data['strength']} based on the linear fit."
                    ),
                    "evidence": {
                        "slope": trend_data["slope"],
                        "r_squared": trend_data["r_squared"],
                        "pct_change": trend_data["pct_change"]
                    },
                    "confidence": score,
                    "confidence_label": self._confidence_label(score)
                })
        
        # Anomalies
        for anomaly in anomalies.get("extreme_values", [])[:2]:
            score = min(0.97, 0.65 + 0.15)
            findings.append({
                "type": "anomaly",
                "title": f"Extreme value detected in {anomaly['column']}",
                "explanation": (
                    f"An extreme value of {anomaly['value']:.2f} was detected in {anomaly['column']} with a z-score of "
                    f"{anomaly['z_score']:.2f}. This observation may reflect an outlier or a true event that warrants review."
                ),
                "evidence": anomaly,
                "confidence": score,
                "confidence_label": self._confidence_label(score)
            })

        for anomaly in anomalies.get("high_missing_data", [])[:2]:
            score = min(0.97, 0.65 + 0.1)
            findings.append({
                "type": "anomaly",
                "title": f"High missing data in {anomaly['column']}",
                "explanation": (
                    f"{anomaly['null_pct']:.0%} of values are missing in {anomaly['column']}, which may bias analysis. "
                    f"Consider imputing or validating the source values."
                ),
                "evidence": anomaly,
                "confidence": score,
                "confidence_label": self._confidence_label(score)
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

class DuckDBQueryEngine:
    """In-process DuckDB query engine for Parquet datasets"""
    
    def __init__(self):
        self.conn = duckdb.connect()
    
    def execute_query(self, dataset_id: str, sql: str) -> dict:
        """Execute SQL against Parquet file, return JSON-serializable results"""
        try:
            parquet_path = f"/data/bronze/{dataset_id}.parquet"
            if not os.path.exists(parquet_path):
                return {
                    "success": False,
                    "error": "file_not_found",
                    "message": f"Parquet file not found: {parquet_path}"
                }

            # Register Parquet as a named view (safe view name: hyphens â†’ underscores)
            view_name = f"dataset_{dataset_id.replace('-', '_')}"
            self.conn.execute(
                f"CREATE OR REPLACE VIEW {view_name} AS SELECT * FROM '{parquet_path}'"
            )
            # Execute the user's full SQL directly against the view
            result = self.conn.execute(sql).fetchall()
            columns = [desc[0] for desc in self.conn.description]

            rows = []
            for row in result:
                row_dict = {}
                for i, val in enumerate(row):
                    if val is None:
                        row_dict[columns[i]] = None
                    elif isinstance(val, (int, float, bool)):
                        row_dict[columns[i]] = val
                    else:
                        row_dict[columns[i]] = str(val)
                rows.append(row_dict)
            
            return {
                "success": True,
                "columns": columns,
                "rows": rows,
                "row_count": len(rows),
                "sql": sql
            }
        except FileNotFoundError:
            return {
                "success": False,
                "error": "file_not_found",
                "message": f"Dataset Parquet not found: {dataset_id}"
            }
        except duckdb.Error as e:
            return {
                "success": False,
                "error": "query_error",
                "message": f"SQL error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": "internal_error",
                "message": f"Query execution failed: {str(e)}"
            }
    
    def get_schema(self, dataset_id: str) -> list[dict]:
        """Get column names and types for dataset"""
        try:
            parquet_path = f"/data/bronze/{dataset_id}.parquet"
            if not os.path.exists(parquet_path):
                return []
            
            result = self.conn.execute(f"DESCRIBE SELECT * FROM '{parquet_path}' LIMIT 0").fetchall()
            schema = []
            for row in result:
                schema.append({
                    "name": row[0],
                    "type": str(row[1]).lower()
                })
            return schema
        except Exception as e:
            logger.error(f"Schema error for {dataset_id}: {str(e)}")
            return []

class MedallionPipeline:
    """Medallion architecture bronze to silver pipeline"""
    
    def bronze_to_silver(self, dataset_id: str) -> dict:
        bronze_path = f"/data/bronze/{dataset_id}.parquet"
        if not os.path.exists(bronze_path):
            return {"success": False, "error": "bronze_file_not_found"}
        
        # Read bronze
        table = pq.read_table(bronze_path)
        df = table.to_pandas()
        rows_in = len(df)
        
        # Strip whitespace from string columns
        for col in df.columns:
            if df[col].dtype == "object":
                df[col] = df[col].astype(str).str.strip()
        
        # Drop rows where every column is null
        df = df.dropna(how="all")
        rows_out = len(df)
        
        # Cast numeric columns (>80% parseable)
        columns_cast = []
        for col in df.columns:
            temp = pd.to_numeric(df[col], errors="coerce")
            parse_pct = 1 - temp.isnull().sum() / len(temp)
            if parse_pct > 0.8:
                df[col] = temp.astype("float64")
                columns_cast.append(col)
        
        # Standardize column names to snake_case
        original_cols = list(df.columns)
        new_cols = []
        columns_normalized = []
        for col in original_cols:
            # Remove non-alphanumeric, replace spaces/multiple with _, lowercase, strip trailing _
            snake_col = re.sub(r"[^a-zA-Z0-9]+", "_", str(col)).lower().strip("_")
            new_cols.append(snake_col)
            if snake_col != col:
                columns_normalized.append(snake_col)
        
        df.columns = new_cols
        
        # Write silver
        silver_dir = "/data/silver"
        os.makedirs(silver_dir, exist_ok=True)
        silver_path = f"{silver_dir}/{dataset_id}.parquet"
        silver_table = pa.Table.from_pandas(df)
        pq.write_table(silver_table, silver_path)
        
        return {
            "success": True,
            "rows_in": rows_in,
            "rows_out": rows_out,
            "columns_normalized": columns_normalized,
            "columns_cast": columns_cast
        }
    
    def get_silver_schema(self, dataset_id: str) -> list[dict]:
        silver_path = f"/data/silver/{dataset_id}.parquet"
        if not os.path.exists(silver_path):
            return []
        
        schema = pq.read_schema(silver_path)
        return [{"column": field.name, "type": str(field.type)} for field in schema.fields]


class SemanticModel:
    """Semantic model layer above silver - business-friendly interface"""

    @staticmethod
    def build_model(dataset_id: str) -> dict:
        silver_path = f"/data/silver/{dataset_id}.parquet"
        if not os.path.exists(silver_path):
            return {"error": "silver_parquet_not_found"}

        table = pq.read_table(silver_path)
        schema = table.schema
        
        measures = []
        dimensions = []
        time_dimension = None
        
        for field in schema:
            col_name = field.name.lower()
            field_type = str(field.type)
            
            if "float64" in field_type:
                measures.append(field.name)
            else:
                dimensions.append(field.name)
            
            # Detect time dimension
            if any(keyword in col_name for keyword in ["date", "time", "year"]):
                time_dimension = field.name
                # Remove from dimensions
                if field.name in dimensions:
                    dimensions.remove(field.name)
        
        model = {
            "dataset_id": dataset_id,
            "measures": measures,
            "dimensions": dimensions,
            "time_dimension": time_dimension,
            "built_at": datetime.utcnow().isoformat()
        }
        
        # Create models directory
        models_dir = "/data/models"
        os.makedirs(models_dir, exist_ok=True)
        
        # Write model
        model_path = f"{models_dir}/{dataset_id}.json"
        with open(model_path, "w") as f:
            json.dump(model, f, indent=2)
        
        return model

    @staticmethod
    def load_model(dataset_id: str) -> dict:
        model_path = f"/data/models/{dataset_id}.json"
        if not os.path.exists(model_path):
            return {"error": "model_not_found"}
        
        with open(model_path, "r") as f:
            return json.load(f)


class NLQueryEngine:
    """Natural language to SQL translation engine"""

    @staticmethod
    def build_prompt(question: str, schema: list[dict], model: dict) -> str:
        """Build LLM prompt with schema and semantic model"""
        schema_str = "\n".join([f"- {col['column']} ({col['type']})" for col in schema])
        view_name = f"dataset_{model['dataset_id'].replace('-', '_')}"

        measures_str = ', '.join(model.get('measures', []))
        dimensions_str = ', '.join(model.get('dimensions', []))
        time_dim = model.get('time_dimension', 'none')

        prompt = f"""You are an expert DuckDB SQL engineer. Translate this question into a SINGLE valid DuckDB SQL SELECT statement.

Table to query: `{view_name}`

SCHEMA:
{schema_str}

SEMANTIC MODEL:
- MEASURES (numeric for aggregation): {measures_str}
- DIMENSIONS (for GROUP BY): {dimensions_str}
- TIME DIMENSION: {time_dim}

Question: {question}

CRITICAL RULES:
- Return ONLY the SQL SELECT statement. NO explanation, NO markdown, NO backticks, NO ```sql
- Table MUST be `{view_name}`
- Use LIMIT 1000 for safety
- Use standard SQL functions: COUNT, SUM, AVG, GROUP BY, ORDER BY, WHERE
- Handle dates with DATE_TRUNC, DATE_PART if needed"""
    @staticmethod
    def translate_and_execute(dataset_id: str, question: str) -> dict:
        """Translate NL question -> SQL -> execute -> return results"""
        try:
            model = SemanticModel.load_model(dataset_id)
            if "error" in model:
                return {"success": False, "error": "model_not_found"}

            pipeline = MedallionPipeline()
            schema = pipeline.get_silver_schema(dataset_id)

            prompt = NLQueryEngine.build_prompt(question, schema, model)

            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                return {"success": False, "error": "GROQ_API_KEY environment variable not set"}

            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama3-70b-8192",
                        "messages": [
                            {"role": "system", "content": "You are a SQL expert."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.1,
                        "max_tokens": 2000
                    }
                )
                response.raise_for_status()
                llm_response = response.json()
                sql = llm_response["choices"][0]["message"]["content"].strip()

            query_engine = DuckDBQueryEngine()
            result = query_engine.execute_query(dataset_id, sql)

            return {
                "success": True,
                "question": question,
                "sql": sql,
                "result": result
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

def write_parquet(dataset_id: str, df: pd.DataFrame) -> str:
    """Write DataFrame to Parquet bronze layer"""
    bronze_dir = "/data/bronze"
    os.makedirs(bronze_dir, exist_ok=True)
    
    parquet_path = f"{bronze_dir}/{dataset_id}.parquet"
    try:
        table = pa.Table.from_pandas(df)
        pq.write_table(table, parquet_path)
        return parquet_path
    except Exception as e:
        logger.error(f"Parquet write failed for {dataset_id}: {str(e)}")
        raise


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Nexus Analytics Engine"
    }


@app.post("/analyze/dataset/{dataset_id}")
async def analyze_dataset(dataset_id: str, api_key: str = Depends(verify_api_key)):
    """Fetch dataset rows and run full analytics"""
    try:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT version FROM datasets WHERE id = %s",
                (dataset_id,)
            )
            dataset_row = cur.fetchone()
            if not dataset_row:
                raise HTTPException(status_code=404, detail="Dataset not found")
            dataset_version = dataset_row[0]

            cur.execute(
                "SELECT data FROM dataset_rows WHERE dataset_id = %s ORDER BY row_index",
                (dataset_id,)
            )
            rows = [row[0] for row in cur.fetchall()]
            cur.close()

            if not rows:
                raise HTTPException(status_code=404, detail="No rows found for dataset")
            if not all(isinstance(row, dict) for row in rows):
                raise HTTPException(status_code=400, detail="Dataset contains non-tabular rows and cannot be analyzed")

            # Build DataFrame and write Parquet (bronze layer)
            df = pd.DataFrame(rows)
            parquet_path = write_parquet(dataset_id, df)
            logger.info(f"Wrote Parquet bronze layer: {parquet_path}")

            computation_id = str(uuid.uuid4())
            engine = NexusAnalyticsEngine(rows, dataset_id)
            result = engine.run()
            result["computation_id"] = computation_id
            result["dataset_version"] = dataset_version

            # Store snapshot
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO statistical_snapshots 
                (dataset_id, row_count, column_stats, correlations, outliers, trends, anomalies, data_quality, computation_id, dataset_version, confidence_base)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                    computation_id,
                    dataset_version,
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
async def analyze_inline(request_data: dict, api_key: str = Depends(verify_api_key)):
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
async def get_latest_snapshot(dataset_id: str, api_key: str = Depends(verify_api_key)):
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


@app.get("/schema/{dataset_id}")
async def get_dataset_schema(dataset_id: str, api_key: str = Depends(verify_api_key)):
    """Get Parquet dataset schema"""
    engine = DuckDBQueryEngine()
    schema = engine.get_schema(dataset_id)
    return {"schema": schema}






@app.post("/drift/{dataset_id}")
async def detect_drift(dataset_id: str, api_key: str = Depends(verify_api_key)):
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


def compute_distribution_drift(dataset_id_a: str, dataset_id_b: str) -> dict:
    """
    Compute Kolmogorov-Smirnov distribution drift between two silver datasets.
    Compares full distributions using KS 2-sample test on numeric columns.
    """
    silver_path_a = f"/data/silver/{dataset_id_a}.parquet"
    silver_path_b = f"/data/silver/{dataset_id_b}.parquet"
    
    missing = []
    if not os.path.exists(silver_path_a):
        missing.append(dataset_id_a)
    if not os.path.exists(silver_path_b):
        missing.append(dataset_id_b)
    
    if missing:
        return {
            "success": False,
            "error": "silver_file_not_found",
            "missing": missing
        }
    
    try:
        # Load silver Parquet files
        df_a = pq.read_table(silver_path_a).to_pandas()
        df_b = pq.read_table(silver_path_b).to_pandas()
        
        # Common numeric columns
        common_cols = set(df_a.select_dtypes(include=['float64', 'int64']).columns) & \
                      set(df_b.select_dtypes(include=['float64', 'int64']).columns)
        
        columns_tested = len(common_cols)
        drifted_columns = []
        
        for col in common_cols:
            # Drop NaN for KS test
            data_a = df_a[col].dropna()
            data_b = df_b[col].dropna()
            
            # Require minimum 30 samples per dataset
            if len(data_a) >= 30 and len(data_b) >= 30:
                ks_statistic, p_value = stats.ks_2samp(data_a, data_b)
                
                if p_value < 0.05:
                    drifted_columns.append({
                        "column": col,
                        "ks_statistic": float(ks_statistic),
                        "p_value": float(p_value)
                    })
        
        drift_detected = len(drifted_columns) > 0
        
        return {
            "success": True,
            "dataset_a": dataset_id_a,
            "dataset_b": dataset_id_b,
            "columns_tested": columns_tested,
            "drifted_columns": drifted_columns,
            "drift_detected": drift_detected
        }
    
    except Exception as e:
        logger.error(f"Distribution drift computation error: {str(e)}")
        return {
            "success": False,
            "error": "computation_failed",
            "message": str(e)
        }


@app.get("/drift/distribution/{dataset_id_a}/{dataset_id_b}")
async def distribution_drift(dataset_id_a: str, dataset_id_b: str, api_key: str = Depends(verify_api_key)):
    """Distribution-level drift detection using KS test on silver Parquet datasets"""
    return compute_distribution_drift(dataset_id_a, dataset_id_b)

@app.post("/pipeline/bronze-to-silver/{dataset_id}")
async def bronze_to_silver_endpoint(dataset_id: str, api_key: str = Depends(verify_api_key)):
    """Convert bronze to silver layer"""
    pipeline = MedallionPipeline()
    result = pipeline.bronze_to_silver(dataset_id)
    return result


@app.post("/nl-query/{dataset_id}")
async def nl_query(dataset_id: str, request_data: dict, api_key: str = Depends(verify_api_key)):
    """
    Natural language query endpoint
    POST /nl-query/my-dataset
    {"question": "What are the top 5 customers by revenue?"}
    """
    question = request_data.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Field 'question' is required")
    
    result = NLQueryEngine.translate_and_execute(dataset_id, question)
    return result

@app.post("/model/build/{dataset_id}")
async def build_model_endpoint(dataset_id: str, api_key: str = Depends(verify_api_key)):
    model = SemanticModel.build_model(dataset_id)
    return model

@app.get("/model/{dataset_id}")
async def load_model_endpoint(dataset_id: str, api_key: str = Depends(verify_api_key)):
    model = SemanticModel.load_model(dataset_id)
    return model

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

