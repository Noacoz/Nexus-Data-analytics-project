#!/usr/bin/env python3
# Test DuckDBQueryEngine
import pandas as pd
from main import DuckDBQueryEngine  # assumes in same dir

# Sample data
df = pd.DataFrame({
    'date': pd.date_range('2024-01-01', periods=100),
    'revenue': np.random.normal(1000, 200, 100).cumsum(),
    'users': np.random.poisson(100, 100)
})
df.to_parquet('test.parquet')

engine = DuckDBQueryEngine()

# Test schema
schema = engine.get_schema('test')
print("Schema:", schema)  # [{'name': 'date', 'type': 'date'}, ...]

# Test query
result = engine.execute_query('test', "SELECT AVG(revenue) as avg_rev FROM 'test.parquet' WHERE users > 90")
print("Query result:", result)  # {'success': True, 'columns': ['avg_rev'], ...}

