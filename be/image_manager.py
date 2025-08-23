"""
Image manager class to encapsulate refFiles and currIndex global variables
"""

import os
from config import config, logger
from database import lookupFile

class ImageManager:
    """Class to manage reference files and current index for image annotation"""
    
    def __init__(self):
        self.refFiles = []
        self.currIndex = -1
    
    def load_ref_images(self):
        """Load reference images into refFiles list"""
        self.refFiles = os.listdir(config['anno']['refimgs'])
        self.refFiles.sort()
        logger.info("Loaded [{}] ref images. Pre processing".format(len(self.refFiles)))
        
        # Loop through and list out any image that does not have associate info in db
        i = 0
        while i < len(self.refFiles):
            fyl = self.refFiles[i]
            imheight, imwidth, imgareas, dbName = lookupFile(fyl, False)

            if dbName is None and config['anno']['createIfAbsent'] is False:
                logger.warn('[{}] does not have any info in db and createIfAbsent is False, will be deleting'.format(fyl))
                os.remove(os.path.join(config["anno"]["refimgs"], self.refFiles[i]))
                del self.refFiles[i]
            else:
                i += 1
        
        logger.info("Done ref file pre check.")
        
        # Save to file for debugging
        with open('reffiles.txt','w') as f:
            f.write("\n".join(self.refFiles))
    
    def get_current_file(self):
        """Get the current file name based on currIndex"""
        if 0 <= self.currIndex < len(self.refFiles):
            return self.refFiles[self.currIndex]
        return None
    
    def get_file_index(self, filename):
        """Get the index of a specific file"""
        try:
            return self.refFiles.index(filename)
        except ValueError:
            return -1
    
    def set_current_index(self, index):
        """Set the current index"""
        self.currIndex = index
    
    def increment_index(self):
        """Increment the current index"""
        self.currIndex += 1
        if self.currIndex >= len(self.refFiles):
            self.currIndex = 0
    
    def decrement_index(self):
        """Decrement the current index"""
        self.currIndex -= 1
        if self.currIndex < 0:
            self.currIndex = len(self.refFiles) - 1
    
    def get_total_files(self):
        """Get the total number of reference files"""
        return len(self.refFiles)
    
    def is_valid_index(self, index):
        """Check if an index is valid"""
        return 0 <= index < len(self.refFiles)
    
    def delete_file(self, index):
        """Delete a file at the specified index"""
        if self.is_valid_index(index):
            del self.refFiles[index]
            return True
        return False
