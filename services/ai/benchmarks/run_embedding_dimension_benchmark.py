from __future__ import annotations

import argparse
import csv
import json
import math
import os
import statistics
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import httpx
import matplotlib.pyplot as plt
import numpy as np
from qdrant_client import QdrantClient, models as qdrant_models


DEFAULT_DIMENSIONS = [1024, 768, 512, 256, 128]
DEFAULT_TOP_K = 5
DEFAULT_COLLECTION_PREFIX = "cinema_movies_bench"
DEFAULT_SEED_PATH = Path(__file__).resolve().parent / "data" / "movie_benchmark_seed.json"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "output"


@dataclass(frozen=True)
class MovieSeed:
    movie_id: str
    movie_name: str
    genres: list[str]
    description: str
    director: str
    actors: list[str]
    tags: list[str]

    @property
    def embedding_text(self) -> str:
        return (
            f"Tên phim: {self.movie_name}. "
            f"Thể loại: {', '.join(self.genres)}. "
            f"Mô tả: {self.description}. "
            f"Đạo diễn: {self.director}. "
            f"Diễn viên: {', '.join(self.actors)}. "
            f"Chủ đề: {', '.join(self.tags)}"
        )


@dataclass(frozen=True)
class QuerySeed:
    query_id: str
    query_text: str
    intent_type: str
    expected_movie_ids: set[str]
    expected_genres: set[str]
    expected_tags: set[str]
    hard_negative_movie_ids: set[str]


class EmbeddingProvider:
    def embed_many(self, texts: list[str], dimension: int) -> list[list[float]]:
        raise NotImplementedError

    def embed_one(self, text: str, dimension: int) -> list[float]:
        return self.embed_many([text], dimension)[0]


class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(model_name)

    def embed_many(self, texts: list[str], dimension: int) -> list[list[float]]:
        full_vectors = self.model.encode(texts, normalize_embeddings=True)
        return [truncate_and_normalize(vector, dimension) for vector in full_vectors]


class JinaEmbeddingProvider(EmbeddingProvider):
    def __init__(self, api_key: str, model_name: str = "jina-embeddings-v3"):
        if not api_key:
            raise ValueError("JINA_API_KEY is required for --backend cloud")
        self.api_key = api_key
        self.model_name = model_name

    def embed_many(self, texts: list[str], dimension: int) -> list[list[float]]:
        response = httpx.post(
            "https://api.jina.ai/v1/embeddings",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model_name,
                "input": texts,
                "dimensions": dimension,
            },
            timeout=120.0,
        )
        response.raise_for_status()
        payload = response.json()
        return [normalize_vector(item["embedding"]) for item in payload["data"]]


def configure_stdout() -> None:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def normalize_id(value: Any) -> str:
    return str(value).strip().lower()


def normalize_text_values(values: Iterable[Any]) -> list[str]:
    return [str(value).strip() for value in values if str(value).strip()]


def load_json_seed(path: Path) -> dict[str, Any]:
    raw = path.read_bytes()
    decode_errors: list[str] = []
    for encoding in ("utf-8-sig", "utf-8"):
        try:
            return json.loads(raw.decode(encoding))
        except Exception as exc:
            decode_errors.append(f"{encoding}: {exc}")
    raise ValueError(f"Could not decode seed JSON at {path}: {' | '.join(decode_errors)}")


def parse_movies(raw_movies: Iterable[dict[str, Any]]) -> dict[str, MovieSeed]:
    movies: dict[str, MovieSeed] = {}
    for raw in raw_movies:
        movie_id = normalize_id(raw.get("movieId", ""))
        if not movie_id:
            raise ValueError("Movie is missing movieId")
        if movie_id in movies:
            raise ValueError(f"Duplicate movieId: {movie_id}")

        movie = MovieSeed(
            movie_id=movie_id,
            movie_name=str(raw.get("movieName", "")).strip(),
            genres=normalize_text_values(raw.get("genres", [])),
            description=str(raw.get("description", "")).strip(),
            director=str(raw.get("director", "")).strip(),
            actors=normalize_text_values(raw.get("actors", [])),
            tags=normalize_text_values(raw.get("tags", [])),
        )
        if not movie.movie_name or not movie.embedding_text.strip():
            raise ValueError(f"Movie {movie_id} has empty benchmark text")
        movies[movie_id] = movie

    if not movies:
        raise ValueError("Seed contains no movies")
    return movies


