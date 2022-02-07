from pycocotools.coco import COCO
import sys
import os
import argparse
import sqlite3
import json
import shutil

# Sample invocation
# python3 import-cat-from-coco.py -t val -c car -li 1 -af $CARS_FROM_COCO_PATH/annotations/instances_val2017.json -dp $CARS_FROM_COCO_PATH -sp $COCO_PATH/val2017/
# python3 import-cat-from-coco.py -t train -c car -li 1 -af $COCO_PATH/annotations/instances_train2017.json -dp $CARS_FROM_COCO_PATH -sp $COCO_PATH/train2017/

ap = argparse.ArgumentParser()

ap.add_argument("-c", "--category", required=True,
    help="The category to extract.")
ap.add_argument("-t", "--type", required=True,
    help="Type to assign to images, accepted values are train or val, default is train.")
ap.add_argument("-li", "--lblid", required=True,
    help="The label id to be used for this category.")

ap.add_argument("-af", "--annotationfile", required=True,
    help="Path to annotation file.")
ap.add_argument("-sp", "--srcpath", required=True,
    help="Path of source containing images.")
ap.add_argument("-dp", "--destpath", required=True,
    help="Path to destination to create the db and save images to.")

args = vars(ap.parse_args())

print("Checking paths...")

#ensure that provided paths exist or create where necessary
#check that source paths exist
if False == os.path.exists(args['annotationfile']):
    print("The path [{}] does not exist.".format(args['annotationfile']))
    sys.exit(0)

if False == os.path.exists(args['srcpath']):
    print("The path [{}] does not exist.".format(args['srcpath']))
    sys.exit(0)

#create dest path
DEST_PATH_IMAGES = os.path.join(args['destpath'], args['type'])
DEST_PATH_DB = os.path.join(args['destpath'], '{}.db'.format(args['type']))
os.makedirs(exist_ok=True, name=DEST_PATH_IMAGES)

if True == os.path.exists(DEST_PATH_DB):
    print("The db already existing at [{}], removed to be recreated.".format(DEST_PATH_DB))
    os.remove(DEST_PATH_DB)

print("Setting up db...")
#open db
db_conn = sqlite3.connect(DEST_PATH_DB,1000)
db_cursor = db_conn.cursor()


print("Begin processing")
coco = COCO(args['annotationfile'])
category_id  = coco.getCatIds(catNms=[args['category']])
annotation_ids = coco.getAnnIds(catIds=category_id, iscrowd=None)
all_annotations = coco.loadAnns(annotation_ids)

init_script = ""
with open("./db_init_script_sql", "r") as init_script_sql:
    init_script = init_script_sql.read()

db_conn.executescript(init_script)

#begin copying files
#aggregate
metadata_aggregate = {}

for i in range(0, len(all_annotations)):
    cur_ann    = all_annotations[i]
    cbbox      = cur_ann["bbox"]
    cimg_info  = coco.loadImgs(cur_ann["image_id"])

    metadata = None
    if cimg_info[0]["file_name"] in metadata_aggregate:
        metadata = metadata_aggregate[cimg_info[0]["file_name"]]
    else:
        metadata = {
            "file_name": cimg_info[0]["file_name"],
            "height": cimg_info[0]["height"],
            "width": cimg_info[0]["width"],
            "imgareas": []
        }
        metadata_aggregate[cimg_info[0]["file_name"]] = metadata

    
    imgarea_id = len(metadata['imgareas']) + 1

    imgarea = {
        "id": imgarea_id,
        "x": int(cbbox[0]),
        "y": int(cbbox[1]),
        "z": 100,
        "width": int(cbbox[2]),
        "height": int(cbbox[3]),
        "lblid": args['lblid'],
        "lbltxt": args['category']
    }

    metadata['imgareas'].append(imgarea)

num_records_inserted = 0
for k,v in metadata_aggregate.items():

    query = "INSERT INTO annotations(filename, imheight, imwidth, isreviewed, imgareas) values('{}',{},{},1,'{}')".format(
        k,
        v["height"],
        v["width"],
        json.dumps(v['imgareas'])
    )

    try:
        #copy file
        dst_file_path = os.path.join(DEST_PATH_IMAGES, k)

        if False == os.path.exists(dst_file_path):
            src_file_path = os.path.join(args['srcpath'], k)
            shutil.copyfile(src_file_path, dst_file_path)

        #insert to db
        db_cursor.execute(query)
        num_records_inserted += db_cursor.rowcount
    except:
        print(query)

db_conn.commit()
db_cursor.close()
db_conn.close()

print("Finished. Inserted [{}] records.".format(num_records_inserted))
