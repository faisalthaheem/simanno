import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Extract filename from the URL
    const filename = req.query.filename;
    
    console.log('Image request received:', { filename, query: req.query });
    
    if (!filename) {
      console.log('Filename is required');
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    // Use a fixed path for testing
    const imagePath = path.join(process.cwd(), 'sample-images/raw', filename);
    
    console.log('Image path constructed:', imagePath);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log('Image not found:', imagePath);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    console.log('Image found:', imagePath);
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    }[ext] || 'image/jpeg';
    
    console.log('Content type:', contentType);
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Stream the file
    const stream = fs.createReadStream(imagePath);
    stream.pipe(res);
    
    stream.on('error', (error) => {
      console.error('Error streaming image:', error);
      res.status(500).json({ error: 'Error serving image' });
    });
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Error serving image', message: error.message });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
}