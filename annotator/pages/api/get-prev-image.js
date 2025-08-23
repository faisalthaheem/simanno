import refFileManager from '../../utils/ref-files';
import { loadConfig } from '../../utils/config';
import fs from 'fs';

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

    const currentIndex = parseInt(req.headers.currentindex) || -1;
    
    const result = await refFileManager.getPrevImage(currentIndex);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get previous image error:', error);
    return res.status(500).json({ response: 'error' });
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