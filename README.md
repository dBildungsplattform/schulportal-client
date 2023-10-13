# schulportal-client

## Dependencies installieren

```sh
npm install
```

### Mit Hot-Reload für Dev kompilieren

```sh
npm run dev
```

### Für Prod kompilieren

```sh
npm run build
```

### ESLint ausführen

```sh
npm run lint
```

## dBildungs-IAM Keycloak starten

```sh
# Repo klonen
git clone git@github.com:dBildungsplattform/dbildungs-iam-keycloak.git

# In Ordner wechseln
cd dbildungs-iam-keycloak

# docker-compose.yml aus dem Keycloak Setup in Confluence verwenden

# Start
docker compose up

# Start im Hintergrund
docker compose up -d

```

### Package (Docker Image erzeugen)
Tags, die in das Repo gepusht werden erzeugen ein docker package:

ghcr.io/dbildungsplattform/dbildungs-iam-server:*tag*