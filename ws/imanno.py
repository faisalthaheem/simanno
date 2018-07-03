import os, sys
from flask import Flask,jsonify,request, send_file
from flask_cors import CORS
import json
from pprint import pprint, pformat
import psutil
import threading
import traceback
import logging
from logging.handlers import RotatingFileHandler
import time
import random
import paho.mqtt.client as mqtt
import ed
import yaml
import netifaces
import socket
import sqlite3
import base64
from flask_compress import Compress
from PIL import Image
from skimage.io import imsave
import io
from io import StringIO

#create logger
logger = logging.getLogger('imanno')
logger.setLevel(logging.DEBUG)
# create file handler which logs even debug messages
#fh = logging.FileHandler('lm.tcp.log')
#https://stackoverflow.com/questions/24505145/how-to-limit-log-file-size-in-python
fh = RotatingFileHandler('imanno.log', mode='a', maxBytes=5*1024*1024, 
                                 backupCount=1, encoding=None, delay=0)
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

config = {}
sqlitedbs = []
dbconns = {}
dbcursors = {}
refFiles =[]
currIndex = 0

def loadConfig(configfilename='./imanno.yaml'):

    global config

    try:
        with open(configfilename) as stream:
            config = yaml.load(stream)
    except:
        logger.error(traceback.format_exc())

def checkEnvironmentVariables():

    global config

    try:
        pass
        
    except:
        logger.error(traceback.format_exc())

# load app config
loadConfig()

# override with env variables
checkEnvironmentVariables()

logger.info("Configuration is")
logger.info(pformat(config))


app = Flask(__name__)
CORS(app)
Compress(app)

@app.route('/')
#@requires_auth
def index():
    return "imanno"

def auth(username: str, password: str):

    valid = False

    try:
        #load content
        content = ed.decryptReadFile(config['auth']['path'],config['auth']['key'])

        if content is not None:
            dic = json.loads(content.decode("utf-8"))
            
            if dic['username'] == username and dic['password'] == password:
                valid = True
            else:
                valid = False

    except:
        logger.error(traceback.format_exc())
    
    return valid

def changepassword(username: str, password: str):

    valid = False

    try:
        #load content
        content = ed.decryptReadFile(config['auth']['path'],config['auth']['key'])

        if content is not None:
            dic = json.loads(content.decode("utf-8"))
            dic['password'] = password

            content = bytes(json.dumps(dic),"utf-8")
            if ed.encryptWriteFile(content, config['auth']['path'], config['auth']['key']):
                valid = True

    except:
        logger.error(traceback.format_exc())
    
    return valid

@app.route('/authenticate', methods = ['POST','GET'])
def authenticate():

    response = {
        'response': 'method not supported'
    }

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if auth(username, password):
            response['response'] = 'valid'
        else:
            response['response'] = 'invalid'
    
    return jsonify(response)

def authenticateFromHeaders():

    try:
        username = request.headers.get('username')
        password = request.headers.get('password')
        
        return auth(username, password)

    except:
        logger.error(traceback.format_exc())

    return False

@app.route('/change-password', methods = ['POST','GET'])
def changePassword():

    response = {
        'response': 'invalid'
    }
    try:
        
        if request.method == 'POST' and authenticateFromHeaders():
            username = 'admin'
            newpassword = request.form['newpassword']

            if changepassword(username, newpassword):
                response['response'] = 'changed'

    except:
        logger.error(traceback.format_exc())

    return jsonify(response)


@app.route('/update-annotation', methods = ['POST','GET'])
def updateAnnotation():

    response = {
        'response': 'unauthorized'
    }
    try:

        #if authenticateFromHeaders():
            db = request.form['db']
            fyl = request.form['imgname']
            coords = json.loads(request.form['imgcoords'])

            print(fyl,coords)

            rowsAffected = updateFile(db, fyl, coords)
            if rowsAffected > 0:
                response['response'] = 'valid'
            else:
                response['response'] = 'no-match'
    
    except:
        logger.error(traceback.format_exc())

    return jsonify(response)