def parse_queries(raw_queries: Iterable[dict[str, Any]], movies: dict[str, MovieSeed]) -> list[QuerySeed]:
    movie_ids = set(movies.keys())
    queries: list[QuerySeed] = []
    seen_query_ids: set[str] = set()

    for raw in raw_queries:
        query_id = str(raw.get("queryId", "")).strip()
        if not query_id:
            raise ValueError("Query is missing queryId")
        if query_id in seen_query_ids:
            raise ValueError(f"Duplicate queryId: {query_id}")
        seen_query_ids.add(query_id)

        expected_ids = {normalize_id(value) for value in raw.get("expectedMovieIds", [])}
        hard_negative_ids = {normalize_id(value) for value in raw.get("hardNegativeMovieIds", [])}
        missing_expected = sorted(expected_ids - movie_ids)
        missing_negatives = sorted(hard_negative_ids - movie_ids)
        if missing_expected:
            raise ValueError(f"{query_id} references missing expectedMovieIds: {missing_expected}")
        if missing_negatives:
            raise ValueError(f"{query_id} references missing hardNegativeMovieIds: {missing_negatives}")

        query_text = str(raw.get("queryText", "")).strip()
        if not query_text:
            raise ValueError(f"{query_id} has empty queryText")

        queries.append(
            QuerySeed(
                query_id=query_id,
                query_text=query_text,
                intent_type=str(raw.get("intentType", "")).strip(),
                expected_movie_ids=expected_ids,
                expected_genres=set(normalize_text_values(raw.get("expectedGenres", []))),
                expected_tags=set(normalize_text_values(raw.get("expectedTags", []))),
                hard_negative_movie_ids=hard_negative_ids,
            )
        )

    if not queries:
        raise ValueError("Seed contains no benchmarkQueries")
    return queries


def load_seed(path: Path) -> tuple[dict[str, MovieSeed], list[QuerySeed], dict[str, Any]]:
    data = load_json_seed(path)
    movies = parse_movies(data.get("movies", []))
    queries = parse_queries(data.get("benchmarkQueries", []), movies)
    scoring_rules = data.get("scoringRules", {})
    if not isinstance(scoring_rules.get("weights"), dict):
        raise ValueError("Seed is missing scoringRules.weights")
    return movies, queries, scoring_rules


def normalize_vector(vector: Any) -> list[float]:
    arr = np.asarray(vector, dtype=float)
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.astype(float).tolist()


def truncate_and_normalize(vector: Any, dimension: int) -> list[float]:
    arr = np.asarray(vector, dtype=float)
    if dimension > arr.shape[0]:
        raise ValueError(f"Requested dimension {dimension}, but vector only has {arr.shape[0]} values")
    return normalize_vector(arr[:dimension])


def recreate_collection(client: QdrantClient, collection_name: str, dimension: int) -> None:
    if client.collection_exists(collection_name=collection_name):
        client.delete_collection(collection_name=collection_name)

    client.create_collection(
        collection_name=collection_name,
        vectors_config=qdrant_models.VectorParams(
            size=dimension,
            distance=qdrant_models.Distance.COSINE,
        ),
    )


def upsert_movies(
    client: QdrantClient,
    collection_name: str,
    movies: dict[str, MovieSeed],
    vectors: list[list[float]],
) -> None:
    points = [
        qdrant_models.PointStruct(
            id=movie.movie_id,
            vector=vector,
            payload={
                "movie_id": movie.movie_id,
                "movie_name": movie.movie_name,
                "genres": movie.genres,
                "director": movie.director,
                "actors": movie.actors,
                "tags": movie.tags,
            },
        )
        for movie, vector in zip(movies.values(), vectors)
    ]
    client.upsert(collection_name=collection_name, wait=True, points=points)


def query_collection(
    client: QdrantClient,
    collection_name: str,
    query_vector: list[float],
    top_k: int,
) -> list[str]:
    points = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=top_k,
        with_payload=True,
    ).points

    result_ids: list[str] = []
    for point in points:
        payload = point.payload or {}
        result_ids.append(normalize_id(payload.get("movie_id", point.id)))
    return result_ids


def director_matches_expected(movie: MovieSeed, query: QuerySeed, movies: dict[str, MovieSeed]) -> bool:
    expected_directors = {movies[movie_id].director for movie_id in query.expected_movie_ids}
    return bool(movie.director and movie.director in expected_directors)


def actor_matches_expected(movie: MovieSeed, query: QuerySeed, movies: dict[str, MovieSeed]) -> bool:
    expected_actors: set[str] = set()
    for movie_id in query.expected_movie_ids:
        expected_actors.update(movies[movie_id].actors)
    return bool(set(movie.actors).intersection(expected_actors))


