#!/usr/bin/env python3

import sqlite3
import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Create the database schema that matches what the code expects
Base = declarative_base()

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

def create_database():
    # Create the database file
    db_path = 'db/sample.db'
    
    # Create the database with proper schema
    engine = create_engine(f'sqlite:///{db_path}')
    Base.metadata.create_all(engine)
    
    print(f"Created database with proper schema at {db_path}")

if __name__ == "__main__":
    create_database()
