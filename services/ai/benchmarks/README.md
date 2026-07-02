# Embedding Dimension Benchmark

Benchmark semantic search quality and latency across embedding dimensions:
`1024`, `768`, `512`, `256`, and `128`.

This tool is isolated from production. It creates Qdrant collections named
`cinema_movies_bench_{dimension}` and does not write to the production
`cinema_movies` collection.

Current benchmark result: production defaults to `EMBEDDING_DIM=768` because it
keeps about 98.3% of the 1024-dimensional `semantic_score@5` while reducing
estimated vector memory by 25% and lowering average search latency from 4.58ms
to 3.96ms on the seed benchmark.

## Run

From `services/ai`:

```powershell
py benchmarks/run_embedding_dimension_benchmark.py --seed benchmarks/data/movie_benchmark_seed.json
```

Outputs are written to `benchmarks/output/`:

- `embedding_dimension_benchmark.csv`
- `embedding_dimension_benchmark.json`
- `dimension_quality.png`
- `dimension_latency.png`
- `dimension_quality_vs_latency.png`
- `dimension_memory_estimate.png`
- `dimension_hard_negative_rate.png`

Use `--help` to see optional flags for Qdrant URL, backend, dimensions, and output path.

## Charts

![Embedding dimension quality](output/dimension_quality.png)

![Quality vs latency](output/dimension_quality_vs_latency.png)

## Output Image List

| Image | Meaning |
|---|---|
| [dimension_quality.png](output/dimension_quality.png) | `semantic_score@5` by embedding dimension |
| [dimension_latency.png](output/dimension_latency.png) | Average search latency by embedding dimension |
| [dimension_quality_vs_latency.png](output/dimension_quality_vs_latency.png) | Quality and latency tradeoff |
| [dimension_memory_estimate.png](output/dimension_memory_estimate.png) | Estimated vector memory by dimension |
| [dimension_hard_negative_rate.png](output/dimension_hard_negative_rate.png) | Hard-negative rate in top 5 results |
