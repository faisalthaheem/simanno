const fs = require('fs');
const path = require('path');
const dbManager = require('./database');
const { loadConfig } = require('./config');

class RefFileManager {
  constructor() {
    this.refFiles = [];
    // Remove the currIndex from instance state since it won't persist across requests
  }

  loadRefImages() {
    const config = loadConfig();
    
    // Load reference files
    this.refFiles = fs.readdirSync(config.anno.refimgs)
      .filter(file => {
        // Filter for image files
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext);
      })
      .sort();
      
    console.log(`Loaded [${this.refFiles.length}] ref images. Pre processing`);
    
    // Loop through and list out any image that does not have associated info in db
    let i = 0;
    while (i < this.refFiles.length) {
      const fyl = this.refFiles[i];
      const result = dbManager.lookupFile(fyl, false);
      
      if (!result.dbName && !config.anno.createIfAbsent) {
        console.warn(`[${fyl}] does not have any info in db and createIfAbsent is False, will be deleting`);
        fs.unlinkSync(path.join(config.anno.refimgs, this.refFiles[i]));
        this.refFiles.splice(i, 1);
      } else {
        i++;
      }
    }
    
    console.log("Done ref file pre check.");
    
    // Write to file
    fs.writeFileSync('reffiles.txt', this.refFiles.join('\n'));
  }

  getNextImage(currentIndex = -1, unreviewed = false, filter = '', filterval = '') {
    return new Promise(async (resolve, reject) => {
      try {
        let fyl = null;
        let newIndex = currentIndex;
        
        console.log(`getNextImage called with: currentIndex=${currentIndex}, unreviewed=${unreviewed}, filter=${filter}, filterval=${filterval}`);
        console.log(`refFiles length: ${this.refFiles.length}`);
        
        // Handle wrapping for normal navigation (not filter/seek)
        if (!filter || filter.length === 0) {
          // Special handling for initial state (-1)
          if (currentIndex === -1) {
            newIndex = 0;
          } else {
            newIndex += 1;
            
            if (newIndex >= this.refFiles.length) {
              newIndex = 0;
            }
          }
          console.log(`Moving to next image, new index: ${newIndex}`);
        } else if (filter === "name") {
          console.log("Looking up by name");
          
          const index = this.refFiles.indexOf(filterval);
          if (index !== -1) {
            newIndex = index;
            console.log(`Found image by name, new index: ${newIndex}`);
          } else {
            console.warn(`Image ${filterval} not found in refFiles`);
            newIndex = currentIndex >= 0 ? currentIndex : 0; // Keep current index if valid, otherwise 0
          }
        } else if (filter === "seek") {
          const seekIndex = parseInt(filterval);
          if (!isNaN(seekIndex) && seekIndex >= 0 && seekIndex < this.refFiles.length) {
            newIndex = seekIndex;
            console.log(`Seeking to index: ${newIndex}`);
          } else {
            // Invalid seek index, keep current index
            newIndex = currentIndex >= 0 ? currentIndex : 0;
          }
        }
        
        // Ensure we have a valid index (fallback for edge cases)
        if (newIndex < 0 || newIndex >= this.refFiles.length) {
          console.log(`Invalid index detected, resetting to 0. Current index: ${newIndex}`);
          newIndex = 0;
        }
        
        fyl = this.refFiles[newIndex];
        console.log(`Loading image: ${fyl} at index: ${newIndex}`);
        
        const result = await dbManager.lookupFile(fyl, unreviewed);
        console.log(`Database lookup result for ${fyl}:`, result);
        
        if (result.dbName) {
          const b64Image = this.getB64Image(fyl);
          const responseObj = {
            imgname: fyl,
            img: b64Image,
            annotation: result.imgareas,
            db: result.dbName,
            response: 'valid',
            progress: `${newIndex + 1}/${this.refFiles.length}`,
            currentIndex: newIndex
          };
          console.log(`Returning valid response:`, responseObj);
          resolve(responseObj);
        } else if (loadConfig().anno.createIfAbsent === true) {
          const b64Image = this.getB64Image(fyl);
          const responseObj = {
            response: 'create',
            imgname: fyl,
            img: b64Image,
            annotation: [],
            db: Object.keys(dbManager.dbconns)[0],
            progress: `${newIndex + 1}/${this.refFiles.length}`,
            currentIndex: newIndex
          };
          console.log(`Returning create response:`, responseObj);
          resolve(responseObj);
        } else {
          const responseObj = {
            response: 'error',
            message: `[${fyl}] not in db and createIfAbsent is False`,
            currentIndex: newIndex
          };
          console.log(`Returning error response:`, responseObj);
          resolve(responseObj);
        }
      } catch (error) {
        console.error('Error in getNextImage:', error);
        reject(error);
      }
    });
  }

  getPrevImage(currentIndex = -1) {
    return new Promise(async (resolve, reject) => {
      try {
        let fyl = null;
        let newIndex = currentIndex;
        
        console.log(`getPrevImage called, current index: ${currentIndex}`);
        
        // Special handling for initial state (-1)
        if (currentIndex === -1) {
          // For initial state, we should go to the last image
          newIndex = this.refFiles.length - 1;
        } else {
          newIndex -= 1;
          console.log(`Moved to previous image, new index: ${newIndex}`);
          
          if (newIndex < 0) {
            newIndex = this.refFiles.length - 1;
            console.log(`Wrapped to end, new index: ${newIndex}`);
          }
        }
        
        // Ensure we have a valid index (fallback for edge cases)
        if (newIndex < 0 || newIndex >= this.refFiles.length) {
          console.log(`Invalid index detected, resetting to last. Current index: ${newIndex}`);
          newIndex = this.refFiles.length - 1;
        }
        
        fyl = this.refFiles[newIndex];
        console.log(`Loading image: ${fyl} at index: ${newIndex}`);
        
        const result = await dbManager.lookupFile(fyl, false);
        console.log(`Database lookup result for ${fyl}:`, result);
        
        if (result.dbName) {
          const b64Image = this.getB64Image(fyl);
          const responseObj = {
            imgname: fyl,
            img: b64Image,
            annotation: result.imgareas,
            db: result.dbName,
            response: 'valid',
            progress: `${newIndex + 1}/${this.refFiles.length}`,
            currentIndex: newIndex
          };
          console.log(`Returning valid response:`, responseObj);
          resolve(responseObj);
        } else if (loadConfig().anno.createIfAbsent === true) {
          const b64Image = this.getB64Image(fyl);
          const responseObj = {
            response: 'create',
            imgname: fyl,
            img: b64Image,
            annotation: [],
            db: Object.keys(dbManager.dbconns)[0],
            progress: `${newIndex + 1}/${this.refFiles.length}`,
            currentIndex: newIndex
          };
          console.log(`Returning create response:`, responseObj);
          resolve(responseObj);
        } else {
          const responseObj = {
            response: 'error',
            message: `[${fyl}] not in db and createIfAbsent is False`,
            currentIndex: newIndex
          };
          console.log(`Returning error response:`, responseObj);
          resolve(responseObj);
        }
      } catch (error) {
        console.error('Error in getPrevImage:', error);
        reject(error);
      }
    });
  }

  getB64Image(filename) {
    const config = loadConfig();
    const imagePath = path.join(config.anno.rawimgs, filename);
    
    try {
      if (fs.existsSync(imagePath)) {
        // Return a URL to the image instead of base64 data
        return `/api/images/${filename}`;
      } else {
        // Return a placeholder image if the file doesn't exist
        return '/placeholder.svg';
      }
    } catch (error) {
      console.error('Error reading image:', error);
      // Return a placeholder image if there's an error
      return '/placeholder.svg';
    }
  }
}

const refFileManager = new RefFileManager();

// Load reference images when module is loaded
refFileManager.loadRefImages();

module.exports = refFileManager;
