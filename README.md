# podverse-workers

Worker scripts that are invoked on-demand within their own containers.

## NOTE!

The `podverse-workers` module should not be imported into any other Podverse repos!

This module is intended only for running scripts that are invoked within their own containers. If you need code that can be imported into other repos, it should go in one of the following modules instead:

podverse-external-services
podverse-orm
podverse-parser
podverse-shared

## Developing Podverse modules

Podverse maintains several different modules which are imported across apps. Please read [Developing Podverse modules](https://github.com/podverse/podverse-ops/blob/master/docs/how-to-develop-podverse-modules.md) for a workflow you can use to make code changes to this module locally.

## Setup

```
yarn
```

## Development

```
yarn dev:watch
```
