import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid, 
  IconButton,
  Toolbar,
  AppBar,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  SkipPrevious,
  SkipNext,
  Add,
  Remove,
  Delete,
  Save
} from '@mui/icons-material';
import api from '../services/api';

const AnnotationPage = () => {
  // State variables
  const [currentImage, setCurrentImage] = useState('/placeholder.svg');
  const [currentImageName, setCurrentImageName] = useState('');
  const [currentDbName, setCurrentDbName] = useState('');
  const [progress, setProgress] = useState('0/0');
  const [annotations, setAnnotations] = useState([]);
  const [availableLabels, setAvailableLabels] = useState({ 1: 'Object', 2: 'Background' });
  const [defaultLabel, setDefaultLabel] = useState({ 1: 'Object' });
  const [currentLabel, setCurrentLabel] = useState({ id: 1, lbl: 'Object' });
  const [aspectRatio, setAspectRatio] = useState(0);
  const [imageFilter, setImageFilter] = useState('');
  const [seekIndex, setSeekIndex] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [currentIndex, setCurrentIndex] = useState(-1); // Track current index for navigation
  
  // Drawing state variables
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(-1);
  
  // Dragging state variables
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalAnnotation, setOriginalAnnotation] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'
  
  // Refs
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Initialize component
  // This effect runs once on mount to load initial data
