# LedgerLens

LedgerLens is a local-first fintech operations demo for reviewing synthetic card transactions. It does not connect to banking services, move money, or use real customer data. API review notes live in memory and reset when the API restarts.

## One-command local setup

From the repository root, with Docker Desktop, Terraform 1.5+, kind, kubectl, and Helm 3 installed, run:

```sh
./scripts/up.sh
```

The script checks the required tools and Docker, provisions a local kind cluster and Traefik Ingress with Terraform, builds and loads versioned web and API images, applies the Kubernetes manifests, and waits for both deployments. Open **http://localhost:8081**. Setup is safe to rerun after interrupted provisioning.

## Deploy and roll back

After changing app code or Kubernetes manifests, deploy a new local revision:

```sh
./scripts/deploy-local.sh
```

Each deploy uses a unique local image tag, so Kubernetes keeps a usable revision history. To revert both services to their previous deployment revision:

```sh
./scripts/rollback-local.sh
```

Check rollout history with `kubectl --kubeconfig terraform/kubeconfig -n ledgerlens rollout history deployment/ledgerlens-api` (replace `ledgerlens-api` with `ledgerlens-web` to inspect the dashboard). Rollback requires a previous successful deployment. The demo API stores reviewer notes in memory, so notes reset when the API pod is replaced or rolled back.

To remove the cluster and its local resources:

```sh
./scripts/down.sh
```

Terraform state and the generated kubeconfig are local to `terraform/` and are ignored by Git.

## Run without Kubernetes

Run the API in one terminal:

```sh
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Then, in the repository root, run the dashboard:

```sh
npm ci
npm run dev
```

Open the Vite URL printed in the terminal. Vite proxies API requests to `localhost:8000`. With the API stopped, the dashboard uses its built-in synthetic seed data.

The API provides `/health`, `/health/live`, `/health/ready`, `/metrics`, `/api/transactions`, `/api/rules`, and `POST /api/transactions/{id}/review`. Review requests accept `{"note":"Confirmed for the demo."}`. The rules engine flags purchases of $1,000 or more and 4+ transactions in 10 minutes.

## Health and observability

Kubernetes checks API liveness at `/health/live`, API readiness at `/health/ready`, and web health at `/healthz`; unhealthy containers are restarted or kept out of service. The API writes one JSON request log per request to stdout and exposes a Prometheus text counter at `/metrics`. These counters are process-local demo metrics and reset when the API restarts.

Quick status check (deployment and pod state, dashboard health, API health, and metrics):

```sh
./scripts/status-local.sh
```

Follow API or web logs:

```sh
./scripts/logs-local.sh api
./scripts/logs-local.sh web
```

## Run with Docker Compose

```sh
docker compose up --build
```

Open the dashboard at **http://localhost:8080**. The API is available at **http://localhost:8000**.

## CI

GitHub Actions runs on every push and pull request, and can be started from the repository's **Actions → CI → Run workflow** page. It builds the frontend, runs backend tests, validates Terraform formatting and configuration, checks Kubernetes manifests against their schemas, and builds both container images. CI does not publish images or deploy to a remote cluster.
