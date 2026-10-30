# LedgerLens

LedgerLens is a local-first fintech operations demo for reviewing synthetic card transactions. It does not connect to banking services, move money, or use real customer data. API review notes live in memory and reset when the API restarts.

## Quick start: local Kubernetes

Requirements: Docker Desktop, Terraform 1.5+, kind, kubectl, and Helm 3.

```sh
./scripts/up.sh
```

The script provisions a local kind cluster and Traefik Ingress with Terraform, builds and loads the web and API images, applies the Kubernetes manifests, and waits for both deployments. Open **http://localhost:8081**.

To apply app changes after editing code or manifests:

```sh
./scripts/deploy-local.sh
```

Remove the cluster and its local resources with:

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

The API provides `/health`, `/api/transactions`, `/api/rules`, and `POST /api/transactions/{id}/review`. Review requests accept `{"note":"Confirmed for the demo."}`. The rules engine flags purchases of $1,000 or more and 4+ transactions in 10 minutes.

## Run with Docker Compose

```sh
docker compose up --build
```

Open the dashboard at **http://localhost:8080**. The API is available at **http://localhost:8000**.

## CI

GitHub Actions builds the frontend, runs backend rule and API tests, validates Terraform formatting and configuration, checks Kubernetes manifests against their schemas, and builds both container images. It does not publish images or deploy to a remote cluster.
