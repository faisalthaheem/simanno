import argparse
import sys
import os
import sqlite3
import time
import traceback
import logging
import yaml
import json
import shutil


ap = argparse.ArgumentParser()
ap.add_argument("-c", "--configfile", required=True,
    help="Path to the merge config file.")

args = vars(ap.parse_args())

#create logger
logger = logging.getLogger('mergedbs')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
fh = logging.FileHandler('mergedbs.log')
fh.setLevel(logging.DEBUG)
# create console handler with a higher log level
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
# create formatter and add it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)
# add the handlers to the logger
logger.addHandler(fh)
logger.addHandler(ch)

db_dest = {}
db_src = {}

dest_label_map = {}

config = None
with open(args['configfile'],"r") as f:
    config = yaml.safe_load(f)

dest_label_map = config['dest']['label_mapping']

def initDb(conn):
    init_script = ""
    with open("./db_init_script_sql", "r") as init_script_sql:
        init_script = init_script_sql.read()

    conn.executescript(init_script)

def removeDbIfExists(path):
    if os.path.exists(path):
        os.remove(path)

def loadsqlitedbs():
    
    logger.info("Opening sqlite dbs")

    logger.info("Opening database [{}]".format(config['dest']['train_db']))
    removeDbIfExists(config['dest']['train_db'])
    db_dest['train_db_conn'] = sqlite3.connect(config['dest']['train_db'])
    db_dest['train_db_cur'] = db_dest['train_db_conn'].cursor()
    initDb(db_dest['train_db_conn'])

    logger.info("Opening database [{}]".format(config['dest']['val_db']))
    removeDbIfExists(config['dest']['val_db'])
    db_dest['val_db_conn'] = sqlite3.connect(config['dest']['val_db'])
    db_dest['val_db_cur'] = db_dest['val_db_conn'].cursor()
    initDb(db_dest['val_db_conn'])
    
    for src in config['src']:

        src_name = list(src.keys())[0]
        train_db = src[src_name]['train_db']
        val_db = src[src_name]['val_db']
        train_path = src[src_name]['train_path']
        val_path = src[src_name]['val_path']

        logger.info("Opening database [{}]".format(src_name))

        #ensure paths exist
        if False == os.path.exists(train_db):
            print("[{}] does not exist.".format(train_db))
            sys.exit(0)
        
        if False == os.path.exists(val_db):
            print("[{}] does not exist.".format(val_db))
            sys.exit(0)
        
        if False == os.path.exists(train_path):
            print("[{}] does not exist.".format(train_path))
            sys.exit(0)

        if False == os.path.exists(val_path):
            print("[{}] does not exist.".format(val_path))
            sys.exit(0)


        if not src_name in db_src:
            db_src[src_name] = {
                'train_path': train_path,
                'val_path': val_path
            }

        db_src[src_name]['train_db_conn'] = sqlite3.connect(train_db)
        db_src[src_name]['train_db_cur'] = db_src[src_name]['train_db_conn'].cursor()

        db_src[src_name]['val_db_conn'] = sqlite3.connect(val_db)
        db_src[src_name]['val_db_cur'] = db_src[src_name]['val_db_conn'].cursor()
        
    logger.info("dbs opened")

def closedbs():

    logger.info("Closing dbs")

    if db_dest['train_db_cur'] is not None:
        db_dest['train_db_cur'].close()
    if db_dest['train_db_conn'] is not None:
        db_dest['train_db_conn'].close()

    if db_dest['val_db_cur'] is not None:
        db_dest['val_db_cur'].close()
    if db_dest['val_db_conn'] is not None:
        db_dest['val_db_conn'].close()


    for k,v in db_src.items():
        v['train_db_cur'].close()
        v['train_db_conn'].close()

        v['val_db_cur'].close()
        v['val_db_conn'].close()


    logger.info("DBs closed")

def updateLabelMapping(src_name, rows):
    
    out_rows = []
    for row in rows:
        
        r = list(row)
        image_areas = json.loads(r[8])
        for ia in image_areas:
            ia['lblid'] = dest_label_map[src_name][int(ia['lblid'])]
        r[8] = json.dumps(image_areas)

        out_rows.append(tuple(r))
    
    return out_rows

def process(dest_cur, src_cur, src_name):
    
    selQuery = "SELECT filename,imheight,imwidth,isreviewed,lastreviewedat,isdeleted,needscropping,isbackground,imgareas FROM annotations"
    insQuery = "INSERT INTO annotations(filename,imheight,imwidth,isreviewed,lastreviewedat,isdeleted,needscropping,isbackground,imgareas) VALUES(?,?,?,?,?,?,?,?,?)"

    try:
        src_cur.execute(selQuery)
        rows = src_cur.fetchall()

        rows = updateLabelMapping(src_name, rows)

        dest_cur.executemany(insQuery, rows)
                
    except:
        logger.error(traceback.format_exc())

time_start = time.time()

loadsqlitedbs()

for dbname, details in db_src.items():
    process(db_dest['train_db_cur'],details['train_db_cur'],dbname)
    db_dest['train_db_conn'].commit()

    process(db_dest['val_db_cur'],details['val_db_cur'],dbname)
    db_dest['val_db_conn'].commit()
    
    #copy files
    shutil.copytree(details['train_path'],config['dest']['train_path'],dirs_exist_ok=True)
    shutil.copytree(details['val_path'],config['dest']['val_path'],dirs_exist_ok=True)

closedbs()

time_end = time.time()

logger.info("Took [{}] s to process request".format(time_end-time_start))