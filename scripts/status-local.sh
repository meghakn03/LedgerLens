#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kubeconfig="$repo_root/terraform/kubeconfig"
if [[ ! -f "$kubeconfig" ]]; then
  echo "Local cluster not found. Run ./scripts/up.sh first." >&2
  exit 1
fi

kubectl --kubeconfig "$kubeconfig" -n ledgerlens get deployments,pods,services -o wide
printf '\nDashboard: '
curl --fail --silent --show-error http://localhost:8081/healthz
printf 'API health: '
curl --fail --silent --show-error http://localhost:8081/health
printf 'API metrics:\n'
curl --fail --silent --show-error http://localhost:8081/metrics
