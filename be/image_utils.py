import os
import json
import base64
from PIL import Image
import io
import logging
import traceback
from config import config, logger

def getB64Image(fyl: str) -> str:
    """Convert image to base64 string"""
    try:
        with open(os.path.join(config['anno']['rawimgs'], fyl), "rb") as image_file:
            return 'data:image/jpg;base64,' + base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        logger.error(f"Error getting base64 image: {str(e)}")
        raise

def getImgSize(fyl: str) -> tuple:
    """Get image dimensions"""
    try:
        path = os.path.join(config['anno']['rawimgs'], fyl)
        im = Image.open(path)
        width, height = im.size
        im.close()
        return width, height
    except Exception as e:
        logger.error(f"Error getting image size for {fyl}: {str(e)}")
        raise

def getCroppedImage(fyl: str, y: int, x: int, h: int, w: int) -> io.BytesIO:
    """Get cropped image as bytes"""
    try:
        filename = os.path.join(config['anno']['rawimgs'], fyl)
        logger.info(f"getCroppedImage: filename={filename}, y={y}, x={x}, h={h}, w={w}")
        
        # Check if file exists
        if not os.path.exists(filename):
            logger.error(f"Image file does not exist: {filename}")
            return None
            
        im = Image.open(filename, mode='r')
        # Make sure the crop coordinates are within the image bounds
        img_width, img_height = im.size
        logger.info(f"Image size: width={img_width}, height={img_height}")
        
        # Adjust coordinates to be within image bounds
        x = max(0, min(x, img_width))
        y = max(0, min(y, img_height))
        w = max(1, min(w, img_width - x))
        h = max(1, min(h, img_height - y))
        
        logger.info(f"Adjusted crop coordinates: y={y}, x={x}, h={h}, w={w}")
        im = im.crop((x, y, x+w, y+h))

        bdata = io.BytesIO()
        im.save(bdata, 'JPEG')
        bdata.seek(0)
        return bdata
    except Exception as e:
        logger.error(f"Error in getCroppedImage: {str(e)}")
        logger.error(traceback.format_exc())
        return None
