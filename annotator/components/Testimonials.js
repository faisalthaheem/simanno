import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Avatar, 
  Rating,
  styled
} from '@mui/material';

const testimonials = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'AI Researcher',
    company: 'Tech Innovations Inc.',
    rating: 5,
    content: 'This annotation tool has significantly improved our dataset preparation process. The bounding box accuracy and ease of use are unmatched in the industry.'
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Computer Vision Engineer',
    company: 'Vision Systems Ltd.',
    rating: 5,
    content: 'As someone who works with image datasets daily, I appreciate how intuitive and efficient this tool is. It\'s become an essential part of our workflow.'
  },
  {
    id: 3,
    name: 'Michael Chen',
    role: 'Data Science Lead',
    company: 'Deep Learning Solutions',
    rating: 4,
    content: 'The precision and speed of this annotation tool are impressive. It has reduced our annotation time by 60% while maintaining high-quality standards.'
  }
];

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
}));

const TestimonialAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  marginRight: theme.spacing(2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontSize: '1.2rem',
  fontWeight: 'bold',
}));

const Testimonials = () => {
  return (
    <Box sx={{ py: 8, px: 2, backgroundColor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography 
          variant="h4" 
          align="center" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold', 
            color: 'text.primary',
            mb: 1 
          }}
        >
          What Our Users Say
        </Typography>
        <Typography 
          variant="h6" 
          align="center" 
          color="text.secondary" 
          sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
        >
          Join thousands of professionals who trust our annotation tool for their computer vision projects
        </Typography>
        
        <Grid container spacing={4}>
          {testimonials.map((testimonial) => (
            <Grid item xs={12} md={4} key={testimonial.id}>
              <StyledCard>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TestimonialAvatar>
                      {testimonial.name.charAt(0)}
                    </TestimonialAvatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}, {testimonial.company}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Rating value={testimonial.rating} readOnly size="small" />
                  </Box>
                  
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                    "{testimonial.content}"
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Testimonials;