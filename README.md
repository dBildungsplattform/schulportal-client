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

## Locally building and running the client as docker container

If you need to fix problems that occur in the cluster, but not with `npm run preview`, it is probably a problem with the build or nginx config. 

To run that locally use the following commands:
```
docker build -t spsh-client .
docker run -p 8099:80 spsh-client
```
