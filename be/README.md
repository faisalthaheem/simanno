# Simanno Backend

## Quick start
Checkout this repo and issue the following command to test everything works.

This command starts the Simanno backend service in a Docker container. It maps port 8000 of the host to port 8000 of the container, and mounts the local db and sample-images directories to the container's corresponding directories. These paths can be overridden in the container to work with other datasets:

- /app/imanno.yaml - Path to the configuration file
- /app/db - Path to the database directory
- /app/sample-images - Path to the sample images directory (defined in the yaml file)

```bash
docker run --rm -p 8000:8000 -it \
-v ./db:/app/db \
-v ./sample-images:/app/sample-images faisalthaheem/simanno-be:latest
```

## API Documentation

This service provides API documentation through Swagger UI and ReDoc:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Configuration file reference

The Simanno backend uses a configuration file (imanno.yaml) to define various settings. The configuration file contains the following keys:

- `labels.list`: Defines the mapping of label IDs to their names. For example:
  ```yaml
  labels:
    list:
      1: plate
      2: signal
  ```
  This maps ID 1 to "plate" and ID 2 to "signal".

- `labels.default`: Specifies the default label ID to use when no label is specified. In the example above, the default label ID is 1.

- `anno.dbs`: Path to the database file. This is used to specify where the SQLite database is located.
  ```yaml
  anno:
    dbs: ./db/sample.db
  ```

- `anno.rawimgs`: Path to the directory containing raw images. This is used to specify where the raw images are located.
  ```yaml
  anno:
    rawimgs: ./sample-images
  ```

- `anno.refimgs`: Path to the directory containing reference images. This is used to specify where the reference images are located.
  ```yaml
  anno:
    refimgs: ./sample-images
  ```

- `anno.createIfAbsent`: A boolean flag that determines whether to create the database if it doesn't exist. In the example above, this is set to `True`.
