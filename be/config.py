import os
import yaml
import logging
from pprint import pformat

# Create logger
logger = logging.getLogger('imanno')
logger.setLevel(logging.DEBUG)

# Get log file path from environment variable or use default
log_file_path = os.environ.get('LOG_FILE_PATH', 'imanno.log')

# Global variables
config = {}
labelslist = {}
defaultlabel = 1

# Configuration loading
def loadConfig(configfilename='imanno.yaml'):
    global config
    global labelslist
    global defaultlabel

    try:
        with open(configfilename) as stream:
            config = yaml.safe_load(stream)

            # Extract labels into their own dictionary
            labelslist = config['labels']['list']
            defaultlabel = config['labels']['default']
    except (FileNotFoundError, yaml.YAMLError) as e:
        logger.error(f"Config load failed: {str(e)}")
        # Initialize with default values to prevent errors
        labelslist = {}
        defaultlabel = 1
        # Ensure config has required structure
        config = {
            'anno': {
                'dbs': '',
                'refimgs': '',
                'rawimgs': '',
                'createIfAbsent': False
            },
            'labels': {
                'list': {},
                'default': 1
            }
        }

def checkEnvironmentVariables():
    global config
    try:
        pass
    except Exception as e:
        logger.error(f"Environment variable check failed: {str(e)}")

# Load app config
loadConfig()

# Override with env variables
checkEnvironmentVariables()

logger.info("Configuration is")
logger.info(pformat(config))
