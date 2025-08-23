# Image Annotation Tool - Next.js Implementation

This is a Next.js implementation of the image annotation tool that was originally built with Flask backend and AngularJS frontend.

## Project Structure

- `/pages` - Next.js pages including API routes
- `/pages/api` - API endpoints that replicate the Flask backend functionality
- `/components` - React components
- `/utils` - Utility functions for database, encryption, and configuration
- `/conf` - Configuration files
- `/sample-db` - Sample SQLite database
- `/sample-images` - Sample image directories
- `/scripts` - Initialization scripts

## API Endpoints

The following API endpoints have been implemented to replicate the Flask backend:

- `POST /api/authenticate` - User authentication
- `POST /api/change-password` - Password management
- `POST /api/update-annotation` - Update image annotations
- `POST /api/set-label-to` - Set labels for images
- `GET /api/get-labels` - Get available labels
- `GET /api/get-next-image` - Get next image
- `GET /api/get-prev-image` - Get previous image
- `GET /api/delete-current-image` - Delete current image

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize the sample database:
   ```bash
   node scripts/init-db.js
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

The application can be configured using the `conf/imanno.yaml` file or environment variables:

- `AUTH_PATH` - Path to authentication credentials file
- `AUTH_KEY` - Encryption key for authentication
- `DB_PATHS` - Comma-separated list of database paths
- `REF_IMGS_PATH` - Path to reference images directory
- `RAW_IMGS_PATH` - Path to raw images directory
- `CREATE_IF_ABSENT` - Whether to create records if absent (true/false)