useEffect(() => {
    // Load labels and default image
    loadLabels();
    loadNextImage(false, '', '', -1);
    
    // Add keyboard event listener
    const handleKeyDown = (e) => {
      // Only handle keyboard events when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.key) {
        case 'd':
          // Delete selected annotation
          deleteSelectedAnnotation();
          break;
        case 'c':
          // Clear all annotations
          clearAllAnnotations();
          break;
        case 's':
          // Save annotations
          updateAnnotations();
          break;
        case 'n':
          // Load next image
          loadNextImage(false, '', '', currentIndex);
          break;
        case 'p':
          // Load previous image
          loadPrevImage(currentIndex);
          break;
        case 'l':
          // Update selected annotation label
          updateSelectedAnnotationLabel();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Run once on mount
  
useEffect(() => {
    // Ensure we have valid data before allowing any save operations
    // If we don't have valid database or image name, try to load the first image
    if (!currentDbName || !currentImageName) {
      loadNextImage();
    }
  }, [currentDbName, currentImageName]);

// New effect: when currentIndex changes, load the corresponding image
useEffect(() => {
    if (currentIndex >= 0) {
      loadNextImage();
    }
  }, [currentIndex]);
  
  // Show alert message
  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };
  
  // Handle alert close
  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlert({ ...alert, open: false });
  };
  
  // Load available labels
  const loadLabels = async () => {
    try {
      const response = await api.getLabels();
      setAvailableLabels(response.data.available);
      setDefaultLabel(response.data.default);
      const defaultId = Object.keys(response.data.default)[0];
      setCurrentLabel({ id: defaultId, lbl: response.data.default[defaultId] });
    } catch (error) {
      console.error('Error loading labels:', error);
      showAlert('Error loading labels', 'error');
    }
  };
  
  // Load next image
  const loadNextImage = async (unreviewed = false, filter = '', filterval = '') => {
    try {
      console.log(`loadNextImage called with: unreviewed=${unreviewed}, filter=${filter}, filterval=${filterval}`);
      console.log(`Current state - dbName: ${currentDbName}, imageName: ${currentImageName}, currentIndex: ${currentIndex}`);
      
      // For the initial load, don't save annotations as we might not have valid data yet
      if (currentDbName && currentImageName) {
        console.log('Saving current annotations before loading next image');
        // Save current annotations before loading next image
        await updateAnnotations();
      } else {
        console.log('Skipping annotation save - no valid current image');
      }
      
      const response = await api.getNextImage({
  headers: {
    'unreviewed': unreviewed.toString(),
    'filter': filter,
    'filterval': filterval,
    'currentindex': currentIndex.toString()
  }
});
      console.log('API response for getNextImage:', response);
      
      if (response.data.response === 'valid' || response.data.response === 'create') {
        console.log(`Setting new image: ${response.data.imgname}`);
        setCurrentImage(response.data.img);
        setCurrentImageName(response.data.imgname);
        setCurrentDbName(response.data.db);
        setProgress(response.data.progress);
        setCurrentIndex(response.data.currentindex); // Update the current index
        
        // Parse annotations properly
        let parsedAnnotations = [];
        if (response.data.annotation) {
          if (typeof response.data.annotation === 'string') {
            try {
              parsedAnnotations = JSON.parse(response.data.annotation);
            } catch (parseError) {
              console.warn('Error parsing annotations:', parseError);
              parsedAnnotations = [];
            }
          } else if (Array.isArray(response.data.annotation)) {
            parsedAnnotations = response.data.annotation;
          }
        }
        console.log(`Setting annotations:`, parsedAnnotations);
        setAnnotations(parsedAnnotations);
      } else {
        console.warn('Error loading image:', response.data.message);
        showAlert(response.data.message || 'Error loading image', 'warning');
      }
    } catch (error) {
      console.error('Error loading next image:', error);
      showAlert('Error loading next image', 'error');
    }
  };
  
  // Load previous image
  const loadPrevImage = async () => {
    try {
      console.log(`loadPrevImage called`);
      console.log(`Current state - dbName: ${currentDbName}, imageName: ${currentImageName}, currentIndex: ${currentIndex}`);
      
      // Save current annotations before loading previous image
      if (currentDbName && currentImageName) {
        console.log('Saving current annotations before loading previous image');
        await updateAnnotations();
      } else {
        console.log('Skipping annotation save - no valid current image');
      }
      
      const response = await api.getPrevImage(currentIndex);
      console.log('API response for getPrevImage:', response);
      
      if (response.data.response === 'valid' || response.data.response === 'create') {
        console.log(`Setting new image: ${response.data.imgname}`);
        setCurrentImage(response.data.img);
        setCurrentImageName(response.data.imgname);
        setCurrentDbName(response.data.db);
        setProgress(response.data.progress);
        setCurrentIndex(response.data.currentindex); // Update the current index
        
        // Parse annotations properly
        let parsedAnnotations = [];
        if (response.data.annotation) {
          if (typeof response.data.annotation === 'string') {
            try {
              parsedAnnotations = JSON.parse(response.data.annotation);
            } catch (parseError) {
              console.warn('Error parsing annotations:', parseError);
              parsedAnnotations = [];
            }
          } else if (Array.isArray(response.data.annotation)) {
            parsedAnnotations = response.data.annotation;
          }
        }
        console.log(`Setting annotations:`, parsedAnnotations);
        setAnnotations(parsedAnnotations);
      } else {
        console.warn('Error loading image:', response.data.message);
        showAlert(response.data.message || 'Error loading image', 'warning');
      }
    } catch (error) {
      console.error('Error loading previous image:', error);
      showAlert('Error loading previous image', 'error');
    }
  };
  
  // Delete current image
  const deleteCurrentImage = async () => {
    if (confirm(`Are you sure you want to delete image [${currentImageName}]?`)) {
      try {
        await api.deleteCurrentImage();
        // Then load next image
        loadNextImage();
      } catch (error) {
        console.error('Error deleting image:', error);
        showAlert('Error deleting image', 'error');
      }
    }
  };
  
  // Update annotations
  const updateAnnotations = async () => {
    try {
      // Check if we have valid database and image name
      if (!currentDbName || !currentImageName) {
        console.error('Database name or image name is not set');
        console.log('currentDbName:', currentDbName);
        console.log('currentImageName:', currentImageName);
        showAlert('Error: Database or image name not available. Please load an image first.', 'error');
        return;
      }
      
      // Check if we have any annotations to save
      if (!annotations || annotations.length === 0) {
        console.log('No annotations to save');
        showAlert('No annotations to save', 'info');
        return;
      }
      
      console.log('About to call API with:', { dbName: currentDbName, imgname: currentImageName, coords: annotations });
      const response = await api.updateAnnotation(currentDbName, currentImageName, annotations);
      
      if (response.data.response === 'valid') {
        showAlert('Annotations saved successfully', 'success');
      } else if (response.data.response === 'no-match') {
        showAlert('No matching record found to update', 'warning');
      } else {
        showAlert('Unexpected response from server', 'error');
      }
    } catch (error) {
      console.error('Error updating annotations:', error);
      if (error.response) {
        // Server responded with error status
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        showAlert(`Server error: ${error.response.data.error || error.response.statusText}`, 'error');
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        showAlert('Network error: No response from server', 'error');
      } else {
        // Something else happened
        console.error('Error message:', error.message);
        showAlert(`Error saving annotations: ${error.message}`, 'error');
      }
    }
  };
  
  // Set current label
  const setCurrentLabelTo = (labelId) => {
    const label = availableLabels[labelId];
    setCurrentLabel({ id: labelId, lbl: label });
    showAlert(`Label set to ${label}`, 'info');
  };
  
  // Handle mouse down event for drawing
  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    
    // Prevent default browser drag behavior
    e.preventDefault();
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on an existing annotation
    const clickedAnnotationIndex = annotations.findIndex((annotation, index) => {
      // Check if clicking on resize handles (5px from edges)
      const handleSize = 5;
      
      // Check resize handles
      if (
        x >= annotation.x - handleSize && x <= annotation.x + handleSize &&
        y >= annotation.y - handleSize && y <= annotation.y + handleSize
      ) {
        // Top-left handle
        setSelectedAnnotationIndex(index);
        setIsResizing(true);
        setResizeHandle('nw');
        setDragStart({ x, y });
        setOriginalAnnotation({ ...annotation });
        return true;
      } else if (
        x >= annotation.x + annotation.width - handleSize && x <= annotation.x + annotation.width + handleSize &&
        y >= annotation.y - handleSize && y <= annotation.y + handleSize
      ) {
        // Top-right handle
        setSelectedAnnotationIndex(index);
        setIsResizing(true);
        setResizeHandle('ne');
        setDragStart({ x, y });
        setOriginalAnnotation({ ...annotation });
        return true;
      } else if (
        x >= annotation.x - handleSize && x <= annotation.x + handleSize &&
        y >= annotation.y + annotation.height - handleSize && y <= annotation.y + annotation.height + handleSize
      ) {
        // Bottom-left handle
        setSelectedAnnotationIndex(index);
        setIsResizing(true);
        setResizeHandle('sw');
        setDragStart({ x, y });
        setOriginalAnnotation({ ...annotation });
        return true;
      } else if (
        x >= annotation.x + annotation.width - handleSize && x <= annotation.x + annotation.width + handleSize &&
        y >= annotation.y + annotation.height - handleSize && y <= annotation.y + annotation.height + handleSize
      ) {
        // Bottom-right handle
        setSelectedAnnotationIndex(index);
        setIsResizing(true);
        setResizeHandle('se');
        setDragStart({ x, y });
        setOriginalAnnotation({ ...annotation });
        return true;
      } else if (
        x >= annotation.x && x <= annotation.x + annotation.width &&
        y >= annotation.y && y <= annotation.y + annotation.height
      ) {
        // Clicking inside the annotation (but not on handles)
        setSelectedAnnotationIndex(index);
        showAlert(`Selected annotation ${index + 1}`, 'info');
        
        // Start dragging
        setIsDragging(true);
        setDragStart({ x, y });
        setOriginalAnnotation({ ...annotation });
        return true;
      }
      
      return false;
    });
    
    if (clickedAnnotationIndex !== -1) {
      return;
    }
    
    // If no annotation was clicked, start drawing a new one
    setSelectedAnnotationIndex(-1);
    setIsDragging(false);
    setIsResizing(false);
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };
  
  // Handle mouse move event for drawing
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    // Prevent default browser drag behavior
    e.preventDefault();
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Handle resizing
    if (isResizing && selectedAnnotationIndex !== -1 && originalAnnotation && resizeHandle) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      const newAnnotations = [...annotations];
      const updatedAnnotation = { ...originalAnnotation };
      
      switch (resizeHandle) {
        case 'nw': // Top-left
          updatedAnnotation.x = originalAnnotation.x + deltaX;
          updatedAnnotation.y = originalAnnotation.y + deltaY;
          updatedAnnotation.width = originalAnnotation.width - deltaX;
          updatedAnnotation.height = originalAnnotation.height - deltaY;
          break;
        case 'ne': // Top-right
          updatedAnnotation.y = originalAnnotation.y + deltaY;
          updatedAnnotation.width = originalAnnotation.width + deltaX;
          updatedAnnotation.height = originalAnnotation.height - deltaY;
          break;
        case 'sw': // Bottom-left
          updatedAnnotation.x = originalAnnotation.x + deltaX;
          updatedAnnotation.width = originalAnnotation.width - deltaX;
          updatedAnnotation.height = originalAnnotation.height + deltaY;
          break;
        case 'se': // Bottom-right
          updatedAnnotation.width = originalAnnotation.width + deltaX;
          updatedAnnotation.height = originalAnnotation.height + deltaY;
          break;
      }
      
      // Ensure minimum size
      if (updatedAnnotation.width < 5) {
        updatedAnnotation.width = 5;
      }
      if (updatedAnnotation.height < 5) {
        updatedAnnotation.height = 5;
      }
      
      newAnnotations[selectedAnnotationIndex] = updatedAnnotation;
      setAnnotations(newAnnotations);
      drawAnnotationsWithTemporaryRect(updatedAnnotation);
      return;
    }
    
    // Handle dragging
    if (isDragging && selectedAnnotationIndex !== -1 && originalAnnotation) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      const newAnnotations = [...annotations];
      newAnnotations[selectedAnnotationIndex] = {
        ...originalAnnotation,
        x: originalAnnotation.x + deltaX,
        y: originalAnnotation.y + deltaY
      };
      
      setAnnotations(newAnnotations);
      drawAnnotationsWithTemporaryRect(newAnnotations[selectedAnnotationIndex]);
      return;
    }
    
    // Handle drawing
    if (isDrawing) {
      const newRect = {
        x: Math.min(startPoint.x, x),
        y: Math.min(startPoint.y, y),
        width: Math.abs(x - startPoint.x),
        height: Math.abs(y - startPoint.y)
      };
      
      setCurrentRect(newRect);
      drawTemporaryRect(newRect);
    }
  };
  
  // Handle mouse up event for drawing
  const handleMouseUp = (e) => {
    // Prevent default browser drag behavior
    e.preventDefault();
    
    // Handle resizing
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setOriginalAnnotation(null);
      drawAnnotations();
      return;
    }
    
    // Handle dragging
    if (isDragging) {
      setIsDragging(false);
      setOriginalAnnotation(null);
      drawAnnotations();
      return;
    }
    
    // Handle drawing
    if (isDrawing) {
      setIsDrawing(false);
      
      if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
        // Add the new annotation
        const newAnnotation = {
          x: currentRect.x,
          y: currentRect.y,
          width: currentRect.width,
          height: currentRect.height,
          label: currentLabel.id
        };
        
        setAnnotations([...annotations, newAnnotation]);
      }
      
      setCurrentRect(null);
      clearTemporaryRect();
    }
  };
  
  // Draw temporary rectangle during drawing
  const drawTemporaryRect = (rect) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing annotations
    drawAnnotations();
    
    // Draw temporary rectangle
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    
    // Draw label
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px Arial';
    ctx.fillText(`Label: ${currentLabel.lbl}`, rect.x, rect.y - 5);
  };
  
  // Draw annotations with temporary rectangle for dragging
  const drawAnnotationsWithTemporaryRect = (tempAnnotation) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match image
    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;
    
    // Draw existing annotations (except the one being dragged)
    annotations.forEach((annotation, index) => {
      if (index === selectedAnnotationIndex) return; // Skip the one being dragged
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      
      // Draw label
      ctx.fillStyle = '#ff0000';
      ctx.font = '12px Arial';
      ctx.fillText(`${annotation.label || ''}`, annotation.x, annotation.y - 5);
    });
    
    // Draw the annotation being dragged
    if (tempAnnotation) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(tempAnnotation.x, tempAnnotation.y, tempAnnotation.width, tempAnnotation.height);
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px Arial';
      ctx.fillText(`${tempAnnotation.label || ''}`, tempAnnotation.x, tempAnnotation.y - 5);
      
      // Draw resize handles
      const handleSize = 5;
      ctx.fillStyle = '#00ff00';
      
      // Top-left handle
      ctx.fillRect(tempAnnotation.x - handleSize/2, tempAnnotation.y - handleSize/2, handleSize, handleSize);
      
      // Top-right handle
      ctx.fillRect(tempAnnotation.x + tempAnnotation.width - handleSize/2, tempAnnotation.y - handleSize/2, handleSize, handleSize);
      
      // Bottom-left handle
      ctx.fillRect(tempAnnotation.x - handleSize/2, tempAnnotation.y + tempAnnotation.height - handleSize/2, handleSize, handleSize);
      
      // Bottom-right handle
      ctx.fillRect(tempAnnotation.x + tempAnnotation.width - handleSize/2, tempAnnotation.y + tempAnnotation.height - handleSize/2, handleSize, handleSize);
    }
  };
  
  // Clear temporary rectangle
  const clearTemporaryRect = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw existing annotations
    drawAnnotations();
  };
  
  // Handle image load
  const handleImageLoad = () => {
    // Make sure the image element doesn't allow dragging
    if (imageRef.current) {
      imageRef.current.setAttribute('draggable', 'false');
    }
    // Draw annotations on canvas
    drawAnnotations();
  };
  
  // Draw annotations on canvas
  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    
    // Draw existing annotations
    annotations.forEach((annotation, index) => {
      // Highlight selected annotation
      if (index === selectedAnnotationIndex) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
      }
      
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      
      // Draw label
      ctx.fillStyle = index === selectedAnnotationIndex ? '#00ff00' : '#ff0000';
      ctx.font = '12px Arial';
      ctx.fillText(`${annotation.label || ''}`, annotation.x, annotation.y - 5);
      
      // Draw resize handles for selected annotation
      if (index === selectedAnnotationIndex) {
        const handleSize = 5;
        ctx.fillStyle = '#00ff00';
        
        // Top-left handle
        ctx.fillRect(annotation.x - handleSize/2, annotation.y - handleSize/2, handleSize, handleSize);
        
        // Top-right handle
        ctx.fillRect(annotation.x + annotation.width - handleSize/2, annotation.y - handleSize/2, handleSize, handleSize);
        
        // Bottom-left handle
        ctx.fillRect(annotation.x - handleSize/2, annotation.y + annotation.height - handleSize/2, handleSize, handleSize);
        
        // Bottom-right handle
        ctx.fillRect(annotation.x + annotation.width - handleSize/2, annotation.y + annotation.height - handleSize/2, handleSize, handleSize);
      }
    });
  };
  
  // Expand/contract selected annotation
  const expandContract = (pixels) => {
    if (selectedAnnotationIndex !== -1) {
      const newAnnotations = [...annotations];
      const annotation = newAnnotations[selectedAnnotationIndex];
      
      // Update the annotation dimensions
      newAnnotations[selectedAnnotationIndex] = {
        ...annotation,
        x: annotation.x - pixels,
        y: annotation.y - pixels,
        width: annotation.width + (pixels * 2),
        height: annotation.height + (pixels * 2)
      };
      
      // Ensure minimum size
      if (newAnnotations[selectedAnnotationIndex].width < 5) {
        newAnnotations[selectedAnnotationIndex].width = 5;
        newAnnotations[selectedAnnotationIndex].x = annotation.x + (annotation.width - 5) / 2;
      }
      if (newAnnotations[selectedAnnotationIndex].height < 5) {
        newAnnotations[selectedAnnotationIndex].height = 5;
        newAnnotations[selectedAnnotationIndex].y = annotation.y + (annotation.height - 5) / 2;
      }
      
      setAnnotations(newAnnotations);
      showAlert(`Annotation expanded/contracted by ${pixels} pixels`, 'info');
    } else {
      showAlert('No annotation selected', 'warning');
    }
  };
  
  // Delete last annotation
  const deleteLastAnnotation = () => {
    if (annotations.length > 0) {
      const newAnnotations = [...annotations];
      newAnnotations.pop();
      setAnnotations(newAnnotations);
      setSelectedAnnotationIndex(-1);
      showAlert('Last annotation deleted', 'info');
    } else {
      showAlert('No annotations to delete', 'warning');
    }
  };
  
  // Delete selected annotation
  const deleteSelectedAnnotation = () => {
    if (selectedAnnotationIndex !== -1) {
      const newAnnotations = [...annotations];
      newAnnotations.splice(selectedAnnotationIndex, 1);
      setAnnotations(newAnnotations);
      setSelectedAnnotationIndex(-1);
      showAlert('Selected annotation deleted', 'info');
    } else {
      showAlert('No annotation selected', 'warning');
    }
  };
  
  // Update selected annotation label
  const updateSelectedAnnotationLabel = () => {
    if (selectedAnnotationIndex !== -1) {
      const newAnnotations = [...annotations];
      newAnnotations[selectedAnnotationIndex] = {
        ...newAnnotations[selectedAnnotationIndex],
        label: currentLabel.id
      };
      setAnnotations(newAnnotations);
      showAlert(`Annotation label updated to ${currentLabel.lbl}`, 'info');
    } else {
      showAlert('No annotation selected', 'warning');
    }
  };
  
  // Clear all annotations
  const clearAllAnnotations = () => {
    if (annotations.length > 0) {
      if (confirm('Are you sure you want to delete all annotations?')) {
        setAnnotations([]);
        setSelectedAnnotationIndex(-1);
        showAlert('All annotations cleared', 'info');
      }
    } else {
      showAlert('No annotations to clear', 'warning');
    }
  };
  
  // Move selected annotation
  const moveAnnotation = (direction, pixels) => {
    if (selectedAnnotationIndex !== -1) {
      const newAnnotations = [...annotations];
      const annotation = newAnnotations[selectedAnnotationIndex];
      
      switch (direction) {
        case 'left':
          newAnnotations[selectedAnnotationIndex] = {
            ...annotation,
            x: annotation.x - pixels
          };
          break;
        case 'right':
          newAnnotations[selectedAnnotationIndex] = {
            ...annotation,
            x: annotation.x + pixels
          };
          break;
        case 'up':
          newAnnotations[selectedAnnotationIndex] = {
            ...annotation,
            y: annotation.y - pixels
          };
          break;
        case 'down':
          newAnnotations[selectedAnnotationIndex] = {
            ...annotation,
            y: annotation.y + pixels
          };
          break;
        default:
          break;
      }
      
      setAnnotations(newAnnotations);
      showAlert(`Annotation moved ${direction} by ${pixels} pixels`, 'info');
    } else {
      showAlert('No annotation selected', 'warning');
    }
  };
  
  // Export annotations as JSON
  const exportAnnotations = () => {
    if (annotations.length === 0) {
      showAlert('No annotations to export', 'warning');
      return;
    }
    
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${currentImageName}_annotations.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('Annotations exported', 'success');
  };
  
  // Duplicate selected annotation
  const duplicateAnnotation = () => {
    if (selectedAnnotationIndex !== -1) {
      const annotationToDuplicate = annotations[selectedAnnotationIndex];
      const duplicatedAnnotation = {
        ...annotationToDuplicate,
        x: annotationToDuplicate.x + 50,
        y: annotationToDuplicate.y + 50
      };
      
      setAnnotations([...annotations, duplicatedAnnotation]);
      showAlert('Annotation duplicated', 'info');
    } else {
      showAlert('No annotation selected', 'warning');
    }
  };
  
  return (
    <>
      <Head>
        <title>Image Annotation Tool</title>
        <meta name="description" content="Image annotation tool for creating bounding boxes" />
        <link rel="icon" href="/favicon.ico" />
        <style>{`
          .annotation-container {
            -webkit-user-drag: none;
            -khtml-user-drag: none;
            -moz-user-drag: none;
            -o-user-drag: none;
            user-drag: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          .annotation-container img {
            -webkit-user-drag: none;
            -khtml-user-drag: none;
            -moz-user-drag: none;
            -o-user-drag: none;
            user-drag: none;
            pointer-events: none;
          }
        `}</style>
      </Head>

      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Image Annotation Tool
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Alert Snackbar */}
        <Snackbar 
          open={alert.open} 
          autoHideDuration={3000} 
          onClose={handleAlertClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleAlertClose} 
            severity={alert.severity} 
            sx={{ width: '100%' }}
            variant="filled"
          >
            {alert.message}
          </Alert>
        </Snackbar>
        
        {/* Toolbar */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {/* Filter Controls */}
            <TextField
              size="small"
              placeholder="Image Name"
              value={imageFilter}
              onChange={(e) => setImageFilter(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadNextImage(false, 'name', imageFilter, currentIndex);
                  setImageFilter('');
                }
              }}
            />
            
            <TextField
              size="small"
              type="number"
              placeholder="Index"
              value={seekIndex}
              onChange={(e) => setSeekIndex(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  loadNextImage(false, 'seek', seekIndex, currentIndex);
                  setSeekIndex('');
                }
              }}
            />
            
            {/* Navigation Controls */}
            <Box>
              <IconButton onClick={loadPrevImage} color="primary">
                <SkipPrevious />
              </IconButton>
              <IconButton onClick={() => loadNextImage()} color="primary">
                <SkipNext />
              </IconButton>
            </Box>
            
            {/* Expand/Contract Controls */}
            <Box>
              <IconButton onClick={() => expandContract(5)} color="primary">
                <Add />
              </IconButton>
              <IconButton onClick={() => expandContract(-5)} color="primary">
                <Remove />
              </IconButton>
            </Box>
            
            {/* Aspect Ratio Controls */}
            <ToggleButtonGroup
              value={aspectRatio}
              exclusive
              onChange={(e, newRatio) => setAspectRatio(newRatio)}
              size="small"
            >
              <ToggleButton value={0}>0.0</ToggleButton>
              <ToggleButton value={1}>1.0</ToggleButton>
              <ToggleButton value={1.3}>1.3</ToggleButton>
            </ToggleButtonGroup>
            
            {/* Save Button */}
            <IconButton onClick={updateAnnotations} color="primary">
              <Save />
            </IconButton>
            
            {/* Label Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={currentLabel.lbl} />
              <Box>
                {Object.entries(availableLabels).map(([id, label]) => (
                  <Button
                    key={id}
                    size="small"
                    variant={currentLabel.id == id ? "contained" : "outlined"}
                    onClick={() => setCurrentLabelTo(id)}
                    sx={{ m: 0.5 }}
                  >
                    {label}:{id}
                  </Button>
                ))}
              </Box>
            </Box>
            
            {/* Image Info */}
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              [{currentImageName}] of {currentDbName}
            </Typography>
            
            {/* Delete Button */}
            <IconButton onClick={deleteCurrentImage} color="error">
              <Delete />
            </IconButton>
            
            {/* Delete Last Annotation Button */}
            <IconButton onClick={deleteLastAnnotation} color="warning">
              <Delete />
            </IconButton>
            
            {/* Delete Selected Annotation Button */}
            <IconButton onClick={deleteSelectedAnnotation} color="secondary">
              <Delete />
            </IconButton>
            
            {/* Update Selected Annotation Label Button */}
            <Button onClick={updateSelectedAnnotationLabel} variant="contained" color="primary">
              Update Label
            </Button>
            
            {/* Clear All Annotations Button */}
            <Button onClick={clearAllAnnotations} variant="outlined" color="secondary">
              Clear All
            </Button>
            
            {/* Export Annotations Button */}
            <Button onClick={exportAnnotations} variant="outlined" color="primary">
              Export
            </Button>
            
            {/* Move Annotation Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => moveAnnotation('up', 5)} variant="outlined" size="small">
                ↑
              </Button>
              <Button onClick={() => moveAnnotation('down', 5)} variant="outlined" size="small">
                ↓
              </Button>
              <Button onClick={() => moveAnnotation('left', 5)} variant="outlined" size="small">
                ←
              </Button>
              <Button onClick={() => moveAnnotation('right', 5)} variant="outlined" size="small">
                →
              </Button>
            </Box>
            
            {/* Duplicate Annotation Button */}
            <Button onClick={duplicateAnnotation} variant="outlined" color="secondary">
              Duplicate
            </Button>
          </Toolbar>
        </AppBar>
        
        {/* Main Content */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <Box 
                ref={containerRef}
                sx={{ position: 'relative', display: 'inline-block' }}
                className="annotation-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={currentImage}
                  alt="Annotation target"
                  onLoad={handleImageLoad}
                  style={{ maxWidth: '100%', height: 'auto', userSelect: 'none', WebkitUserDrag: 'none', pointerEvents: 'none' }}
                  draggable="false"
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none'
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Progress */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Progress: {progress}
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default AnnotationPage;
