FROM ubuntu:20.04

# Set non-interactive frontend for apt-get
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies with pinned versions
RUN pip3 install \
    torch \
    torchvision \
    opencv-python-headless \
    basicsr \
    realesrgan \
    boto3 \
    redis \
    numpy

# Copy AI processing script
COPY enhance.py /app/enhance.py
WORKDIR /app

# Command to run the AI processing script
CMD ["python3", "enhance.py"]