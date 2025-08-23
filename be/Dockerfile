FROM python:3.8-alpine

# Install system dependencies required for Python packages
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    jpeg-dev \
    zlib-dev \
    freetype-dev \
    lcms2-dev \
    openjpeg-dev \
    tiff-dev \
    tk-dev \
    tcl-dev \
    harfbuzz-dev \
    fribidi-dev

# Create application directory structure
WORKDIR /app
RUN mkdir -p /app/db /app/images

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Expose port (FastAPI runs on port 8000 by default)
EXPOSE 8000

# Set environment variables for directory structure
ENV DB_PATH=/app/db
ENV IMAGE_PATH=/app/images

# Run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]