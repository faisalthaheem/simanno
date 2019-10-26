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
currIndex = -1

#dictionary of key value pairs for lables
labelslist = {}
defaultlabel = 1

#for db access
lock = threading.Lock()

#when createIfAbsent is true, this variable is set in updateannotation to make it
#convenient for the possibly following images to have the same annotated area in lookupimage
lastAnnotationCoords = None

def loadConfig(configfilename='./imanno.yaml'):

    global config
    global labelslist
    global defaultlabel

    try:
        with open(configfilename) as stream:
            config = yaml.load(stream)

            #extract labels into their own dictionary
            labelslist = config['labels']['list']
            defaultlabel = config['labels']['default']
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

    global lastAnnotationCoords
    response = {
        'response': 'unauthorized'
    }
    try:

        #if authenticateFromHeaders():
            db = request.form['db']
            fyl = request.form['imgname']
            #coords = json.loads(request.form['imgcoords'])
            coords = request.form['imgcoords']
            lastAnnotationCoords = coords

            print(db,fyl,coords)

            rowsAffected = updateFile(db, fyl, coords)
            if rowsAffected > 0:
                response['response'] = 'valid'
            else:
                response['response'] = 'no-match'
    
    except:
        logger.error(traceback.format_exc())

    return jsonify(response)

def getCroppedImage(fyl, y, x, h, w):
        
    filename = os.path.join(config['anno']['rawimgs'], fyl)
    logger.info(filename)
    im = Image.open(filename, mode='r')
    im = im.crop((x,y,x+w,y+h))

    bdata = io.BytesIO()
    im.save(bdata, 'JPEG')
    bdata.seek(0)

    return bdata
        

@app.route('/set-label-to', methods = ['POST','GET'])
def setLabelTo():

    response = {
        'response': 'unauthorized'
    }
    try:

        #if authenticateFromHeaders():
            db = request.form['db']
            fyl = request.form['imgname']
            selectedid = int(request.form['labelid'])

            if selectedid not in labelslist.keys():
                response['response'] = 'error'
                response['message'] = 'Selected label ['+ selectedid +'] not in yaml'
            else:

                rowsAffected = updateLabel(db, fyl, selectedid, labelslist[selectedid])
                if rowsAffected > 0:
                    response['response'] = 'ok'
                    response['message'] = "[{}]'s label set to [{}@{}]".format(fyl, selectedid, labelslist[selectedid])
                else:
                    response['response'] = 'error'
                    response['message'] = '0 rows affected'
    except:
        logger.error(traceback.format_exc())

    return jsonify(response)

@app.route('/get-roi-for-wall')
def getRoiForWall():
    
    # https://gist.github.com/sergeyk/4536515
    try:
        fyl = request.args.get('filename')
        y = int(request.args.get('y'))
        x = int(request.args.get('x'))
        h = int(request.args.get('h'))
        w = int(request.args.get('w'))

        strIO = getCroppedImage(fyl, y, x, h, w)

        return send_file(strIO, mimetype='image/jpg')

    except:
        logger.error(traceback.format_exc())


def getRoiInformation(fileNames):


    ret = []
    fileNames = ["'" + fileName + "'" for fileName in fileNames]

    lock.acquire()

    for db in sqlitedbs:
        
        try:
            cursor = dbcursors[db]
            if cursor is not None:
                query = "SELECT filename, imgareas FROM annotations where filename in ({}) order by filename".format(','.join(fileNames))
                print(query)
                cursor.execute(query)
                rows = cursor.fetchall()
                
                for row in rows:
                    ret.append(
                        {
                            "filename" : row[0],
                            "areas": json.loads(row[1])
                        } 
                    )
        except:
            logger.error(traceback.format_exc())

    lock.release()

    return ret
    

