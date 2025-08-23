from fastapi import FastAPI, HTTPException, Header, Body
from fastapi.responses import FileResponse
from typing import Dict, Any, Optional, List, Union
from config import config, labelslist, defaultlabel, logger
from database import sqlitedbs, get_db_cursor, loadRefImages, updateFile, updateLabel, lookupFile, get_db_session, Annotation
from image_utils import getB64Image, getCroppedImage
import json
import os
import traceback
from io import BytesIO
import tempfile
from image_manager import ImageManager

# API Routes
async def read_root() -> Dict[str, str]:
    """
    Get the root endpoint of the API.
    
    Returns:
        Dict[str, str]: A simple message indicating the API is running.
        
    Example:
        >>> await read_root()
        {"message": "imanno"}
    """
    return {"message": "imanno"}

# Global ImageManager instance - this will be set in main.py
image_manager = None

async def update_annotation(
    db: str = Body(...), 
    imgname: str = Body(...), 
    imgcoords: str = Body(...)
) -> Dict[str, str]:
    """
    Update annotation data for a specific image.
    
    This endpoint updates the annotation information for a given image in the specified database.
    
    Args:
        db (str): The database name to update the annotation in
        imgname (str): The filename of the image to update
        imgcoords (str): The annotation coordinates to update (JSON serialized)
        
    Returns:
        Dict[str, str]: A response dictionary with status information:
            - response (str): Status of the operation ('valid', 'no-match', 'created', or 'unauthorized')
            - message (str, optional): Error message if operation fails
            
    Example:
        >>> await update_annotation("sample.db", "image1.jpg", "[{\"x\": 10, \"y\": 20, \"w\": 100, \"h\": 150}]")
        {"response": "valid"}
        
    Raises:
        HTTPException: If database operations fail or invalid parameters are provided.
    """
    response: Dict[str, str] = {
        'response': 'unauthorized'
    }
    try:
        # Use SQLAlchemy session instead of deprecated updateFile function
        session = get_db_session(db)
        try:
            # Ensure coords is a string (JSON serialized)
            if not isinstance(imgcoords, str):
                imgcoords = json.dumps(imgcoords)
            
            # Look up plate information for the requested name
            annotation = session.query(Annotation).filter(
                Annotation.filename == imgname
            ).first()
            
            if annotation:
                annotation.imgareas = imgcoords
                annotation.isreviewed = 1
                session.commit()
                response['response'] = 'valid'
            else:
                # Create new annotation if not found
                from image_utils import getImgSize
                imwidth, imheight = getImgSize(imgname)
                
                new_annotation = Annotation(
                    filename=imgname,
                    imheight=imheight,
                    imwidth=imwidth,
                    isreviewed=1,
                    imgareas=imgcoords
                )
                session.add(new_annotation)
                session.commit()
                response['response'] = 'created'
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Annotation update failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Annotation update failed")
    
    return response

async def set_label_to(
    db: str = Body(...), 
    imgname: str = Body(...), 
    labelid: int = Body(...)
) -> Dict[str, str]:
    """
    Set a label for a specific image.
    
    This endpoint assigns a label ID to an image in the specified database.
    
    Args:
        db (str): The database name to update the label in
        imgname (str): The filename of the image to label
        labelid (int): The ID of the label to assign to the image
        
    Returns:
        Dict[str, str]: A response dictionary with status information:
            - response (str): Status of the operation ('ok', 'error', or 'unauthorized')
            - message (str, optional): Error or success message
            
    Example:
        >>> await set_label_to("sample.db", "image1.jpg", 2)
        {"response": "ok", "message": "image1.jpg's label set to [2@car]"}
        
    Raises:
        HTTPException: If database operations fail or invalid parameters are provided.
    """
    response: Dict[str, str] = {
        'response': 'unauthorized'
    }
    try:
        if labelid not in labelslist.keys():
            response['response'] = 'error'
            response['message'] = 'Selected label [' + str(labelid) + '] not in yaml'
        else:
            # Use SQLAlchemy session instead of deprecated updateLabel function
            session = get_db_session(db)
            try:
                # Update label information for the file
                annotation = session.query(Annotation).filter(
                    Annotation.filename == imgname
                ).first()
                
                if annotation:
                    annotation.labelid = labelid
                    annotation.labeltext = labelslist[labelid]
                    session.commit()
                    response['response'] = 'ok'
                    response['message'] = "[{}]'s label set to [{}@{}]".format(imgname, labelid, labelslist[labelid])
                else:
                    response['response'] = 'error'
                    response['message'] = '0 rows affected'
            finally:
                session.close()
    except Exception as e:
        logger.error(f"Label set error: {str(e)}")
        raise HTTPException(status_code=500, detail="Label set error")
    
    return response

