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

### Package (Automatisch erzeugtes Image)
Bei jedem Push wird ein Image im Github angelegt

ghcr.io/dbildungsplattform/schulportal-client:*tag*

### Backend laufen lassen
Falls ihr nicht am Backend entwickelt aber es dennoch braucht tut bitte folgendes:

1. dbiam-server auschecken (https://github.com/dBildungsplattform/dbildungs-iam-server)
2. Im Server findet ihr ein compose file. Wenn ihr es ohne profile ausführt, bekommt ihr lediglich Keycloak/Redis/Datenbank
3. Führt ihr jedoch mit Profil "full-backend" aus (docker compose up --profile full-backend) wird für euch auch das Backend/BFF gestartet und ausgeführt

Resultat: Das BFF hört auf localhost:9091