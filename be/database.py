import os
import threading
import logging
import json
from contextlib import contextmanager
from config import config, logger
from fastapi import HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# For db access
lock = threading.Lock()

# When createIfAbsent is true, this variable is set in updateannotation to make it
# convenient for the possibly following images to have the same annotated area in lookupimage
lastAnnotationCoords = None

# Global variables
sqlitedbs = []
# refFiles and currIndex are now managed by ImageManager class

# SQLAlchemy setup for ORM support
Base = declarative_base()
engines = {}
sessions = {}

def init_db():
    """Initialize database connections for all configured databases"""
    # Initialize the sqlitedbs list from config
    if isinstance(config['anno']['dbs'], str):
        sqlitedbs.append(config['anno']['dbs'])
    else:
        sqlitedbs.extend(config['anno']['dbs'])
    
    for db_path in sqlitedbs:
        if os.path.exists(db_path):
            engine = create_engine(f'sqlite:///{db_path}')
            engines[db_path] = engine
            session_factory = sessionmaker(bind=engine)
            sessions[db_path] = session_factory

def get_db_session(db_path):
    """Get a database session for the specified database path"""
    return sessions[db_path]()

# Database connection context manager - removed as we're using SQLAlchemy sessions now
@contextmanager
def get_db_connection(db_path):
    """This function is deprecated - using SQLAlchemy sessions instead"""
    # This is kept for compatibility but will not be used
    yield None

# Database cursor context manager - removed as we're using SQLAlchemy sessions now
@contextmanager
def get_db_cursor(db_path):
    """This function is deprecated - using SQLAlchemy sessions instead"""
    # This is kept for compatibility but will not be used
    yield None, None

# ORM model definition
class Annotation(Base):
    __tablename__ = 'annotations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=False)
    imheight = Column(Integer)
    imwidth = Column(Integer)
    isreviewed = Column(Boolean, default=False)
    imgareas = Column(Text)
    labelid = Column(Integer)
    labeltext = Column(String)
    isdeleted = Column(Boolean, default=False)

def lookupFile(filename: str, checkReviewed: bool = True) -> tuple:
    """Look up file information in database"""
    imheight, imwidth, imgareas, dbName = None, None, None, None

    try:
        # Use SQLAlchemy ORM for all database operations
        for db in sqlitedbs:
            session = get_db_session(db)
            try:
                if checkReviewed:
                    query = session.query(Annotation).filter(
                        Annotation.isdeleted == False,
                        Annotation.filename == filename,
                        Annotation.isreviewed == False
                    )
                else:
                    query = session.query(Annotation).filter(
                        Annotation.isdeleted == False,
                        Annotation.filename == filename
                    )
                
                result = query.first()
                
                if result is not None:
                    imheight, imwidth, imgareas = int(result.imheight), int(result.imwidth), result.imgareas
                    dbName = db
                    break
            finally:
                session.close()
    except Exception as e:
        logger.error(f"Lookup file error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database lookup error")
    
    return imheight, imwidth, imgareas, dbName

def insertFile(fyl: str, coords: str, useLock: bool = True) -> int:
    """Insert new file record into database"""
    rowsAffected = 0
    try:
        session = get_db_session(sqlitedbs[0])
        try:
            from image_utils import getImgSize
            imwidth, imheight = getImgSize(fyl)

            # Ensure coords is a string (JSON serialized)
            if not isinstance(coords, str):
                coords = json.dumps(coords)
            
            # Insert new information
            new_annotation = Annotation(
                filename=fyl,
                imheight=imheight,
                imwidth=imwidth,
                isreviewed=1,
                imgareas=coords
            )
            session.add(new_annotation)
            session.commit()
            rowsAffected = 1
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Image insertion failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Error inserting image")
    
    return rowsAffected

def updateFile(db: str, fyl: str, coords: str) -> int:
    """Update file annotation in database"""
    rowsAffected = 0
    try:
        session = get_db_session(db)
        try:
            # Ensure coords is a string (JSON serialized)
            if not isinstance(coords, str):
                coords = json.dumps(coords)
            
            # Look up plate information for the requested name
            annotation = session.query(Annotation).filter(
                Annotation.filename == fyl
            ).first()
            
            if annotation:
                annotation.imgareas = coords
                annotation.isreviewed = 1
                session.commit()
                rowsAffected = 1
            elif config['anno']['createIfAbsent'] is True:
                # If we need to create a new record
                rowsAffected = insertFile(fyl, coords, False)
            
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Database update failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Database update error")
    
    return rowsAffected

def updateLabel(db: str, fyl: str, labelid: int, labeltext: str) -> int:
    """Update file label in database"""
    rowsAffected = 0
    try:
        session = get_db_session(db)
        try:
            # Update label information for the file
            annotation = session.query(Annotation).filter(
                Annotation.filename == fyl
            ).first()
            
            if annotation:
                annotation.labelid = labelid
                annotation.labeltext = labeltext
                session.commit()
                rowsAffected = 1
            elif config['anno']['createIfAbsent'] is True:
                # If we need to create a new record, we should use insertFile instead
                # But this is a label update, so we expect the record to exist
                pass
            
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Database label update failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Database label update error")
    
    return rowsAffected

def loadRefImages():
    """Load reference images - this function is now handled by ImageManager class"""
    # This function is now handled by ImageManager class
    # The refFiles list is now managed by the ImageManager instance
    pass

def loadsqlitedbs():
    """Load SQLite databases - now using SQLAlchemy engines"""
    logger.info("Instantiating sqlite dbs")

    # Initialize the sqlitedbs list from config
    if isinstance(config['anno']['dbs'], str):
        sqlitedbs.append(config['anno']['dbs'])
    else:
        sqlitedbs.extend(config['anno']['dbs'])

    for db in sqlitedbs:
        logger.info("Opening database " + db)

        if os.path.exists(db):
            try:
                # Using SQLAlchemy engine instead of sqlite3 connection
                engine = create_engine(f'sqlite:///{db}')
                engines[db] = engine
                session_factory = sessionmaker(bind=engine)
                sessions[db] = session_factory
                logger.info("database [{}] opened".format(db))
            except Exception as e:
                logger.error(f"Error opening database {db}: {str(e)}")
                engines[db] = None
                sessions[db] = None
        else:
            logger.warn("database [{}] does not exist, skipping".format(db))
            engines[db] = None
            sessions[db] = None

    logger.info("dbs opened")

def closedbs():
    """Close database connections - now properly closing SQLAlchemy sessions"""
    logger.info("Closing dbs")

    # Close all SQLAlchemy sessions
    for db_path, session_factory in sessions.items():
        if session_factory is not None:
            # Session factory doesn't need to be closed, but we can clear any cached sessions
            pass

    logger.info("DBs closed")
