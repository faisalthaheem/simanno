import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 10000,
});

// Add authentication headers to requests
apiClient.interceptors.request.use(
  (config) => {
    // In a real implementation, you would get these from a secure storage
    const username = process.env.NEXT_PUBLIC_API_USERNAME || 'admin';
    const password = process.env.NEXT_PUBLIC_API_PASSWORD || 'secret';
    
    config.headers['username'] = username;
    config.headers['password'] = password;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // Get next image
  getNextImage: (unreviewed = false, filter = '', filterval = '', currentIndex = -1) => {
    return apiClient.get('/get-next-image', {
      headers: {
        unreviewed: unreviewed,
        filter: filter,
        filterval: filterval,
        currentindex: currentIndex
      }
    });
  },
  
  // Get previous image
  getPrevImage: (currentIndex = -1) => {
    return apiClient.get('/get-prev-image', {
      headers: {
        currentindex: currentIndex
      }
    });
  },
  
  // Delete current image
  deleteCurrentImage: () => {
    return apiClient.get('/delete-current-image');
  },
  
  // Update annotation
  updateAnnotation: (dbName, imgname, coords) => {
    // Validate parameters before sending
    if (!dbName || !imgname) {
      return Promise.reject(new Error('Database name and image name are required'));
    }
    
    return apiClient.post('/update-annotation', {
      db: dbName,
      imgname: imgname,
      imgcoords: JSON.stringify(coords)
    });
  },
  
  // Set label
  setLabel: (dbName, imgname, labelid) => {
    return apiClient.post('/set-label-to', {
      db: dbName,
      imgname: imgname,
      labelid: labelid
    });
  },
  
  // Get labels
  getLabels: () => {
    return apiClient.get('/get-labels');
  },
  
  // Get ROI wall data
  getRoiWallData: (pageInfo) => {
    return apiClient.get('/get-roi-wall-data', {
      headers: {
        pageInfo: JSON.stringify(pageInfo),
        scriptip: apiClient.defaults.baseURL
      }
    });
  }
};

export default api;