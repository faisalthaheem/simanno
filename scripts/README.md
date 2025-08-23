# Simple Image Annotator (SimAnno)  scripts
These scripts perform a variety of jobs and facilitate with training custom models.
For full documentation please visit https://github.com/faisalthaheem/simanno

To build and test with a docker container, use the following command

```bash
sh build-image.sh

docker run --rm -it -u $UID -v $PWD:/datasets faisalthaheem/simanno-scripts:dev "/usr/local/bin/python3.8 /simanno/scripts/mergedbs.py -c /datasets/mergedbs.yaml"
````
