#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

for command in docker kind kubectl terraform helm; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

docker info >/dev/null
terraform -chdir=terraform init
terraform -chdir=terraform apply
"$repo_root/scripts/deploy-local.sh"
