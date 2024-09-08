# podverse-workers

Podverse worker scripts for jobs which need to run and complete.

## Dev Setup

### Environment Variables

Create a .env file in the root of this project, based on the example found in [podverse-ops/config/podverse-workers.env.example](https://github.com/podverse/podverse-ops/tree/database-schema/config).

### Local Dev Workflow

Podverse uses many modules that are maintained in separate repos, and they need to be linked and running for a local dev workflow. Please read the `podverse-workers/dev/local-dev-setup.md` file to set up the required dependencies and module linking.

### Running Locally

Install the node_modules:

```
npm install
```

You will then need to run whichever command you want to run, according to what scripts are available within the `package.json`.

## Deploying

To deploy, build the docker image using the Dockerfile, and deploy the image on your server using the `podverse-ops/docker-compose.yml` file. See the `podverse-ops/dev/deploying.md` file for more info.
