import refFileManager from '../../utils/ref-files';
import dbManager from '../../utils/database';
import { loadConfig } from '../../utils/config';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ response: 'method not supported' });
  }

  try {
    // Check authentication
    const isAuthenticated = authenticateFromHeaders(req.headers);
    if (!isAuthenticated) {
      return res.status(401).json({ response: 'unauthorized' });
    }

    // Get current file
    const currentFile = refFileManager.refFiles[refFileManager.currIndex];
    
    if (refFileManager.currIndex < 0 || refFileManager.currIndex >= refFileManager.refFiles.length) {
      return res.status(400).json({
        response: 'error',
        message: 'Invalid index'
      });
    }

    // Delete from all databases
    const config = loadConfig();
    const sqlitedbs = config.anno.dbs.split(',');
    
    for (const dbPath of sqlitedbs) {
      try {
        const db = dbManager.dbcursors[dbPath];
        if (db) {
          const query = `UPDATE annotations set isdeleted = 1 WHERE filename = ?`;
          
          db.run(query, [currentFile], async function(err) {
            if (err) {
              console.error('Database deletion error:', err);
              return res.status(500).json({
                response: 'error',
                message: err.message
              });
            }
            
            // Delete from disk
            try {
              const refImagePath = path.join(config.anno.refimgs, currentFile);
              if (fs.existsSync(refImagePath)) {
                fs.unlinkSync(refImagePath);
              }
              
              // Remove from refFiles array
              refFileManager.refFiles.splice(refFileManager.currIndex, 1);
              
              // Get next image
              const nextResult = await refFileManager.getNextImage(true);
              return res.status(200).json(nextResult);
            } catch (fileError) {
              console.error('File deletion error:', fileError);
              return res.status(500).json({
                response: 'error',
                message: fileError.message
              });
            }
          });
          
          // If we successfully processed one database, we can break
          break;
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({
          response: 'error',
          message: dbError.message
        });
      }
    }
  } catch (error) {
    console.error('Delete current image error:', error);
    return res.status(500).json({
      response: 'error',
      message: error.message
    });
  }
}

function authenticateFromHeaders(headers) {
  try {
    const username = headers.username;
    const password = headers.password;
    
    if (!username || !password) {
      return false;
    }
    
    // Load authentication configuration
    const config = loadConfig();
    const authPath = config.auth.path;
    
    // Load content (assuming plain text for now)
    const content = fs.readFileSync(authPath, 'utf8');
    
    if (content) {
      const dic = JSON.parse(content);
      return dic.username === username && dic.password === password;
    }
  } catch (error) {
    console.error('Authentication error:', error);
  }
  
  return false;
}