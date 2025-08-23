import React from 'react';
import Head from 'next/head';
import { Box, Button, Typography, Paper, Grid, Snackbar, Alert, AppBar, Toolbar } from '@mui/material';
import { useAnnotationState } from '../hooks/useAnnotationState';
import AnnotationToolbar from '../components/AnnotationToolbar';
import AnnotationCanvas from '../components/AnnotationCanvas';

export default function AnnotationPage() {
  const {
    currentImage,
    currentImageName,
    currentDbName,
    progress,
    alert,
    handleAlertClose,
    handleImageLoad,
    imageRef,
    containerRef,
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    expandContract,
    deleteLastAnnotation,
    deleteSelectedAnnotation,
    updateSelectedAnnotationLabel,
    clearAllAnnotations,
    moveAnnotation,
    exportAnnotations,
    duplicateAnnotation
  } = useAnnotationState();

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
        
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <AnnotationToolbar />
          </Toolbar>
        </AppBar>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <div 
                ref={containerRef}
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
                  style={{ maxWidth: '100%', height: 'auto', userSelect: 'none', pointerEvents: 'none' }}
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
              </div>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            [{currentImageName}] of {currentDbName}
          </Typography>
          <Typography variant="body2">
            Progress: {progress}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