def score_query(
    query: QuerySeed,
    result_ids: list[str],
    movies: dict[str, MovieSeed],
    weights: dict[str, Any],
    top_k: int,
) -> dict[str, float]:
    top_results = result_ids[:top_k]
    genre_hits = 0
    hard_negative_count = 0
    semantic_score = 0.0

    for movie_id in top_results:
        movie = movies[movie_id]
        movie_genres = set(movie.genres)
        movie_tags = set(movie.tags)

        if movie_id in query.expected_movie_ids:
            semantic_score += float(weights.get("expectedMovieHit", 1.0))
        if query.expected_genres and movie_genres.intersection(query.expected_genres):
            genre_hits += 1
            semantic_score += float(weights.get("genreMatch", 0.35))
        if query.expected_tags and movie_tags.intersection(query.expected_tags):
            semantic_score += float(weights.get("tagMatch", 0.45))
        if director_matches_expected(movie, query, movies):
            semantic_score += float(weights.get("directorMatch", 0.25))
        if actor_matches_expected(movie, query, movies):
            semantic_score += float(weights.get("actorMatch", 0.25))
        if movie_id in query.hard_negative_movie_ids:
            hard_negative_count += 1
            semantic_score += float(weights.get("hardNegativePenalty", -0.8))

    denominator = max(1, len(top_results))
    return {
        "genre_precision": genre_hits / denominator,
        "hard_negative_rate": hard_negative_count / denominator,
        "semantic_score": semantic_score / denominator,
    }


def percentile(values: list[float], percent: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = (len(ordered) - 1) * percent
    lower = math.floor(index)
    upper = math.ceil(index)
    if lower == upper:
        return ordered[int(index)]
    return ordered[lower] * (upper - index) + ordered[upper] * (index - lower)


def run_dimension_benchmark(
    dimension: int,
    provider: EmbeddingProvider,
    client: QdrantClient,
    movies: dict[str, MovieSeed],
    queries: list[QuerySeed],
    scoring_rules: dict[str, Any],
    collection_prefix: str,
    top_k: int,
) -> dict[str, Any]:
    collection_name = f"{collection_prefix}_{dimension}"
    movie_texts = [movie.embedding_text for movie in movies.values()]

    start = time.perf_counter()
    movie_vectors = provider.embed_many(movie_texts, dimension)
    embedding_time_sec = time.perf_counter() - start

    recreate_collection(client, collection_name, dimension)

    start = time.perf_counter()
    upsert_movies(client, collection_name, movies, movie_vectors)
    upsert_time_sec = time.perf_counter() - start

    # Warm up query embedding once before timing Qdrant searches.
    provider.embed_one(queries[0].query_text, dimension)

    hit_at_counts = {int(k): 0 for k in scoring_rules.get("hitAtK", [1, 3, 5])}
    search_latencies_ms: list[float] = []
    query_scores: list[dict[str, float]] = []
    weights = scoring_rules.get("weights", {})

    for query in queries:
        query_vector = provider.embed_one(query.query_text, dimension)

        start = time.perf_counter()
        result_ids = query_collection(client, collection_name, query_vector, top_k)
        search_latencies_ms.append((time.perf_counter() - start) * 1000)

        for k in hit_at_counts:
            if any(movie_id in query.expected_movie_ids for movie_id in result_ids[:k]):
                hit_at_counts[k] += 1

        query_scores.append(score_query(query, result_ids, movies, weights, top_k))

    query_count = len(queries)
    result = {
        "dimension": dimension,
        "collection_name": collection_name,
        "movie_count": len(movies),
        "query_count": query_count,
        "embedding_time_sec": round(embedding_time_sec, 4),
        "upsert_time_sec": round(upsert_time_sec, 4),
        "avg_search_ms": round(statistics.mean(search_latencies_ms), 4),
        "p50_search_ms": round(percentile(search_latencies_ms, 0.50), 4),
        "p95_search_ms": round(percentile(search_latencies_ms, 0.95), 4),
        "genre_precision@5": round(statistics.mean(score["genre_precision"] for score in query_scores), 4),
        "hard_negative_rate@5": round(statistics.mean(score["hard_negative_rate"] for score in query_scores), 4),
        "semantic_score@5": round(statistics.mean(score["semantic_score"] for score in query_scores), 4),
        "estimated_vector_memory_mb": round(len(movies) * dimension * 4 / (1024 * 1024), 4),
    }

    for k, count in hit_at_counts.items():
        result[f"hit@{k}"] = round(count / query_count, 4)

    return result


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, rows: list[dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")


def plot_metric(rows: list[dict[str, Any]], metric: str, title: str, ylabel: str, output_path: Path) -> None:
    dimensions = [row["dimension"] for row in rows]
    values = [row[metric] for row in rows]

    plt.figure(figsize=(9, 5))
    plt.plot(dimensions, values, marker="o", linewidth=2)
    plt.gca().invert_xaxis()
    plt.title(title)
    plt.xlabel("Embedding dimension")
    plt.ylabel(ylabel)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=160)
    plt.close()


def plot_quality_vs_latency(rows: list[dict[str, Any]], output_path: Path) -> None:
    plt.figure(figsize=(8, 5))
    for row in rows:
        plt.scatter(row["avg_search_ms"], row["semantic_score@5"], s=80)
        plt.annotate(str(row["dimension"]), (row["avg_search_ms"], row["semantic_score@5"]))
    plt.title("Quality vs latency")
    plt.xlabel("Average search latency (ms)")
    plt.ylabel("semantic_score@5")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=160)
    plt.close()