def getCroppedImage(fyl):
    
    y1,x1,y2,x2,width,height,imheight,imwidth,dbName = lookupFile(fyl, False)
    
    if y1 is not None:
        filename = os.path.join(config['anno']['rawimgs'], fyl)
        logger.info(filename)
        im = Image.open(filename, mode='r')
        im = im.crop((x1,y1,x2,y2))

        bdata = io.BytesIO()
        im.save(bdata, 'JPEG')
        bdata.seek(0)

        return bdata
        

        # strIO = StringIO()
        # imsave(strIO, im.tobytes('raw'))
        # strIO.seek(0)

        #return io.BytesIO(im.tobytes())
    
    return None


@app.route('/get-roi-for-wall')
def getRoiForWall():
    
    # https://gist.github.com/sergeyk/4536515
    try:
        fyl = request.args.get('fyl')
        strIO = getCroppedImage(fyl)

        return send_file(strIO, mimetype='image/jpg')

    except:
        logger.error(traceback.format_exc())


@app.route('/get-roi-wall-data')
def getRoiWallData():

    response = {}
    try:
        scriptip = request.headers.get('scriptip')

        imgsPerRow = 4
        totalRows = len(refFiles) // imgsPerRow
        filesProcessed = 0
        rows = []

        for i in range(totalRows):
            
            baseIndex = i * imgsPerRow
            nuRow = {}
            currIndex = 0
            while currIndex < imgsPerRow and filesProcessed < len(refFiles):
                
                fyl = refFiles[baseIndex + currIndex]
                nuRow['col{}'.format(currIndex)] = "<img src='{}/get-roi-for-wall?rnd={}&fyl={}' />".format(scriptip,random.random(),fyl)

                currIndex += 1
                filesProcessed += 1
                
            rows.append(nuRow)
        
        response['rows'] = rows
    except:
        logger.error(traceback.format_exc())

    return jsonify(response)


@app.route('/delete-current-image')
def deleteCurrentImage():
    response = {
        'response': 'unauthorized'
    }
    global refFiles, currIndex

    try:
        if authenticateFromHeaders():
            fyl = refFiles[currIndex]
                        
            for db in sqlitedbs:
                try:
                    cursor = dbcursors[db]
                    if cursor is not None:
                        query = "UPDATE plates set isdeleted = 1 WHERE filename = '{}'".format(fyl)
                        
                        cursor.execute(query)
                        dbconns[db].commit()
                except:
                    logger.error(traceback.format_exc())
            
            #delete from disk
            os.remove(os.path.join(config["anno"]["refimgs"], refFiles[currIndex]))
            del refFiles[currIndex]

            return getNextImage(True)

    except:
        logger.error(traceback.format_exc())

    return jsonify(response)

@app.route('/get-next-image')
def getNextImage(retainIndex = False):
    response = {
        'response': 'unauthorized'
    }
    global refFiles, currIndex

    try:
        if authenticateFromHeaders():
            fyl = None
            unreviewed = True if request.headers.get('unreviewed') == 'true' else False

            fylFilter = request.headers.get('filter') if request.headers.get('filter') != None else None
            filterval = request.headers.get('filterval') if request.headers.get('filterval') != None else None

            logger.info("Filter [{}] filter val [{}]".format(fylFilter, filterval))
           
            if fylFilter is None or len(fylFilter) == 0:

                if not retainIndex:
                    currIndex += 1

                if currIndex >= len(refFiles):
                        currIndex = 0
                
                finderIndex = currIndex
                while finderIndex < len(refFiles):
                    fyl = refFiles[finderIndex]
                    
                    y1,x1,y2,x2,width,height,imheight,imwidth,dbName = lookupFile(fyl, unreviewed)
                    print(y1,x1,y2,x2,width,height,imheight,imwidth,dbName)
                    if y1 is None:
                        fyl = None
                        finderIndex += 1
                        continue
                    else:
                        currIndex = finderIndex
                        break

            elif fylFilter == "name":
                logger.info("Looking up by name")

                try:
                    indx = refFiles.index(filterval)
                    fyl = filterval
                    y1,x1,y2,x2,width,height,imheight,imwidth,dbName = lookupFile(fyl, False)
                    if y1 is None:
                        fyl = None
                    else:
                        currIndex = indx

                except:
                    pass

            elif fylFilter == "seek":
                try:
                    fyl = refFiles[int(filterval)]
                    logger.info("Seeking to index [{}]=[{}]".format(filterval, fyl))
                    y1,x1,y2,x2,width,height,imheight,imwidth,dbName = lookupFile(fyl, False)
                    if y1 is None:
                        fyl = None
                    else:
                        currIndex = int(filterval)
                except:
                    logger.error(traceback.format_exc())


            if fyl is not None:
                
                annotation = {
                    'x': x1,
                    'y': y1,
                    'width': width,
                    'height': height,
                    'id': 1,
                    'z': 100
                }

                response['imgname'] = fyl			
                response['img'] = getB64Image(fyl)
                response['annotation'] = json.dumps(annotation)
                response['db'] = dbName
                response['response'] = 'valid'
                response['progress'] = "{}/{}".format(currIndex, len(refFiles))
            
            else:
                response['message'] = 'No image'

    except:
        logger.error(traceback.format_exc())

    return jsonify(response)

