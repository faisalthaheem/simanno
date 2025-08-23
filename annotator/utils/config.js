const fs = require('fs');
const yaml = require('js-yaml');

function loadConfig(configFilename = './conf/imanno.yaml') {
  try {
    // Check if config file exists
    if (fs.existsSync(configFilename)) {
      const fileContents = fs.readFileSync(configFilename, 'utf8');
      const config = yaml.load(fileContents);
      return config;
    } else {
      // Return default configuration
      return {
        auth: {
          path: process.env.AUTH_PATH || './conf/default.creds',
          key: process.env.AUTH_KEY || 'default-key'
        },
        anno: {
          dbs: process.env.DB_PATHS || './sample-db/annotations.db',
          refimgs: process.env.REF_IMGS_PATH || './sample-images/ref',
          rawimgs: process.env.RAW_IMGS_PATH || './sample-images/raw',
          createIfAbsent: process.env.CREATE_IF_ABSENT === 'true' || true
        },
        labels: {
          list: {
            1: 'Object',
            2: 'Background'
          },
          default: 1
        }
      };
    }
  } catch (error) {
    console.error(`Config load failed: ${error.message}`);
    // Return default configuration
    return {
      auth: {
        path: process.env.AUTH_PATH || './conf/default.creds',
        key: process.env.AUTH_KEY || 'default-key'
      },
      anno: {
        dbs: process.env.DB_PATHS || './sample-db/annotations.db',
        refimgs: process.env.REF_IMGS_PATH || './sample-images/ref',
        rawimgs: process.env.RAW_IMGS_PATH || './sample-images/raw',
        createIfAbsent: process.env.CREATE_IF_ABSENT === 'true' || true
      },
      labels: {
        list: {
          1: 'Object',
          2: 'Background'
        },
        default: 1
      }
    };
  }
}

module.exports = {
  loadConfig
};