# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS runner

# Install Python & Curl for running AI tests & API health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Install pytest and httpx for Python contract checks
RUN pip3 install --no-cache-dir pytest httpx

ENTRYPOINT ["/bin/bash"]