@app.route('/get-prev-image')
def getPrevImage():
    response = {
        'response': 'unauthorized'
    }
    global refFiles, currIndex

    try:
        if authenticateFromHeaders():
            fyl = None

            currIndex -= 1
            
            if currIndex <= 0:
                currIndex = len(refFiles) - 1

            while currIndex > 0:

                fyl = refFiles[currIndex]

                y1,x1,y2,x2,width,height,imheight,imwidth,dbName = lookupFile(fyl, False)
                if y1 is None:
                    fyl = None

                    currIndex -= 1
                    if currIndex <= 0:
                        currIndex = len(refFiles) - 1
                    
                    continue

                break

            if fyl is not None:
                
                annotation = {
                    'x': x1,
                    'y': y1,
                    'width': width,
                    'height': height,
                    'id': 1,
                    'z': 100
                }

                response['imgname'] = fyl			
                response['img'] = getB64Image(fyl)
                response['annotation'] = json.dumps(annotation)
                response['db'] = dbName
                response['response'] = 'valid'
                response['progress'] = "{}/{}".format(currIndex, len(refFiles))
            
            else:
                response['message'] = 'No image'

    except:
        logger.error(traceback.format_exc())

    return jsonify(response)

def getB64Image(fyl):
    with open(os.path.join(config['anno']['rawimgs'],fyl), "rb") as image_file:
        return 'data:image/jpg;base64,' + base64.b64encode(image_file.read()).decode('utf-8')


def lookupFile(filename, checkReviewed = True):

    y1,x1,y2,x2,width,height,imheight,imwidth,dbName = None,None,None,None,None,None,None,None,None

    for db in sqlitedbs:
        try:
            cursor = dbcursors[db]
            if cursor is not None:
                #look up plate information for the requested name
                if checkReviewed:
                    query = "SELECT y1,x1,y2,x2,width,height,imheight,imwidth FROM plates WHERE isdeleted = 0 AND filename = '{}' AND isreviewed = 0".format(filename)
                else:
                    query = "SELECT y1,x1,y2,x2,width,height,imheight,imwidth FROM plates WHERE isdeleted = 0 AND filename = '{}'".format(filename)
                #logger.info(query)
                cursor.execute(query)
                row = cursor.fetchone()
                #logger.info('result')
                if row is not None:
                    y1,x1,y2,x2,width,height,imheight,imwidth = int(row[0]),int(row[1]),int(row[2]),int(row[3]),int(row[4]),int(row[5]),int(row[6]),int(row[7])
                    dbName = db
                    break

        except:
            logger.error(traceback.format_exc())
    
    #case when create if absent is true and no info is present in any dbs
    if y1 is None and config['anno']['createIfAbsent'] == True:
        y1 = 100
        x1 = 100
        y2 = 200
        x2 = 200
        width = 100
        height = 100
        imwidth, imheight = getImgSize(filename)
        dbName = sqlitedbs[0]

    return y1,x1,y2,x2,width,height,imheight,imwidth,dbName

