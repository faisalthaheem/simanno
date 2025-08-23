from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from config import config, logger, loadConfig
from database import sqlitedbs, loadsqlitedbs, loadRefImages, closedbs
from api_routes import read_root, update_annotation, set_label_to, get_roi_for_wall, get_roi_wall_data, delete_image, delete_current_image, get_next_image, get_prev_image, get_labels
from image_manager import ImageManager

# Create FastAPI app
app = FastAPI(title="Imanno Service", description="Annotation service for image processing")

# Create ImageManager instance
image_manager = ImageManager()

# Pass image_manager to api routes
from api_routes import (
    read_root, update_annotation, set_label_to, get_roi_for_wall, 
    get_roi_wall_data, delete_image, delete_current_image, get_next_image, 
    get_prev_image, get_labels
)
# Set the global image_manager in api_routes
import api_routes
api_routes.image_manager = image_manager

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes
app.add_api_route("/", read_root, methods=["GET"])
app.add_api_route("/update-annotation", update_annotation, methods=["POST"])
app.add_api_route("/set-label-to", set_label_to, methods=["POST"])
app.add_api_route("/get-roi-for-wall", get_roi_for_wall, methods=["GET"])
app.add_api_route("/get-roi-wall-data", get_roi_wall_data, methods=["GET"])
app.add_api_route("/delete-image", delete_image, methods=["GET"])
app.add_api_route("/delete-current-image", delete_current_image, methods=["GET"])
app.add_api_route("/get-next-image", get_next_image, methods=["GET"])
app.add_api_route("/get-prev-image", get_prev_image, methods=["GET"])
app.add_api_route("/get-labels", get_labels, methods=["GET"])

# Startup and shutdown
@app.on_event("startup")
async def startup_event():
    """Startup event"""
    try:
        global sqlitedbs
        
        sqlitedbs = config['anno']['dbs'].split(',')
        
        logger.info("Will be looking up following databases for info...")
        logger.info(str(sqlitedbs))
        
        logger.info("And, will be referring to files under...")
        logger.info(str(config['anno']['refimgs']))
        
        logger.info("in order to adjust originals under...")
        logger.info(str(config['anno']['rawimgs']))
        
        loadsqlitedbs()
        image_manager.load_ref_images()
        
        logger.info("Starting rest service")
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    closedbs()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
