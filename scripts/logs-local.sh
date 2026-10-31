#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kubeconfig="$repo_root/terraform/kubeconfig"
if [[ ! -f "$kubeconfig" ]]; then
  echo "Local cluster not found. Run ./scripts/up.sh first." >&2
  exit 1
fi
service="${1:-api}"
case "$service" in
  api) deployment=ledgerlens-api ;;
  web) deployment=ledgerlens-web ;;
  *) echo "Usage: ./scripts/logs-local.sh [api|web]" >&2; exit 2 ;;
esac
kubectl --kubeconfig "$kubeconfig" -n ledgerlens logs "deployment/$deployment" --all-containers=true --tail=100 --follow
