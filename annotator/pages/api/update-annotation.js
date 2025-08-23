import dbManager from '../../utils/database';
import { loadConfig } from '../../utils/config';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ response: 'method not supported' });
  }

  try {
    // Check authentication
    const isAuthenticated = authenticateFromHeaders(req.headers);
    if (!isAuthenticated) {
      return res.status(401).json({ response: 'unauthorized' });
    }

    const { db, imgname, imgcoords } = req.body;
    
    console.log('Received request:', { db, imgname, imgcoords });

    // Debug: Check if database path exists
    const config = loadConfig();
    const dbPaths = config.anno.dbs.split(',');
    console.log('Available DB paths:', dbPaths);
    console.log('Current dbManager state:', Object.keys(dbManager.dbcursors));
    
    // Check if the specific db path exists in our database manager
    const dbExists = dbManager.dbcursors[db] !== undefined;
    console.log('DB exists in manager:', dbExists);
    
    if (!db) {
      console.error('Database parameter is missing');
      return res.status(400).json({ response: 'Database parameter is required' });
    }
    
    if (!imgname) {
      console.error('Image name parameter is missing');
      return res.status(400).json({ response: 'Image name parameter is required' });
    }
    
    if (!dbExists) {
      console.error('Database path not found in manager:', db);
      return res.status(500).json({ response: 'Database connection not available' });
    }

    const rowsAffected = await dbManager.updateFile(db, imgname, imgcoords);
    if (rowsAffected > 0) {
      return res.status(200).json({ response: 'valid' });
    } else {
      return res.status(200).json({ response: 'no-match' });
    }
  } catch (error) {
    console.error('Annotation update failed:', error);
    return res.status(500).json({ response: 'error', error: error.message });
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
