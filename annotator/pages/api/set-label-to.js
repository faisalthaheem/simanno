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

    const { db, imgname, labelid } = req.body;
    
    // Get labels
    const labels = dbManager.getLabels();
    const selectedLabel = labels.available[labelid];
    
    if (!selectedLabel) {
      return res.status(400).json({
        response: 'error',
        message: `Selected label [${labelid}] not in config`
      });
    }

    const rowsAffected = await dbManager.updateLabel(db, imgname, labelid, selectedLabel);
    if (rowsAffected > 0) {
      return res.status(200).json({
        response: 'ok',
        message: `[${imgname}]'s label set to [${labelid}@${selectedLabel}]`
      });
    } else {
      return res.status(200).json({
        response: 'error',
        message: '0 rows affected'
      });
    }
  } catch (error) {
    console.error('Label set error:', error);
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