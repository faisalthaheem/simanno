import React from 'react';
import Head from 'next/head';
import { Box, Typography, Container } from '@mui/material';
import Testimonials from '../components/Testimonials';

const TestimonialsPage = () => {
  return (
    <>
      <Head>
        <title>Testimonials | Image Annotation Tool</title>
        <meta name="description" content="See what our users say about our image annotation tool" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            User Testimonials
          </Typography>
          <Typography variant="h5" color="text.secondary">
            Discover why professionals choose our annotation tool
          </Typography>
        </Box>

        <Testimonials />
      </Container>
    </>
  );
};

export default TestimonialsPage;