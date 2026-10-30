#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kubeconfig="$repo_root/terraform/kubeconfig"

if [[ ! -f "$kubeconfig" ]]; then
  echo "Local cluster not found. Run ./scripts/up.sh first." >&2
  exit 1
fi

docker build -t ledgerlens-api:local "$repo_root/backend"
docker build -t ledgerlens-web:local "$repo_root"
kind load docker-image ledgerlens-api:local ledgerlens-web:local --name ledgerlens
kubectl --kubeconfig "$kubeconfig" apply -f "$repo_root/deploy/kubernetes.yaml"
kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout status deployment/ledgerlens-api --timeout=180s
kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout status deployment/ledgerlens-web --timeout=180s

echo "LedgerLens is available at http://localhost:8081"