def write_plots(output_dir: Path, rows: list[dict[str, Any]]) -> None:
    plot_metric(rows, "semantic_score@5", "Embedding dimension quality", "semantic_score@5", output_dir / "dimension_quality.png")
    plot_metric(rows, "avg_search_ms", "Embedding dimension latency", "Average search latency (ms)", output_dir / "dimension_latency.png")
    plot_metric(rows, "estimated_vector_memory_mb", "Estimated vector memory", "Memory (MB)", output_dir / "dimension_memory_estimate.png")
    plot_metric(rows, "hard_negative_rate@5", "Hard negative rate", "hard_negative_rate@5", output_dir / "dimension_hard_negative_rate.png")
    plot_quality_vs_latency(rows, output_dir / "dimension_quality_vs_latency.png")


def parse_dimensions(raw: str) -> list[int]:
    dimensions = [int(value.strip()) for value in raw.split(",") if value.strip()]
    if not dimensions:
        raise argparse.ArgumentTypeError("At least one dimension is required")
    return dimensions


def build_provider(args: argparse.Namespace) -> EmbeddingProvider:
    if args.backend == "cloud":
        return JinaEmbeddingProvider(api_key=args.jina_api_key)
    return LocalEmbeddingProvider(model_name=args.model)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Benchmark movie embedding dimensions with Qdrant.")
    parser.add_argument("--seed", type=Path, default=DEFAULT_SEED_PATH)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--dimensions", type=parse_dimensions, default=DEFAULT_DIMENSIONS)
    parser.add_argument("--top-k", type=int, default=DEFAULT_TOP_K)
    parser.add_argument("--collection-prefix", default=DEFAULT_COLLECTION_PREFIX)
    parser.add_argument("--qdrant-url", default=os.getenv("QDRANT_URL", "http://localhost:6333"))
    parser.add_argument("--qdrant-api-key", default=os.getenv("QDRANT_API_KEY", ""))
    parser.add_argument("--backend", choices=["local", "cloud"], default=os.getenv("EMBEDDING_BACKEND", "local"))
    parser.add_argument("--model", default=os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3"))
    parser.add_argument("--jina-api-key", default=os.getenv("JINA_API_KEY", ""))
    return parser


def main() -> None:
    configure_stdout()
    args = build_parser().parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    movies, queries, scoring_rules = load_seed(args.seed)
    print(f"Loaded benchmark seed: movies={len(movies)}, queries={len(queries)}")

    provider = build_provider(args)
    client = QdrantClient(
        url=args.qdrant_url,
        api_key=args.qdrant_api_key if args.qdrant_api_key else None,
    )

    results: list[dict[str, Any]] = []
    for dimension in args.dimensions:
        print(f"Running benchmark for dimension={dimension}...")
        results.append(
            run_dimension_benchmark(
                dimension=dimension,
                provider=provider,
                client=client,
                movies=movies,
                queries=queries,
                scoring_rules=scoring_rules,
                collection_prefix=args.collection_prefix,
                top_k=args.top_k,
            )
        )

    results = sorted(results, key=lambda row: row["dimension"], reverse=True)
    write_csv(args.output_dir / "embedding_dimension_benchmark.csv", results)
    write_json(args.output_dir / "embedding_dimension_benchmark.json", results)
    write_plots(args.output_dir, results)

    print(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"Benchmark outputs written to: {args.output_dir}")


if __name__ == "__main__":
    main()
