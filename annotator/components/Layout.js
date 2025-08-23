import React from 'react';
import Head from 'next/head';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';

const Layout = ({ children }) => {
  return (
    <>
      <Head>
        <title>Image Annotation Tool</title>
        <meta name="description" content="Image annotation tool for creating bounding boxes" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Image Annotation Tool
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout;