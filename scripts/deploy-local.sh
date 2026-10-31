#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
kubeconfig="$repo_root/terraform/kubeconfig"

if [[ ! -f "$kubeconfig" ]]; then
  echo "Local cluster not found. Run ./scripts/up.sh first." >&2
  exit 1
fi

revision="${LEDGERLENS_REVISION:-$(git -C "$repo_root" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
tag="local-${revision}-$(date +%Y%m%d%H%M%S)"
docker build -t "ledgerlens-api:$tag" "$repo_root/backend"
docker build -t "ledgerlens-web:$tag" "$repo_root"
kind load docker-image "ledgerlens-api:$tag" "ledgerlens-web:$tag" --name ledgerlens
manifest="$(mktemp)"
trap 'rm -f "$manifest"' EXIT
sed "s|ledgerlens-api:local|ledgerlens-api:$tag|g; s|ledgerlens-web:local|ledgerlens-web:$tag|g" "$repo_root/deploy/kubernetes.yaml" > "$manifest"
kubectl --kubeconfig "$kubeconfig" apply -f "$manifest"
kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout status deployment/ledgerlens-api --timeout=180s
kubectl --kubeconfig "$kubeconfig" -n ledgerlens rollout status deployment/ledgerlens-web --timeout=180s
kubectl --kubeconfig "$kubeconfig" -n ledgerlens annotate deployment/ledgerlens-api "ledgerlens.dev/revision=$tag" --overwrite
kubectl --kubeconfig "$kubeconfig" -n ledgerlens annotate deployment/ledgerlens-web "ledgerlens.dev/revision=$tag" --overwrite

echo "Deployed $tag; LedgerLens is available at http://localhost:8081"
