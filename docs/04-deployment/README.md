# 🚀 Deployment - Развертывание

Инструкции по развертыванию Enterprise 1C AI Stack

---

## 📚 Содержание раздела

1. **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** - production setup
2. **[kubernetes/](./kubernetes/)** - Kubernetes configuration
3. **[security/](./security/)** - Security guidelines

---

## 🎯 Deployment Options

### **1. Docker Compose (Development)**
```bash
docker-compose up -d
```

### **2. Kubernetes (Production)**
```bash
kubectl apply -f k8s/
```

### **3. Cloud Platforms**
- AWS EKS
- Azure AKS
- Google GKE

---

## 📋 Pre-requisites

- Docker 24+
- Kubernetes 1.28+
- PostgreSQL 15+
- Redis 7+

---

[← AI Agents](../03-ai-agents/) | [→ Development](../05-development/)