def getImgSize(fyl):
    
    try:
        path = os.path.join(config['anno']['rawimgs'], fyl)
        im = Image.open(path)
        width, height = im.size
        im.close()

        return width,height

    except:
        logger.error(traceback.format_exc())

    return 0,0

def insertFile(fyl, coords):

    rowsAffected = 0
    try:
        cursor = dbcursors[list(dbcursors.keys())[0]] #dirty but works
        if cursor is not None:
            
            imwidth, imheight = getImgSize(fyl)

            #insert new information
            query = "INSERT INTO plates values('{}','boot',{},{},{},{},{},{},'',{},{},1,0,0,0)".format(
                fyl,
                coords['y'], 
                coords['x'], 
                coords['y'] + coords['height'], 
                coords['x'] + coords['width'], 
                coords['width'], 
                coords['height'], 
                imheight, 
                imwidth
            )
            cursor.execute(query)
            return cursor.rowcount
            
        else:
            logger.warn('Could not find a db to insert new record into')
        
    except:
        logger.error(traceback.format_exc())

    return rowsAffected


def updateFile(db, fyl, coords):

    rowsAffected = 0
    try:
        cursor = dbcursors[db]
        if cursor is not None:
            #look up plate information for the requested name
            query = "UPDATE plates set x1 = {}, y1 = {}, x2 = {}, y2 = {}, width = {}, height = {}, isreviewed = 1 where filename = '{}'".format(
                coords['x'], coords['y'], coords['x'] + coords['width'], coords['y'] + coords['height'], coords['width'], coords['height'], fyl
            )
            cursor.execute(query)
            rowsAffected = cursor.rowcount
            if rowsAffected == 0 and config['anno']['createIfAbsent'] == True:
                rowsAffected = insertFile(fyl, coords)
            
            if rowsAffected > 0:
                dbconns[db].commit()
    except:
        logger.error(traceback.format_exc())

    return rowsAffected

def loadRefImages():

    global refFiles
    refFiles = os.listdir(config['anno']['refimgs'])
    refFiles.sort()
    logger.info("Loaded [{}] ref images. Pre processing".format(len(refFiles)))
    
    # loop through and list out any image that does not have associate info in db
    i = 0
    while i < len(refFiles):
        
        fyl = refFiles[i]
        y1,x1,y2,x2,width,height,imheight,imwidth,dbName = lookupFile(fyl, False)

        if y1 is None and config['anno']['createIfAbsent'] == False:
            logger.warn('[{}] does not have any info in db and createIfAbsent is False, will be deleting'.format(fyl))
            os.remove(os.path.join(config["anno"]["refimgs"], refFiles[i]))
            del refFiles[i]
        else:
            i += 1
    
    logger.info("Done ref file pre check.")

    with open('reffiles.txt','w') as f:
        f.write("\n".join(refFiles))


def loadsqlitedbs():
    
    logger.info("Instantiating sqlite dbs")

    for db in sqlitedbs:
        logger.info("Opening database " + db)

        if os.path.exists(db):
            conn = sqlite3.connect(db)
            dbconns[db] = conn

            cursor = conn.cursor()
            dbcursors[db] = cursor

            logger.info("database [{}] opened".format(db))
        else:
            logger.warn("database [{}] does not exist, skipping".format(db))
            dbcursors[db] = None
            dbconns[db] = None

    logger.info("dbs opened")

def closedbs():

    logger.info("Closing dbs")

    for db in sqlitedbs:
        if dbcursors[db] is not None:
            dbcursors[db].close()

        if dbconns[db] is not None:
            dbconns[db].close()

    logger.info("DBs closed")

try:
    random.seed()

    sqlitedbs = config['anno']['dbs'].split(',')

    logger.info("Will be looking up following databases for info...")
    logger.info(str(sqlitedbs))

    logger.info("And, will be refering to files under...")
    logger.info(str(config['anno']['refimgs']))

    logger.info("in order to adjust originals under...")
    logger.info(str(config['anno']['rawimgs']))

    loadsqlitedbs()
    loadRefImages()

    logger.info("Starting rest service")
    app.run(debug=True, host='0.0.0.0', use_reloader=False)

    closedbs()

except:
    logger.error(traceback.format_exc())

