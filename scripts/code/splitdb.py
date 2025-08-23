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

# python3 splitdb.py -r val/ -o val.db  -i in.db

ap = argparse.ArgumentParser()
ap.add_argument("-r", "--ref", required=True,
    help="Path to the folder containing ref images.")
ap.add_argument("-o", "--out", required=True,
    help="Path to the destination db which will be created bearing contents related to ref folder images.")
ap.add_argument("-i", "--in", required=True,
    help="Path to the source db  containing information on ref images.")
args = vars(ap.parse_args())


out_db_conn = None
out_db_cur = None

in_db_conn = None
in_db_cur = None

def initDb(conn):
    init_script = ""
    with open("./db_init_script_sql", "r") as init_script_sql:
        init_script = init_script_sql.read()

    conn.executescript(init_script)

def removeDbIfExists(path):
    if os.path.exists(path):
        os.remove(path)

def loadsqlitedbs():

    global out_db_conn, out_db_cur, in_db_conn, in_db_cur
    
    print("Opening sqlite dbs")

    print("Opening database [{}]".format(args['out']))
    removeDbIfExists(args['out'])
    out_db_conn = sqlite3.connect(args['out'])
    out_db_cur = out_db_conn.cursor()
    initDb(out_db_conn)

    print("Opening database [{}]".format(args['in']))
    in_db_conn = sqlite3.connect(args['in'])
    in_db_cur = in_db_conn.cursor()
    
    print("dbs opened")

def closedbs():

    print("Closing dbs")

    if in_db_cur is not None:
        in_db_cur.close()
    if in_db_conn is not None:
        in_db_conn.close()

    if out_db_cur is not None:
        out_db_cur.close()
    if out_db_conn is not None:
        out_db_conn.close()

    print("DBs closed")

def process():

    #list all files in the ref folder
    ref_files = os.listdir(args['ref'])


    selQuery = "SELECT filename,imheight,imwidth,isreviewed,lastreviewedat,isdeleted,needscropping,isbackground,imgareas FROM annotations where filename in ({})".format(
        (', '.join('"' + item + '"' for item in ref_files))
    )

    insQuery = "INSERT INTO annotations(filename,imheight,imwidth,isreviewed,lastreviewedat,isdeleted,needscropping,isbackground,imgareas) VALUES(?,?,?,?,?,?,?,?,?)"

    #for all files query db
    try:
        in_db_cur.execute(selQuery)
        rows = in_db_cur.fetchall()

        out_db_cur.executemany(insQuery, rows)
                
    except:
        print(traceback.format_exc())

    out_db_conn.commit()    

time_start = time.time()

loadsqlitedbs()
process()
closedbs()

time_end = time.time()

print("Took [{}] s to process request".format(time_end-time_start))