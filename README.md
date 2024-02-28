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

## Backend lokal starten

## API lokal generieren
1. Java Runtime Environment lokal installieren
2. `npm run generate-client` ausführen
3. api.ts wird generiert und beinhaltet alle Controller für die spezifizierten Endpunkte


### Package (Create Docker Image )
If you push a tag upstream a container will be created for you. (Check Github under Packages)

ghcr.io/dbildungsplattform/schulportal-client:*tag*


## Checking for CSP issues

Using `npm run dev` is quite different from the productive deployment. Locally no restrictive CSP can be applied, because it would block any convenient feature for development. <br>
Thus to figure out CSP issues you need to run `npm run build` and `npm run preview`. Vite will start a local file server that serves files very similar to a prod environment.

Note: Even with the vite preview the nonce placeholder will not be replaced by an actual nonce.
To be even more similar to prod you need to create and run a docker image with the provided Dockerfile. Than the client will be served by nginx and the nonce will be generated.

### Package (Docker-Image)
Wenn ihr einen Tag pusht wird von GitHub für euch ein Docker-Image generiert. Schaut dazu im GitHub unter "packages"
nach. Wichtig ist, dass euer Branch dafür mit einer JIRA-Issue ID beginnt. 

ghcr.io/dbildungsplattform/schulportal-client:*tag*

### Docker images für das Backend und BFF
Wenn ihr nur den Client testen wollt und dafür ein Docker-Image braucht für das Backend und BFF
liegen diese
hier: ghcr.io/dbildungsplattform/dbildungs-iam-server:*branchname oder latest für main*

Wenn man das Backend-Image ohne Parameter aufruft, bekommt man das Backend. Für BFF braucht man noch einen Aufrufparameter:
`node dist/src/backend-for-frontend/main.js`

## Beispiel
Die folgenden Beispiele gehen davon aus, dass ihr eine Docker-CLI habt. Andere OCI-Runtimes sollten funktionieren.
Ihr müsst eure Parameter entsprechend anpassen.

Ihr müsst zusätzlich noch ein Volume einhängen mit Konfigurationsdateien und Umgebungsvariablen setzen,
damit sie gezogen werden. (HINWEIS: Die Konfiguration ist WIP, das wird noch vereinfacht)
Backend: `docker run --rm -eDEPLOY_STAGE=dev -eNODE_ENV=dev --volume="$(PWD)/config:/app/config" <IMAGE-NAME>`
BFF: `docker run --rm -eDEPLOY_STAGE=dev -eNODE_ENV=dev --volume="$(PWD)/config:/app/config" <IMAGE-NAME> node dist/src/backend-for-frontend/main.js`

| Parameter                            | Erklärung                                                                    |
|--------------------------------------|------------------------------------------------------------------------------|
| run --rm                             | Container entfernen, nachdem er beendet wurde                                |
| -eDEPLOY_STAGE=dev                   | Umgebungsvariable für die Stage                                              |
| -eNODE_ENV=dev                       | Umgebungsvariable für die Nodeumgebung                                       |
| --volume="$(PWD)/config:/app/config" | Verzeichnis mit Konfigurationsdateien an die richtige Stelle im Container    |
|                                      | `$(PWD)` ist das aktuelle Verzeichnis, der Pfad muss für Docker absolut sein |
| <IMAGE-NAME>                         | Name des Images, das wir laufen lassen wollen                                |
| docker build -t <IMAGE-NAME> .       | Baut ein lokal image anhand des Dockerfile                                   |