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