#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kubeconfig="$repo_root/terraform/kubeconfig"
if [[ ! -f "$kubeconfig" ]]; then
  echo "Local cluster not found. Run ./scripts/up.sh first." >&2
  exit 1
fi

for deployment in ledgerlens-api ledgerlens-web; do
  kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout undo "deployment/$deployment"
  kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout status "deployment/$deployment" --timeout=180s
done
echo "Rollback complete. Current deployment revisions:"
kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout history deployment/ledgerlens-api
kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout history deployment/ledgerlens-web