@app.route('/get-roi-wall-data')
def getRoiWallData():

    response = {}
    try:
        scriptip = request.headers.get('scriptip')
        pageInfo = json.loads(request.headers.get('pageInfo'))
        
        sliceStart = (len(refFiles)//pageInfo['pageSize']) * pageInfo['pageIndex']
        sliceEnd = sliceStart + pageInfo['pageSize']

        sliceEnd = len(refFiles) if sliceEnd > len(refFiles) else sliceEnd

        ret = getRoiInformation(refFiles[sliceStart:sliceEnd])

        response = {
            "total" : len(refFiles),
            "data" : ret
        }
    except:
        logger.error(traceback.format_exc())
        

    return jsonify(response)

@app.route('/delete-image')
def deleteImage():
    response = {
        'response': 'unauthorized'
    }
    global refFiles

    try:
        if authenticateFromHeaders():
            fileToDelete = request.headers.get("imgname")
            logger.info("Deleting image by name: " + fileToDelete)

            fileIndex = refFiles.index(fileToDelete)
                        
            for db in sqlitedbs:
                try:
                    cursor = dbcursors[db]
                    if cursor is not None:
                        query = "UPDATE annotations set isdeleted = 1 WHERE filename = '{}'".format(fileToDelete)
                        
                        lock.acquire()
                        cursor.execute(query)
                        dbconns[db].commit()

                        #delete from disk
                        os.remove(os.path.join(config["anno"]["refimgs"], refFiles[fileIndex]))
                        del refFiles[fileIndex]

                        response = {
                            "status": "ok"
                        }
                except:
                    logger.error(traceback.format_exc())
                finally:
                    lock.release()

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
                        query = "UPDATE annotations set isdeleted = 1 WHERE filename = '{}'".format(fyl)
                        
                        lock.acquire()
                        cursor.execute(query)
                        dbconns[db].commit()
                except:
                    logger.error(traceback.format_exc())
                finally:
                    lock.release()
            
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
                
                
            elif fylFilter == "name":
                logger.info("Looking up by name")

                try:
                    currIndex = refFiles.index(filterval)
                except:
                    pass

            elif fylFilter == "seek":
                seekIndex = int(filterval)
                if seekIndex >=0 and seekIndex < len(refFiles):
                    currIndex = seekIndex

            fyl = refFiles[currIndex]
            imheight,imwidth,imgareas,dbName = lookupFile(fyl, unreviewed)

            if dbName is not None:
                
                response['imgname'] = fyl	
                response['img'] = getB64Image(fyl)
                response['annotation'] = imgareas
                response['db'] = dbName
                response['response'] = 'valid'
                response['progress'] = "{}/{}".format(currIndex, len(refFiles))
            
            elif config['anno']['createIfAbsent'] == True:
                response['response'] = 'create'

                response['imgname'] = fyl			
                response['img'] = getB64Image(fyl)
                response['annotation'] = []
                response['db'] = sqlitedbs[0]
                response['progress'] = "{}/{}".format(currIndex, len(refFiles))
            else:
                response['message'] = "[{}] not in db and createIfAbsent is False".format(fyl)

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
            
            if currIndex < 0:
                currIndex = len(refFiles) - 1

            fyl = refFiles[currIndex]
            imheight,imwidth,imgareas,dbName = lookupFile(fyl, False)

            if dbName is not None:
                response['response'] = 'valid'

                response['imgname'] = fyl			
                response['img'] = getB64Image(fyl)
                response['annotation'] = imgareas
                response['db'] = dbName
                response['progress'] = "{}/{}".format(currIndex, len(refFiles))
            
            #let the front end create a new image area
            elif config['anno']['createIfAbsent'] == True:
                response['response'] = 'create'

                response['imgname'] = fyl			
                response['img'] = getB64Image(fyl)
                response['annotation'] = []
                response['db'] = sqlitedbs[0]
                response['progress'] = "{}/{}".format(currIndex, len(refFiles))
            else:
                response['message'] = "[{}] not in db and createIfAbsent is False".format(fyl)

    except:
        logger.error(traceback.format_exc())

    return jsonify(response)

def getB64Image(fyl):
    with open(os.path.join(config['anno']['rawimgs'],fyl), "rb") as image_file:
        return 'data:image/jpg;base64,' + base64.b64encode(image_file.read()).decode('utf-8')


def lookupFile(filename, checkReviewed = True):


    imheight,imwidth,imgareas,dbName = None,None,None,None

    lock.acquire()

    for db in sqlitedbs:
        
        try:
            cursor = dbcursors[db]
            if cursor is not None:
                #look up plate information for the requested name
                if checkReviewed:
                    query = "SELECT imheight,imwidth,imgareas FROM annotations WHERE isdeleted = 0 AND filename = '{}' AND isreviewed = 0".format(filename)
                else:
                    query = "SELECT imheight,imwidth,imgareas FROM annotations WHERE isdeleted = 0 AND filename = '{}'".format(filename)
                logger.info(query)

                
                cursor.execute(query)
                row = cursor.fetchone()
                #logger.info('result')
                if row is not None:
                    imheight,imwidth,imgareas = int(row[0]),int(row[1]),row[2]
                    dbName = db
                    break

        except:
            logger.error(traceback.format_exc())

    lock.release()
            
    return imheight,imwidth,imgareas,dbName

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

def insertFile(fyl, coords, useLock = True):

    rowsAffected = 0
    try:
        cursor = dbcursors[list(dbcursors.keys())[0]] #dirty but works
        if cursor is not None:
            
            imwidth, imheight = getImgSize(fyl)

            #insert new information
            query = "INSERT INTO annotations(filename, imheight, imwidth, isreviewed, imgareas) values('{}',{},{},1,'{}')".format(
                fyl,
                imheight,
                imwidth,
                coords
            )
            print(query)

            if useLock is True:
                lock.acquire()
            
            cursor.execute(query)
            rowsAffected = cursor.rowcount
            
        else:
            logger.warn('Could not find a db to insert new record into')
        
    except:
        logger.error(traceback.format_exc())

    if useLock is True:
        lock.release()

    return rowsAffected

@app.route('/get-labels')
def getLabels():
    labelsToReturn = {}
    labelsToReturn['available'] = labelslist
    labelsToReturn['default'] = {
        defaultlabel : labelslist[defaultlabel]
    }
    return jsonify(labelsToReturn)
    
def updateFile(db, fyl, coords):

    rowsAffected = 0
    try:
        cursor = dbcursors[db]
        if cursor is not None:

            #look up plate information for the requested name
            query = "UPDATE annotations set imgareas='{}', isreviewed = 1 where filename = '{}'".format(
                coords, fyl
            )
            print(query)

            lock.acquire()
            cursor.execute(query)

            rowsAffected = cursor.rowcount
            if rowsAffected == 0 and config['anno']['createIfAbsent'] == True:
                rowsAffected = insertFile(fyl, coords, False)
            
            if rowsAffected > 0:
                dbconns[db].commit()
    except:
        logger.error(traceback.format_exc())
    finally:
        lock.release()

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
        imheight,imwidth,imgareas,dbName = lookupFile(fyl, False)

        if dbName is None and config['anno']['createIfAbsent'] == False:
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
            conn = sqlite3.connect(db,1000,check_same_thread=False)
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

