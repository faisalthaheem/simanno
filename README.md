# simanno

![AutomatedBuildBadge](https://img.shields.io/docker/cloud/automated/faisalthaheem/simanno) ![DockerCloudBuildStatus](https://img.shields.io/docker/cloud/build/faisalthaheem/simanno) ![DockerPulls](https://img.shields.io/docker/pulls/faisalthaheem/simanno) ![GithubLastCommit](https://img.shields.io/github/last-commit/faisalthaheem/simanno)

Simple Image Annotation (SimAnno) Tool for Deep Learning Projects.

SimAnno is a web based image annotation tool that uses sqlite database(s) to maintain annotations for images and consists of a front end which is an app written in Angular 8 and is supported by a Flask based python 3 REST service backend.

This repository has been refactored to serve as the documentation and general information repo, for specific modules please refer to the respective repositories below.


|Module|Repo link|
|---|---|
|Documentation|This repo|
|Backend|https://github.com/faisalthaheem/simanno-be|
|Frontend|https://github.com/faisalthaheem/simanno-fe|
|Scripts|https://github.com/faisalthaheem/simanno-scripts|

At the heart of the project is the great [jquery select areas plugin](https://github.com/360Learning/jquery-select-areas).

The tool makes it easy to keep images on a headless environment and access them from any web browser. Once images have been tagged a training record can be generated to be fed to the learning/evaluating scripts. See [life2tfrec.py](https://github.com/faisalthaheem/deep-learning-scripts/blob/master/dbutils/lite2tfrec.py) for an example of how the databases generated by this tool are being used.

The easiest and straightforward way is to use Docker to run the services, see [Running with Docker](https://github.com/faisalthaheem/simanno/wiki/Running-with-Docker) for more information. 

If you would like to run outside of Docker, you will need to install dependencies, please refer to  [Setup Guide](https://github.com/faisalthaheem/simanno/wiki/Setup-Guide) to get started.

# Demo

![Demo](https://rawcdn.githack.com/faisalthaheem/simanno/f30c565754724ac7c5077f55311baf7ef85243a6/screenshots/demo.gif)

## Annotation Screen
Following screen a sample image with different areas marked with appropriate labels
![Annotation Screen](https://rawcdn.githack.com/faisalthaheem/simanno/daec6b7be6a4dcfbd2f332199bcc97bc5b130e1c/screenshots/annotating-v2.png)

## ROI (Regions Of Interest) Wall
Following image shows the regions of interest extracted from the available data for a quick review
![ROI Wall](https://raw.githack.com/faisalthaheem/simanno/master/screenshots/wall-v2.png)

## Running the demo locally
If you have cloned the repositories and are developing, you can use the following command to launch the stack in development mode
```bash
docker-compose -f docker-compose.dev.yml up -d
```

And to launch the stack without using the development containers, use the following command
```bash
docker-compose -f docker-compose.yml up -d
```

# Issues and Feedback
Please use the issues link on the top to report any issues/feedback/suggestions.

# Scripts

There are few useful scripts that faciliate data import and export to/from simanno. The following section describes these briefly.

## app/scripts/import-cat-from-coco.py

> Using this script you can extract a category of images from the COCO dataset.

The scripts expects the following arguments
The comand expects the following arguments
```bash
usage: import-cat-from-coco.py [-h] -c CATEGORY -t TYPE -li LBLID -af ANNOTATIONFILE -sp SRCPATH -dp DESTPATH

optional arguments:
  -h, --help            show this help message and exit
  -c CATEGORY, --category CATEGORY
                        The category to extract.
  -t TYPE, --type TYPE  Type to assign to images, accepted values are train or val, default is train.
  -li LBLID, --lblid LBLID
                        The label id to be used for this category.
  -af ANNOTATIONFILE, --annotationfile ANNOTATIONFILE
                        Path to annotation file.
  -sp SRCPATH, --srcpath SRCPATH
                        Path of source containing images.
  -dp DESTPATH, --destpath DESTPATH
                        Path to destination to create the db and save images to.
```

For instance, the following command extracts all images belonging to the "cars" category and moves them to a destination folder while also creating a stand alone sqlite db that works with simanno.
```bash
python3 import-cat-from-coco.py \
-t val -c car -li 1 \
-af $COCO_PATH/annotations/instances_val2017.json 
-dp $CARS_FROM_COCO_PATH 
-sp $COCO_PATH/val2017/
```

Where, the parameters are
|Parameter|Valid values|Description|
|---|---|---|
|-t |val or train| Type of dataset that is being created for simanno. Influences the names of db file and destination folder.|
|-c |string| Name of category that should exist in coco dataset.|
|-li|integer| The label index to be assigned when records are added to db. Label text is taken from the -c parameter.|
|-af|path| Path to the coco annotations file.|
|-dp|path| Path to the destination folder which will contain a database file and a folder containing images copied from the coco dataset.|
|-sp|path| Path to the source folder containing coco images to be copied from into the destination folder.|


Alternatively you can use the docker-container version to run this script with the following command
```bash
docker run --rm -it -u $UID -v $PWD:/datasets faisalthaheem/simanno:scripts-2.0 "/usr/local/bin/python3.8 import-cat-from-coco.py -t val -c car -li 1 -af /datasets/coco/annotations/instances_val2017.json -dp /datasets/cars_from_coco -sp /datasets/coco/val2017/"
```

```bash
docker run --rm -it -u $UID -v $PWD:/datasets faisalthaheem/simanno:scripts-2.0 "/usr/local/bin/python3.8 import-cat-from-coco.py -t train -c car -li 1 -af /datasets/coco/annotations/instances_train2017.json -dp /datasets/cars_from_coco -sp /datasets/coco/train2017/"
```

> Notice "/usr/local/bin/python3.8" which is important in the image

## app/scripts/mergedbs.py
> For merging multiple simanno datasets into a single set for training and validation.

This script uses a yaml configuration file as input and provides remapping of the source labels in addition to merging annotations db table and files. 

As output train and val folders containing images and train and val dbs are produced. 

If the destination dbs exist then they are deleted before re-generation, files are only copied again if missing in destination.


For an example of a sample merge config file please take a look at
```bash
conf/scripts/mergedbs.sample.yaml
```

The comand expects the following arguments
```bash
usage: mergedbs.py [-h] -c CONFIGFILE

optional arguments:
  -h, --help            show this help message and exit
  -c CONFIGFILE, --configfile CONFIGFILE
                        Path to the merge config file.
```

To execute, use the following command
```bash
python3 mergedbs.py -c mergedbs.yaml
```

Or, use the docker variant as given below, assuming you're in the folder containing all your datasets
```bash
docker run --rm -it -u $UID -v $PWD:/datasets faisalthaheem/simanno:scripts-2.0 "/usr/local/bin/python3.8 /simanno/scripts/mergedbs.py -c /datasets/mergedbs.yaml"
```