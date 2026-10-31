terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.6"
    }
  }
}

provider "kind" {}

resource "kind_cluster" "ledgerlens" {
  name            = "ledgerlens"
  node_image      = "kindest/node:v1.31.2"
  kubeconfig_path = "${path.module}/kubeconfig"
  wait_for_ready  = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"

      kubeadm_config_patches = [
        "kind: InitConfiguration\nnodeRegistration:\n  kubeletExtraArgs:\n    node-labels: ingress-ready=true\n"
      ]

      extra_port_mappings {
        container_port = 80
        host_port      = 8081
        protocol       = "TCP"
      }

      extra_port_mappings {
        container_port = 443
        host_port      = 8444
        protocol       = "TCP"
      }
    }
  }
}

# Install the Traefik Ingress controller after the cluster exists.
# The provisioner keeps this in the same local-only Terraform workflow without
# requiring Kubernetes provider configuration during the cluster's first plan.
resource "terraform_data" "ingress_traefik" {
  triggers_replace = [
    kind_cluster.ledgerlens.id,
    kind_cluster.ledgerlens.kubeconfig_path,
    filesha256("${path.module}/../deploy/traefik-values.yaml"),
  ]

  provisioner "local-exec" {
    interpreter = ["/bin/sh", "-c"]
    command     = <<-EOT
      set -eu
      helm repo add traefik https://traefik.github.io/charts --force-update
      helm repo update traefik
      helm upgrade --install ledgerlens-traefik traefik/traefik \
        --namespace traefik --create-namespace \
        --kubeconfig '${kind_cluster.ledgerlens.kubeconfig_path}' \
        --values '${path.module}/../deploy/traefik-values.yaml' \
        --wait --timeout 180s
    EOT
  }

}

resource "terraform_data" "kubeconfig_cleanup" {
  triggers_replace = [kind_cluster.ledgerlens.id, kind_cluster.ledgerlens.kubeconfig_path]
  depends_on       = [terraform_data.ingress_traefik]

  provisioner "local-exec" {
    when        = destroy
    interpreter = ["/bin/sh", "-c"]
    command     = "rm -f '${self.triggers_replace[1]}'"
  }
}

output "cluster_name" {
  value       = kind_cluster.ledgerlens.name
  description = "Local kind cluster created for the LedgerLens demo."
}

output "kubeconfig_path" {
  value       = kind_cluster.ledgerlens.kubeconfig_path
  description = "Kubeconfig path for the local LedgerLens cluster."
}

output "dashboard_url" {
  value       = "http://localhost:8081"
  description = "Local dashboard URL after running scripts/deploy-local.sh."
}
