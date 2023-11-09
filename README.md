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

### Package (Create Docker Image )
If you push a tag upstream a container will be created for you. (Check Github under Packages)

ghcr.io/dbildungsplattform/schulportal-client:*tag*

### Docker images for Backend and BFF
If you just want to test the client and have no inclination to run the backend for yourself where's a package available
at: ghcr.io/dbildungsplattform/dbildungs-iam-server:*branchname*

If you run it without any parameters it will give you the **backend**
For the frontend you have to supply the command:
`node dist/src/backend-for-frontend/main.js`