async def get_roi_for_wall(filename: str, y: float, x: float, h: float, w: float) -> FileResponse:
    """
    Get a cropped region of an image.
    
    This endpoint returns a cropped portion of an image based on the provided coordinates.
    
    Args:
        filename (str): The name of the image file to crop
        y (float): The y-coordinate of the top-left corner of the crop region
        x (float): The x-coordinate of the top-left corner of the crop region
        h (float): The height of the crop region
        w (float): The width of the crop region
        
    Returns:
        FileResponse: A file response containing the cropped image
        
    Example:
        >>> await get_roi_for_wall("image1.jpg", 10, 20, 100, 150)
        FileResponse with cropped image
        
    Raises:
        HTTPException: If image processing fails or invalid parameters are provided.
    """
    try:
        logger.info(f"FastAPI get_roi_for_wall called with: filename={filename}, y={y}, x={x}, h={h}, w={w}")
        # Validate inputs - check for None values instead of falsy values
        if filename is None:
            logger.error(f"Missing required parameters: filename={filename}, y={y}, x={x}, h={h}, w={w}")
            raise HTTPException(status_code=400, detail="Missing required parameters")

        try:
            y = int(float(y))
            x = int(float(x))
            h = int(float(h))
            w = int(float(w))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid coordinate parameters")

        strIO = getCroppedImage(filename, y, x, h, w)
        
        if strIO is None:
            raise HTTPException(status_code=500, detail="Failed to process image")

        # Convert BytesIO to a temporary file for FileResponse
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        temp_file.write(strIO.getvalue())
        temp_file.close()
        
        return FileResponse(temp_file.name, media_type='image/jpg')
    except Exception as e:
        logger.error(f"ROI image processing failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="ROI image processing failed")

async def get_roi_wall_data(
    scriptip: Optional[str] = Header(None), 
    pageInfo: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Get ROI wall data with pagination.
    
    This endpoint retrieves paginated data for the ROI wall view.
    
    Args:
        scriptip (Optional[str]): IP address of the script (header parameter)
        pageInfo (Optional[str]): Page information as JSON string with "pageIndex" and "pageSize" keys (header parameter)
        
    Returns:
        Dict[str, Any]: A dictionary containing:
            - total (int): Total number of ROIs
            - data (list): List of rows, each containing 4 ROI records
            
    Example:
        >>> await get_roi_wall_data(pageInfo='{"pageIndex": 0, "pageSize": 20}')
        {"total": 100, "data": [{"col0": {"filename": "image1.jpg", "roi_id": 0, "x": 10, "y": 20, "width": 100, "height": 150}, ...}]}
        
    Raises:
        HTTPException: If image manager is not initialized or other errors occur.
    """
    response: Dict[str, Any] = {}
    try:
        # Check if image_manager is initialized
        if image_manager is None:
            raise HTTPException(status_code=500, detail="Image manager not initialized")
            
        pageInfo_dict: Dict[str, Any] = {"pageIndex": 0, "pageSize": 10}
        if pageInfo:
            try:
                pageInfo_dict = json.loads(pageInfo)
            except (json.JSONDecodeError, TypeError):
                # If JSON parsing fails or pageInfo is None, use default values
                pageInfo_dict = {"pageIndex": 0, "pageSize": 10}
        
        # Convert string values to integers for calculations
        pageIndex = int(pageInfo_dict["pageIndex"])
        pageSize = int(pageInfo_dict["pageSize"])
        
        # Get all ROIs from the database
        session = get_db_session(sqlitedbs[0])  # Use first database
        try:
            # Query all non-deleted annotations that have imgareas
            annotations = session.query(Annotation).filter(
                Annotation.isdeleted == False,
                Annotation.imgareas.isnot(None),
                Annotation.imgareas != ""
            ).all()
            
            # Process annotations to extract individual ROIs
            all_rois = []
            for annotation in annotations:
                try:
                    imgareas = json.loads(annotation.imgareas)
                    if isinstance(imgareas, list):
                        for i, roi in enumerate(imgareas):
                            # Extract ROI information
                            roi_data = {
                                "filename": annotation.filename,
                                "roi_id": roi.get("id", i),
                                "x": roi.get("x", 0),
                                "y": roi.get("y", 0),
                                "width": roi.get("width", 0),
                                "height": roi.get("height", 0)
                            }
                            all_rois.append(roi_data)
                except (json.JSONDecodeError, TypeError, AttributeError):
                    # Skip annotations with invalid imgareas
                    continue
        finally:
            session.close()
        
        # Calculate pagination
        total_rois = len(all_rois)
        sliceStart = pageIndex * pageSize
        sliceEnd = min(sliceStart + pageSize, total_rois)
        
        # Get ROIs for the current page
        page_rois = all_rois[sliceStart:sliceEnd]
        
        # Process ROIs for the current page into rows
        rows = []
        imgsPerRow = 4
        
        # Create rows of ROI data
        for i in range(0, len(page_rois), imgsPerRow):
            row = {}
            for j in range(imgsPerRow):
                if i + j < len(page_rois):
                    row[f'col{j}'] = page_rois[i + j]
                else:
                    # Fill empty cells with None
                    row[f'col{j}'] = None
            rows.append(row)
        
        response = {
            "total": total_rois,
            "data": rows
        }
    except Exception as e:
        logger.error(f"ROI wall data retrieval failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="ROI wall data retrieval failed")
    
    return response

async def delete_image(imgname: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Delete a specific image from the system.
    
    This endpoint removes an image from both the database and file system.
    
    Args:
        imgname (Optional[str]): The filename of the image to delete (header parameter)
        
    Returns:
        Dict[str, Any]: A response dictionary with status information:
            - response (str): Status of the operation ('unauthorized', 'error', or 'ok')
            - message (str, optional): Error message if operation fails
            - status (str, optional): Status message if operation succeeds
            
    Example:
        >>> await delete_image(imgname="image1.jpg")
        {"status": "ok"}
        
    Raises:
        HTTPException: If image manager is not initialized or other errors occur.
    """
    response: Dict[str, Any] = {
        'response': 'unauthorized'
    }
    # Use image_manager instead of global refFiles
    if image_manager is None:
        response['response'] = 'error'
        response['message'] = 'Image manager not initialized'
        return response

    try:
        if imgname is None:
            response['response'] = 'error'
            response['message'] = 'Missing imgname header'
            return response

        try:
            fileIndex = image_manager.get_file_index(imgname)
        except ValueError:
            response['response'] = 'error'
            response['message'] = 'Image not found in refFiles'
            return response
                    
        for db in sqlitedbs:
            try:
                # Use SQLAlchemy session instead of deprecated cursor
                session = get_db_session(db)
                try:
                    # Update the annotation to mark as deleted
                    annotation = session.query(Annotation).filter(
                        Annotation.filename == imgname
                    ).first()
                    
                    if annotation:
                        annotation.isdeleted = 1
                        session.commit()
                finally:
                    session.close()

                # Delete from disk
                os.remove(os.path.join(config["anno"]["refimgs"], image_manager.refFiles[fileIndex]))
                image_manager.delete_file(fileIndex)

                response = {
                    "status": "ok"
                }
                break  # Exit after successful deletion
            except Exception as e:
                logger.error(f"Image deletion failed: {str(e)}")
                response['response'] = 'error'
                response['message'] = str(e)
                raise HTTPException(status_code=500, detail="Image deletion failed")
    except Exception as e:
        logger.error(f"Delete image error: {str(e)}")
        response['response'] = 'error'
        response['message'] = str(e)
        raise HTTPException(status_code=500, detail="Delete image error")
    
    return response

async def delete_current_image() -> Dict[str, Any]:
    """
    Delete the currently selected image from the system.
    
    This endpoint removes the current image from both the database and file system,
    then returns the next image in the sequence.
    
    Returns:
        Dict[str, Any]: A response dictionary with status information:
            - response (str): Status of the operation ('unauthorized', 'error', or 'ok')
            - message (str, optional): Error message if operation fails
            - imgname (str, optional): Filename of the next image
            - img (str, optional): Base64 encoded image data of the next image
            - annotation (Any, optional): Annotation data for the next image
            - db (str, optional): Database name for the next image
            - progress (str, optional): Progress information in format "current_index/total_count"
            
    Example:
        >>> await delete_current_image()
        {"status": "ok", "imgname": "image2.jpg", "img": "...", "annotation": [], "db": "sample.db", "progress": "1/100"}
        
    Raises:
        HTTPException: If image manager is not initialized or other errors occur.
    """
    response: Dict[str, Any] = {
        'response': 'unauthorized'
    }
    # Use image_manager instead of global refFiles and currIndex
    if image_manager is None:
        response['response'] = 'error'
        response['message'] = 'Image manager not initialized'
        return response

    try:
        if image_manager.currIndex < 0 or image_manager.currIndex >= image_manager.get_total_files():
            response['response'] = 'error'
            response['message'] = 'Invalid index'
            return response
            
        fyl = image_manager.get_current_file()
                    
        for db in sqlitedbs:
            try:
                # Use SQLAlchemy session instead of deprecated cursor
                session = get_db_session(db)
                try:
                    # Update the annotation to mark as deleted
                    annotation = session.query(Annotation).filter(
                        Annotation.filename == fyl
                    ).first()
                    
                    if annotation:
                        annotation.isdeleted = 1
                        session.commit()
                finally:
                    session.close()
            except Exception as e:
                logger.error(f"Database deletion error: {str(e)}")
                response['response'] = 'error'
                response['message'] = str(e)
                raise HTTPException(status_code=500, detail="Database deletion error")
        
        # Delete from disk
        try:
            os.remove(os.path.join(config["anno"]["refimgs"], image_manager.refFiles[image_manager.currIndex]))
            image_manager.delete_file(image_manager.currIndex)
            # Return next image
            return await get_next_image()
        except Exception as e:
            logger.error(f"File deletion error: {str(e)}")
            response['response'] = 'error'
            response['message'] = str(e)
            raise HTTPException(status_code=500, detail="File deletion error")
    except Exception as e:
        logger.error(f"Current image deletion failed: {str(e)}")
        response['response'] = 'error'
        response['message'] = str(e)
        raise HTTPException(status_code=500, detail="Current image deletion failed")
    
    return response

async def get_next_image(
    unreviewed: bool = False, 
    filter: Optional[str] = None, 
    filterval: Optional[str] = None, 
    retain_index: bool = False
) -> Dict[str, Any]:
    """
    Get the next image in the sequence based on current index or specified filter.
    
    This function retrieves the next image in the reference files list, with options
    to filter by name or seek to a specific index, and to get only unreviewed images.
    
    Args:
        unreviewed (bool): If True, only returns unreviewed images. Defaults to False.
        filter (Optional[str]): Filter type to apply. Can be "name" or "seek". Defaults to None.
        filterval (Optional[str]): Value to filter by when using "name" or "seek" filter. Defaults to None.
        retain_index (bool): If True, does not increment the current index. Defaults to False.
        
    Returns:
        Dict[str, Any]: A dictionary containing:
            - imgname (str): The filename of the image
            - img (str): Base64 encoded image data
            - annotation (Any): Annotation data for the image
            - db (str): Database name
            - response (str): Status of the operation ('valid', 'create', or 'error')
            - progress (str): Progress information in format "current_index/total_count"
            - message (str, optional): Error message if response is 'error'
            
    Example:
        # Get next image
        result = await get_next_image()
        
        # Get next unreviewed image
        result = await get_next_image(unreviewed=True)
        
        # Get image by name
        result = await get_next_image(filter="name", filterval="image1.jpg")
        
        # Seek to specific index
        result = await get_next_image(filter="seek", filterval="5")
        
        # Get next image without incrementing index
        result = await get_next_image(retain_index=True)
        
    Raises:
        HTTPException: If image processing fails or invalid parameters are provided.
        
    Note:
        - When filter is None, the function advances to the next image in sequence
        - When filter is "name", it searches for the specified image name
        - When filter is "seek", it jumps to the specified index
        - If createIfAbsent is True in config, a new entry will be created if image is not found in database
        - If no valid image is found, returns an error message
    """
    response: Dict[str, Any] = {
        'response': 'invalid'
    }
    # Use image_manager instead of global refFiles and currIndex
    if image_manager is None:
        response['response'] = 'error'
        response['message'] = 'Image manager not initialized'
        return response

    try:
        fyl: Optional[str] = None
        
        # Ensure filter and filterval are strings
        filter_str = filter if filter is not None else ""
        filterval_str = filterval if filterval is not None else ""
        
        if filter_str == "" or len(filter_str) == 0:
            if not retain_index:
                image_manager.increment_index()
            currIndex = image_manager.currIndex
            
        elif filter_str == "name":
            logger.info("Looking up by name")

            # Check if filterval is None before using it
            if filterval_str == "":
                response['response'] = 'error'
                response['message'] = 'filterval is required when using name filter'
                return response
                
            try:
                image_manager.currIndex = image_manager.get_file_index(filterval_str)
                currIndex = image_manager.currIndex
            except ValueError:
                logger.warning(f"Image {filterval_str} not found in refFiles")
                image_manager.currIndex = -1
                currIndex = -1

        elif filter_str == "seek":
            # Check if filterval is None before using it
            if filterval_str == "":
                response['response'] = 'error'
                response['message'] = 'filterval is required when using seek filter'
                return response
                
            seekIndex = int(filterval_str)
            if seekIndex >=0 and seekIndex < image_manager.get_total_files():
                image_manager.currIndex = seekIndex
                currIndex = seekIndex

        if image_manager.currIndex >= 0 and image_manager.currIndex < image_manager.get_total_files():
            fyl = image_manager.get_current_file()
            
            # Ensure fyl is not None before proceeding
            if fyl is None:
                response['message'] = "Image file name is None"
                return response
            
            # Use SQLAlchemy session instead of deprecated lookupFile function
            imheight, imwidth, imgareas, dbName = None, None, None, None
            session = get_db_session(sqlitedbs[0])  # Use first database for lookup
            try:
                if unreviewed:
                    query = session.query(Annotation).filter(
                        Annotation.isdeleted == False,
                        Annotation.filename == fyl,
                        Annotation.isreviewed == False
                    )
                else:
                    query = session.query(Annotation).filter(
                        Annotation.isdeleted == False,
                        Annotation.filename == fyl
                    )
                
                result = query.first()
                
                if result is not None:
                    imheight, imwidth, imgareas = int(result.imheight), int(result.imwidth), result.imgareas
                    dbName = sqlitedbs[0]  # Use first database for the response
            finally:
                session.close()


            if dbName is not None:
                response['imgname'] = fyl	
                response['img'] = getB64Image(fyl)
                response['annotation'] = imgareas
                response['db'] = dbName
                response['response'] = 'valid'
                response['progress'] = "{}/{}".format(image_manager.currIndex, image_manager.get_total_files())
            
            elif config['anno']['createIfAbsent'] == True:
                response['response'] = 'create'

                response['imgname'] = fyl		
                response['img'] = getB64Image(fyl)
                response['annotation'] = []
                response['db'] = sqlitedbs[0]
                response['progress'] = "{}/{}".format(image_manager.currIndex, image_manager.get_total_files())
            else:
                response['message'] = "[{}] not in db and createIfAbsent is False".format(fyl)
        else:
            response['message'] = "No valid image found"
    except Exception as e:
        logger.error(f"Next image retrieval failed: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Next image retrieval failed")
    
    return response

async def get_prev_image() -> Dict[str, Any]:
    """
    Get the previous image in the sequence.
    
    This endpoint retrieves the previous image in the reference files list.
    
    Returns:
        Dict[str, Any]: A dictionary containing:
            - imgname (str): The filename of the image
            - img (str): Base64 encoded image data
            - annotation (Any): Annotation data for the image
            - db (str): Database name
            - response (str): Status of the operation ('valid', 'create', or 'error')
            - progress (str): Progress information in format "current_index/total_count"
            - message (str, optional): Error message if response is 'error'
            
    Example:
        >>> await get_prev_image()
        {"imgname": "image1.jpg", "img": "...", "annotation": [], "db": "sample.db", "response": "valid", "progress": "0/100"}
        
    Raises:
        HTTPException: If image processing fails or invalid parameters are provided.
    """
    response: Dict[str, Any] = {
        'response': 'unauthorized'
    }
    # Use image_manager instead of global refFiles and currIndex
    if image_manager is None:
        response['response'] = 'error'
        response['message'] = 'Image manager not initialized'
        return response

    try:
        fyl: Optional[str] = None

        image_manager.decrement_index()
        currIndex = image_manager.currIndex

        if currIndex >= 0 and currIndex < image_manager.get_total_files():
            fyl = image_manager.get_current_file()
            
            # Ensure fyl is not None before proceeding
            if fyl is None:
                response['message'] = "Image file name is None"
                return response
            
            # Use SQLAlchemy session instead of deprecated lookupFile function
            imheight, imwidth, imgareas, dbName = None, None, None, None
            session = get_db_session(sqlitedbs[0])  # Use first database for lookup
            try:
                query = session.query(Annotation).filter(
                    Annotation.isdeleted == False,
                    Annotation.filename == fyl
                )
                
                result = query.first()
                
                if result is not None:
                    imheight, imwidth, imgareas = int(result.imheight), int(result.imwidth), result.imgareas
                    dbName = sqlitedbs[0]  # Use first database for the response
            finally:
                session.close()

            if dbName is not None:
                response['response'] = 'valid'

                response['imgname'] = fyl		
                response['img'] = getB64Image(fyl)
                response['annotation'] = imgareas
                response['db'] = dbName
                response['progress'] = "{}/{}".format(image_manager.currIndex, image_manager.get_total_files())
            
            # Let the front end create a new image area
            elif config['anno']['createIfAbsent'] == True:
                response['response'] = 'create'

                response['imgname'] = fyl		
                response['img'] = getB64Image(fyl)
                response['annotation'] = []
                response['db'] = sqlitedbs[0]
                response['progress'] = "{}/{}".format(image_manager.currIndex, image_manager.get_total_files())
            else:
                response['message'] = "[{}] not in db and createIfAbsent is False".format(fyl)
        else:
            response['message'] = "No valid image found"
    except Exception as e:
        logger.error(f"Previous image retrieval failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Previous image retrieval failed")
    
    return response

async def get_labels() -> Dict[str, Any]:
    """
    Get available labels for images.
    
    This endpoint returns all available labels and the default label configuration.
    
    Returns:
        Dict[str, Any]: A dictionary containing:
            - available (Dict[int, str]): Dictionary mapping label IDs to their names
            - default (Dict[int, str]): Dictionary with the default label ID and name
            
    Example:
        >>> await get_labels()
        {"available": {1: "car", 2: "person", 3: "building"}, "default": {1: "car"}}
        
    Raises:
        HTTPException: If there's an error retrieving labels.
    """
    labelsToReturn: Dict[str, Any] = {}
    labelsToReturn['available'] = labelslist
    labelsToReturn['default'] = {
        defaultlabel : labelslist[defaultlabel]
    }
    return labelsToReturn
