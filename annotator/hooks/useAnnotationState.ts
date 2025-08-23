import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export type Annotation = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: number;
};

export type AnnotationState = {
  currentImage: string;
  currentImageName: string;
  currentDbName: string;
  progress: string;
  annotations: Annotation[];
  availableLabels: Record<number, string>;
  defaultLabel: Record<number, string>;
  currentLabel: { id: number; lbl: string };
  aspectRatio: number;
  imageFilter: string;
  seekIndex: string;
  alert: { open: boolean; message: string; severity: 'info' | 'success' | 'warning' | 'error' };
  currentIndex: number;
  isDrawing: boolean;
  startPoint: { x: number; y: number };
  currentRect: { x: number; y: number; width: number; height: number } | null;
  selectedAnnotationIndex: number;
  isDragging: boolean;
  isResizing: boolean;
  dragStart: { x: number; y: number };
  originalAnnotation: Annotation | null;
  resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null;
  imageRef: React.MutableRefObject<HTMLImageElement | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
};

export function useAnnotationState() {
  const [currentImage, setCurrentImage] = useState<string>('/placeholder.svg');
  const [currentImageName, setCurrentImageName] = useState<string>('');
  const [currentDbName, setCurrentDbName] = useState<string>('');
  const [progress, setProgress] = useState<string>('0/0');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Record<number, string>>({ 1: 'Object', 2: 'Background' });
  const [defaultLabel, setDefaultLabel] = useState<Record<number, string>>({ 1: 'Object' });
  const [currentLabel, setCurrentLabel] = useState<{ id: number; lbl: string }>({ id: 1, lbl: 'Object' });
  const [aspectRatio, setAspectRatio] = useState<number>(0);
  const [imageFilter, setImageFilter] = useState<string>('');
  const [seekIndex, setSeekIndex] = useState<string>('');
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: 'info' | 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'info' });
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number>(-1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [originalAnnotation, setOriginalAnnotation] = useState<Annotation | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadLabels();
    // Load image 0 by default on initial startup
    loadNextImage(false, '', '', -1);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      
      switch (e.key) {
        case 'd':
          deleteSelectedAnnotation();
          break;
        case 'c':
          clearAllAnnotations();
          break;
        case 's':
          updateAnnotations();
          break;
        case 'n':
          loadNextImage(false, '', '', currentIndex);
          break;
        case 'p':
          loadPrevImage();
          break;
        case 'l':
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
  }, []);

  useEffect(() => {
    if (!currentDbName || !currentImageName) {
      loadNextImage();
    }
  }, [currentDbName, currentImageName]);

  useEffect(() => {
    if (currentIndex >= 0) {
      loadNextImage();
    }
  }, [currentIndex]);

  const showAlert = (message: string, severity: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAlert({ open: true, message, severity });
  };
  
  const handleAlertClose = (event: React.SyntheticEvent) => {
    setAlert({ ...alert, open: false });
  };
  
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
  
  const loadNextImage = async (unreviewed = false, filter = '', filterval = '', currentIndex = -1) => {
    try {
      console.log(`loadNextImage called with: unreviewed=${unreviewed}, filter=${filter}, filterval=${filterval}, currentIndex=${currentIndex}`);
      
      if (currentDbName && currentImageName) {
        console.log('Saving current annotations before loading next image');
        await updateAnnotations();
      } else {
        console.log('Skipping annotation save - no valid current image');
      }
      
      const response = await api.getNextImage(unreviewed, filter, filterval, currentIndex);
      console.log('API response for getNextImage:', response);
      
      if (response.data.response === 'valid' || response.data.response === 'create') {
        console.log(`Setting new image: ${response.data.imgname}`);
        setCurrentImage(response.data.img);
        setCurrentImageName(response.data.imgname);
        setCurrentDbName(response.data.db);
        setProgress(response.data.progress);
        setCurrentIndex(parseInt(response.data.currentindex, 10));
        
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
  
  const loadPrevImage = async () => {
    try {
      console.log(`loadPrevImage called`);
      
      if (currentDbName && currentImageName) {
        console.log('Saving current annotations before loading previous image');
        await updateAnnotations();
      } else {
        console.log('Skipping annotation save - no valid current image');
      }
      
      const response = await api.getPrevImage();
      console.log('API response for getPrevImage:', response);
      
      if (response.data.response === 'valid' || response.data.response === 'create') {
        console.log(`Setting new image: ${response.data.imgname}`);
        setCurrentImage(response.data.img);
        setCurrentImageName(response.data.imgname);
        setCurrentDbName(response.data.db);
        setProgress(response.data.progress);
        setCurrentIndex(parseInt(response.data.currentindex, 10));
        
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
  
  const deleteCurrentImage = async () => {
    if (confirm(`Are you sure you want to delete image [${currentImageName}]?`)) {
      try {
        await api.deleteCurrentImage();
        loadNextImage();
      } catch (error) {
        console.error('Error deleting image:', error);
        showAlert('Error deleting image', 'error');
      }
    }
  };
  
  const updateAnnotations = async () => {
    try {
      if (!currentDbName || !currentImageName) {
        console.error('Database name or image name is not set');
        console.log('currentDbName:', currentDbName);
        console.log('currentImageName:', currentImageName);
        showAlert('Error: Database or image name not available. Please load an image first.', 'error');
        return;
      }
      
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
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        showAlert(`Server error: ${error.response.data.error || error.response.statusText}`, 'error');
      } else if (error.request) {
        console.error('No response received:', error.request);
        showAlert('Network error: No response from server', 'error');
      } else {
        console.error('Error message:', error.message);
        showAlert(`Error saving annotations: ${error.message}`, 'error');
      }
    }
  };
  
  const setCurrentLabelTo = (labelId: number) => {
    const label = availableLabels[labelId];
    setCurrentLabel({ id: labelId, lbl: label });
    showAlert(`Label set to ${label}`, 'info');
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedAnnotationIndex = annotations.findIndex((annotation, index) => {
      const handleSize = 5;
      
      if (
        x >= annotation.x - handleSize && x <= annotation.x + handleSize &&
        y >= annotation.y - handleSize && y <= annotation.y + handleSize
      ) {
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
        setSelectedAnnotationIndex(index);
        showAlert(`Selected annotation ${index + 1}`, 'info');
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
    
    setSelectedAnnotationIndex(-1);
    setIsDragging(false);
    setIsResizing(false);
    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isResizing && selectedAnnotationIndex !== -1 && originalAnnotation && resizeHandle) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      const newAnnotations = [...annotations];
      const updatedAnnotation = { ...originalAnnotation };
      
      switch (resizeHandle) {
        case 'nw':
          updatedAnnotation.x = originalAnnotation.x + deltaX;
          updatedAnnotation.y = originalAnnotation.y + deltaY;
          updatedAnnotation.width = originalAnnotation.width - deltaX;
          updatedAnnotation.height = originalAnnotation.height - deltaY;
          break;
        case 'ne':
          updatedAnnotation.y = originalAnnotation.y + deltaY;
          updatedAnnotation.width = originalAnnotation.width + deltaX;
          updatedAnnotation.height = originalAnnotation.height - deltaY;
          break;
        case 'sw':
          updatedAnnotation.x = originalAnnotation.x + deltaX;
          updatedAnnotation.width = originalAnnotation.width - deltaX;
          updatedAnnotation.height = originalAnnotation.height + deltaY;
          break;
        case 'se':
          updatedAnnotation.width = originalAnnotation.width + deltaX;
          updatedAnnotation.height = originalAnnotation.height + deltaY;
          break;
      }
      
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
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setOriginalAnnotation(null);
      drawAnnotations();
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      setOriginalAnnotation(null);
      drawAnnotations();
      return;
    }
    
    if (isDrawing) {
      setIsDrawing(false);
      
      if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
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
  
  const drawTemporaryRect = (rect: { x: number; y: number; width: number; height: number }) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAnnotations();
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px Arial';
    ctx.fillText(`Label: ${currentLabel.lbl}`, rect.x, rect.y - 5);
  };
  
  const drawAnnotationsWithTemporaryRect = (tempAnnotation: Annotation) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = imageRef.current?.naturalWidth || 0;
    canvas.height = imageRef.current?.naturalHeight || 0;
    
    annotations.forEach((annotation, index) => {
      if (index === selectedAnnotationIndex) return;
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '12px Arial';
      ctx.fillText(`${annotation.label || ''}`, annotation.x, annotation.y - 5);
    });
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(tempAnnotation.x, tempAnnotation.y, tempAnnotation.width, tempAnnotation.height);
    
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px Arial';
    ctx.fillText(`${tempAnnotation.label || ''}`, tempAnnotation.x, tempAnnotation.y - 5);
    
    const handleSize = 5;
    ctx.fillStyle = '#00ff00';
    
    ctx.fillRect(tempAnnotation.x - handleSize/2, tempAnnotation.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(tempAnnotation.x + tempAnnotation.width - handleSize/2, tempAnnotation.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(tempAnnotation.x - handleSize/2, tempAnnotation.y + tempAnnotation.height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(tempAnnotation.x + tempAnnotation.width - handleSize/2, tempAnnotation.y + tempAnnotation.height - handleSize/2, handleSize, handleSize);
  };
  
  const clearTemporaryRect = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAnnotations();
  };
  
  const handleImageLoad = () => {
    if (imageRef.current) {
      imageRef.current.setAttribute('draggable', 'false');
    }
    drawAnnotations();
  };
  
  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    
    annotations.forEach((annotation, index) => {
      const highlight = index === selectedAnnotationIndex;
      ctx.strokeStyle = highlight ? '#00ff00' : '#ff0000';
      ctx.lineWidth = highlight ? 3 : 2;
      ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
      
      ctx.fillStyle = highlight ? '#00ff00' : '#ff0000';
      ctx.font = '12px Arial';
      ctx.fillText(`${annotation.label || ''}`, annotation.x, annotation.y - 5);
      
      if (highlight) {
        const handleSize = 5;
        ctx.fillStyle = '#00ff00';
        
        ctx.fillRect(annotation.x - handleSize/2, annotation.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(annotation.x + annotation.width - handleSize/2, annotation.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(annotation.x - handleSize/2, annotation.y + annotation.height - handleSize/2, handleSize, handleSize);
        ctx.fillRect(annotation.x + annotation.width - handleSize/2, annotation.y + annotation.height - handleSize/2, handleSize, handleSize);
      }
    });
  };
  
  const expandContract = (pixels: number) => {
    if (selectedAnnotationIndex !== -1) {
      const newAnnotations = [...annotations];
      const annotation = newAnnotations[selectedAnnotationIndex];
      
      newAnnotations[selectedAnnotationIndex] = {
        ...annotation,
        x: annotation.x - pixels,
        y: annotation.y - pixels,
        width: annotation.width + (pixels * 2),
        height: annotation.height + (pixels * 2)
      };
      
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
  
  const moveAnnotation = (direction: 'left' | 'right' | 'up' | 'down', pixels: number) => {
    if (selectedAnnotationIndex !== -1) {
      const newAnnotations = [...annotations];
      const annotation = newAnnotations[selectedAnnotationIndex];
      
      switch (direction) {
        case 'left':
          newAnnotations[selectedAnnotationIndex] = { ...annotation, x: annotation.x - pixels };
          break;
        case 'right':
          newAnnotations[selectedAnnotationIndex] = { ...annotation, x: annotation.x + pixels };
          break;
        case 'up':
          newAnnotations[selectedAnnotationIndex] = { ...annotation, y: annotation.y - pixels };
          break;
        case 'down':
          newAnnotations[selectedAnnotationIndex] = { ...annotation, y: annotation.y + pixels };
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
  
  const exportAnnotations = () => {
    if (annotations.length === 0) {
      showAlert('No annotations to export', 'warning');
      return;
    }
    
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${currentImageName}_annotations.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('Annotations exported', 'success');
  };
  
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
  
  return {
    currentImage,
    currentImageName,
    currentDbName,
    progress,
    annotations,
    availableLabels,
    defaultLabel,
    currentLabel,
    aspectRatio,
    imageFilter,
    seekIndex,
    alert,
    currentIndex,
    isDrawing,
    startPoint,
    currentRect,
    selectedAnnotationIndex,
    isDragging,
    isResizing,
    dragStart,
    originalAnnotation,
    resizeHandle,
    imageRef,
    canvasRef,
    containerRef,
    showAlert,
    handleAlertClose,
    loadLabels,
    loadNextImage,
    loadPrevImage,
    deleteCurrentImage,
    updateAnnotations,
    setCurrentLabelTo,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    drawTemporaryRect,
    drawAnnotationsWithTemporaryRect,
    clearTemporaryRect,
    handleImageLoad,
    drawAnnotations,
    expandContract,
    deleteLastAnnotation,
    deleteSelectedAnnotation,
    updateSelectedAnnotationLabel,
    clearAllAnnotations,
    moveAnnotation,
    exportAnnotations,
    duplicateAnnotation,
    setImageFilter,
    setSeekIndex
  };
}
