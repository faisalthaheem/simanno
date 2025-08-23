import React from 'react';
import { TextField, ToggleButtonGroup, ToggleButton, Chip, Button, Box, Typography } from '@mui/material';
import { useAnnotationState } from '../hooks/useAnnotationState';

export default function AnnotationToolbar() {
  const {
    imageFilter,
    seekIndex,
    setImageFilter,
    setSeekIndex,
    availableLabels,
    currentLabel,
    setCurrentLabelTo,
    expandContract,
    deleteLastAnnotation,
    deleteSelectedAnnotation,
    updateSelectedAnnotationLabel,
    clearAllAnnotations,
    moveAnnotation,
    exportAnnotations,
    duplicateAnnotation,
    loadPrevImage,
    loadNextImage,
    currentIndex
  } = useAnnotationState();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField
        size="small"
        placeholder="Image Name"
        value={imageFilter}
        onChange={(e) => setImageFilter(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            // loadNextImage(false, 'name', imageFilter, -1);
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
            // loadNextImage(false, 'seek', seekIndex, -1);
            setSeekIndex('');
          }
        }}
      />
      
      <Button onClick={() => expandContract(5)} variant="outlined" size="small">
        +
      </Button>
      <Button onClick={() => expandContract(-5)} variant="outlined" size="small">
        -
      </Button>
      
      <ToggleButtonGroup
        value={0}
        exclusive
        size="small"
      >
        <ToggleButton value={0}>0.0</ToggleButton>
        <ToggleButton value={1}>1.0</ToggleButton>
        <ToggleButton value={1.3}>1.3</ToggleButton>
      </ToggleButtonGroup>
      
      <Button onClick={exportAnnotations} variant="outlined" color="primary">
        Export
      </Button>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={currentLabel.lbl} />
        {Object.entries(availableLabels).map(([id, label]) => (
          <Button
            key={id}
            size="small"
            variant={currentLabel.id == Number(id) ? "contained" : "outlined"}
            onClick={() => setCurrentLabelTo(Number(id))}
            sx={{ m: 0.5 }}
          >
            {label}
          </Button>
        ))}
      </Box>
      
      <Button onClick={deleteLastAnnotation} variant="outlined" color="warning">
        Delete Last
      </Button>
      <Button onClick={deleteSelectedAnnotation} variant="outlined" color="secondary">
        Delete Selected
      </Button>
      <Button onClick={updateSelectedAnnotationLabel} variant="contained" color="primary">
        Update Label
      </Button>
      <Button onClick={clearAllAnnotations} variant="outlined" color="secondary">
        Clear All
      </Button>
      <Button onClick={duplicateAnnotation} variant="outlined" color="secondary">
        Duplicate
      </Button>
      
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
      
      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
        <Button 
          onClick={() => loadPrevImage()} 
          variant="contained" 
          size="small"
          sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#115293' } }}
        >
          ← Previous
        </Button>
        <Button 
          onClick={() => loadNextImage(false, '', '', currentIndex)} 
          variant="contained" 
          size="small"
          sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#115293' } }}
        >
          Next →
        </Button>
      </Box>
    </Box>
  );
}
