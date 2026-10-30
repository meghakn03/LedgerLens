# Local Kubernetes resources

Terraform provisions a kind cluster and installs the Traefik Ingress controller from its official Helm chart. The kind control-plane port maps host port `8081` to the controller's HTTP port. Terraform needs Docker, kind, kubectl, and Helm 3 available on `PATH`.

From the repository root, the complete workflow is:

```sh
./scripts/up.sh
```

This runs `terraform init` and `terraform apply`, then builds and loads the app images and applies `deploy/kubernetes.yaml`. Open `http://localhost:8081` when the script completes. To remove the local cluster, run `./scripts/down.sh`.

The Terraform apply step installs the controller and creates cluster networking. App Deployments, Services, ConfigMap, and Ingress are applied by `scripts/deploy-local.sh`; this keeps local image builds and cluster image loading explicit.
