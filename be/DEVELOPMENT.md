# Development Documentation

## Project Structure

The project has been refactored into the following modules:

1. `config.py` - Configuration loading and environment variable processing
2. `database.py` - Database connection and management
3. `image_utils.py` - Image processing utilities
4. `api_routes.py` - API endpoint definitions and route handlers
5. `main.py` - Main application file that ties everything together

## Module Details

### config.py
- Handles loading of configuration from `imanno.yaml`
- Processes environment variables
- Sets up logging configuration
- Contains global configuration variables

### database.py
- Manages database connections using context managers
- Contains database cursor operations
- Implements database-related functions:
  - `lookupFile()` - Look up file information in database
  - `insertFile()` - Insert new file record into database
  - `updateFile()` - Update file annotation in database
  - `updateLabel()` - Update file label in database
  - `loadRefImages()` - Load reference images
  - `loadsqlitedbs()` - Load SQLite databases
  - `closedbs()` - Close database connections

### image_utils.py
- Contains image processing functions:
  - `getB64Image()` - Convert image to base64 string
  - `getImgSize()` - Get image dimensions
  - `getCroppedImage()` - Get cropped image as bytes

### api_routes.py
- Contains all API endpoint definitions:
  - `read_root()` - Root endpoint
  - `update_annotation()` - Update image annotation
  - `set_label_to()` - Set label for image
  - `get_roi_for_wall()` - Get cropped image region
  - `get_roi_wall_data()` - Get ROI wall data
  - `delete_image()` - Delete image
  - `delete_current_image()` - Delete current image
  - `get_next_image()` - Get next image
  - `get_prev_image()` - Get previous image
  - `get_labels()` - Get available labels

### main.py
- Creates the FastAPI application instance
- Adds CORS middleware
- Registers all API routes
- Handles application startup and shutdown events
- Manages the overall application lifecycle

## Application Flow

1. On startup:
   - Configuration is loaded
   - Database connections are established
   - Reference images are loaded
   - Application starts listening on port 8000

2. On shutdown:
   - All database connections are closed

3. API Endpoints:
   - `/` - Returns a simple message
   - `/update-annotation` - Updates image annotation
   - `/set-label-to` - Sets label for image
   - `/get-roi-for-wall` - Gets cropped image region
   - `/get-roi-wall-data` - Gets ROI wall data
   - `/delete-image` - Deletes an image
   - `/delete-current-image` - Deletes current image
   - `/get-next-image` - Gets next image
   - `/get-prev-image` - Gets previous image
   - `/get-labels` - Gets available labels

## Dependencies

The application requires the following Python packages (as specified in requirements.txt):
- fastapi
- uvicorn
- pyyaml
- pillow
- sqlite3 (built-in)

## Running the Application

To run the application in development mode:
```bash
./run-dev.sh
```

Or directly with uvicorn:
```bash
uvicorn main:app --reload
```

## Testing

The application can be tested by making HTTP requests to the various endpoints. The API follows REST conventions and returns appropriate HTTP status codes and JSON responses.
