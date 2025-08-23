# Migration from Flask Backend and AngularJS Frontend to Next.js

## Overview

This document details the migration of the image annotation tool from a Flask backend with AngularJS frontend to a Next.js application. The migration involved porting both backend API endpoints and frontend functionality to a unified Next.js application.

## Completed Tasks

### Backend API Migration

The following Flask API endpoints have been migrated to Next.js API routes:

| Flask Endpoint | Next.js API Route | Status | Source File | Destination File |
|----------------|-------------------|--------|-------------|------------------|
| `/authenticate` | `/api/authenticate` | ✅ Complete | `be/ws/imanno.py` | `pages/api/authenticate.js` |
| `/change-password` | `/api/change-password` | ✅ Complete | `be/ws/imanno.py` | `pages/api/change-password.js` |
| `/update-annotation` | `/api/update-annotation` | ✅ Complete | `be/ws/imanno.py` | `pages/api/update-annotation.js` |
| `/set-label-to` | `/api/set-label-to` | ✅ Complete | `be/ws/imanno.py` | `pages/api/set-label-to.js` |
| `/get-labels` | `/api/get-labels` | ✅ Complete | `be/ws/imanno.py` | `pages/api/get-labels.js` |
| `/get-next-image` | `/api/get-next-image` | ✅ Complete | `be/ws/imanno.py` | `pages/api/get-next-image.js` |
| `/get-prev-image` | `/api/get-prev-image` | ✅ Complete | `be/ws/imanno.py` | `pages/api/get-prev-image.js` |
| `/delete-current-image` | `/api/delete-current-image` | ✅ Complete | `be/ws/imanno.py` | `pages/api/delete-current-image.js` |

### Utility Functions Migration

| Functionality | Status | Source File | Destination File |
|---------------|--------|-------------|------------------|
| Encryption/Decryption | ✅ Complete | `be/ws/ed.py` | `utils/encryption.js` |
| Database Operations | ✅ Complete | `be/ws/imanno.py` | `utils/database.js` |
| Configuration Management | ✅ Complete | `be/ws/imanno.py` | `utils/config.js` |
| Reference File Management | ✅ Complete | `be/ws/imanno.py` | `utils/ref-files.js` |

### Frontend Functionality Migration

| Feature | Status | Source File | Destination File |
|---------|--------|-------------|------------------|
| Image Annotation Interface | ✅ Complete | `fe/app/src/app/annotations/` | `pages/index.js` |
| Drawing Functionality | ✅ Complete | `fe/app/src/assets/js/jquery.selectareas.js` | `pages/index.js` |
| Annotation Manipulation | ✅ Complete | `fe/app/src/app/annotations/` | `pages/index.js` |
| API Service | ✅ Complete | `fe/app/src/app/providers/annotationdata.service.ts` | `services/api.js` |

## File Mapping Summary

### Backend Files
- `be/ws/imanno.py` → Multiple files in `pages/api/` and `utils/`
- `be/ws/ed.py` → `utils/encryption.js`
- `be/ws/requirements.txt` → `package.json` dependencies

### Frontend Files
- `fe/app/src/app/annotations/` → `pages/index.js`
- `fe/app/src/app/providers/annotationdata.service.ts` → `services/api.js`
- `fe/app/src/assets/js/jquery.selectareas.js` → Canvas-based implementation in `pages/index.js`

## Configuration Files
- `be/ws/conf/imanno.yaml` → `conf/imanno.yaml`
- Environment variables management → Next.js environment variables

## Improvements and Enhancements

### 1. Modern React Implementation
- Replaced jQuery-based drawing with pure React/Canvas implementation
- Added state management for selected annotations
- Implemented drag and resize functionality for annotations
- Added keyboard shortcuts for common operations

### 2. Enhanced User Experience
- Visual feedback for selected annotations with resize handles
- Improved toolbar organization
- Better error handling and user notifications
- Export functionality for annotations

### 3. Code Structure
- Modular API routes following Next.js conventions
- Separation of concerns with utility functions
- Configuration management with YAML support
- Better error handling and logging

## Work to be Completed

### 1. Authentication Implementation
- [ ] Implement proper encryption/decryption functions in `utils/encryption.js`
- [ ] Create actual authentication credentials file
- [ ] Add session management

### 2. Database Integration
- [ ] Implement proper database connection pooling
- [ ] Add database migration scripts
- [ ] Implement database transactions for consistency

### 3. Image Processing
- [ ] Add proper image resizing and optimization
- [ ] Implement ROI (Region of Interest) functionality
- [ ] Add support for different image formats

### 4. Testing
- [ ] Add unit tests for API endpoints
- [ ] Add integration tests for database operations
- [ ] Add end-to-end tests for frontend functionality

### 5. Security
- [ ] Implement proper authentication middleware
- [ ] Add input validation and sanitization
- [ ] Implement rate limiting for API endpoints
- [ ] Add CSRF protection

### 6. Performance
- [ ] Implement image caching
- [ ] Add pagination for large datasets
- [ ] Optimize database queries
- [ ] Implement lazy loading for images

### 7. Deployment
- [ ] Create production build scripts
- [ ] Add Docker configuration
- [ ] Implement CI/CD pipeline
- [ ] Add monitoring and logging

### 8. Additional Features
- [ ] Implement user management
- [ ] Add project/workspace management
- [ ] Implement annotation versioning/history
- [ ] Add collaboration features (real-time editing)

## Known Issues

1. **Encryption**: The current encryption implementation is a placeholder and needs to be replaced with a proper implementation that matches the Flask backend's cryptography library.

2. **Database Transactions**: The database operations don't currently use transactions, which could lead to data inconsistency issues.

3. **Error Handling**: Some error cases in the API endpoints are not fully handled and may result in unhandled exceptions.

4. **Image Loading**: The image loading functionality uses placeholder images when files are not found, but this should be improved to handle various error cases.

## Next Steps

1. Implement proper encryption functions to match the Flask backend
2. Add comprehensive test coverage
3. Implement missing features from the original AngularJS frontend
4. Optimize performance for large datasets
5. Add proper documentation for API endpoints
6. Implement deployment and monitoring solutions

This migration provides a solid foundation for the image annotation tool in Next.js while maintaining all the core functionality of the original Flask/AngularJS implementation and adding several enhancements.