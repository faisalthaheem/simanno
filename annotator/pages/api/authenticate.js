import fs from 'fs';
import { loadConfig } from '../../utils/config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ response: 'method not supported' });
  }

  try {
    const { username, password } = req.body;
    
    // Load authentication configuration
    const config = loadConfig();
    const authPath = config.auth.path;
    
    // Load content (assuming plain text for now)
    const content = fs.readFileSync(authPath, 'utf8');
    
    if (content) {
      const dic = JSON.parse(content);
      
      if (dic.username === username && dic.password === password) {
        return res.status(200).json({ response: 'valid' });
      } else {
        return res.status(401).json({ response: 'invalid' });
      }
    } else {
      return res.status(500).json({ response: 'error' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ response: 'error' });
  }
}