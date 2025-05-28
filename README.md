# Voxer - Video Transcoding Service [beta]

## Overview

**Voxer** is a scalable, cloud-based video transcoding service designed to empower **Content Creators**, **Businesses**, and **Developers** to process videos efficiently. Whether you're a YouTuber needing multiple resolutions for your audience, a business preparing training videos, or a developer building a media platform, Voxer delivers fast, secure, and reliable video transcoding with a seamless user experience.

Built with a modern tech stack, Voxer leverages **AWS services** and **real-time logging** to transcode videos into various resolutions (e.g., 144p to 4K) in ~2 minutes for a 150 MB video, supporting use cases across **Free**, **Basic**, **Pro**, and **Enterprise** plans.

---

## Key Features

- **Multi-Resolution Transcoding**  
  Transcode videos into user-selected resolutions (e.g., 144p, 360p, 720p, 1080p, 4K) with **FFmpeg**, optimized for different pricing tiers (e.g., Free users limited to 360p, Enterprise up to 4K).

- **Real-Time Progress Updates**  
  View live transcoding logs (e.g., `Transcoding 720p: 5% complete`) via **WebSocket** and **Redis Pub/Sub**, ensuring users stay informed during the ~2-minute process.

- **Secure Downloads with CloudFront**  
  Download transcoded videos via **signed CloudFront URLs** with dynamic expiration (e.g., 1 hour for Free users, 7 days for Enterprise), ensuring low-latency and secure access globally.

- **Streaming Previews (Pro/Enterprise)**  
  Preview videos before downloading using **HLS streaming**, served via CloudFront (exclusive to Pro and Enterprise plans).

---

## Tiered Pricing Plans

| Plan       | Max Resolution | Download Expiration | Streaming Preview | Bulk Processing |
|------------|----------------|----------------------|-------------------|-----------------|
| Free       | 360p           | 1 hour               | ❌                | ❌              |
| Basic      | 720p           | 1 day                | ❌                | ❌              |
| Pro        | 1080p          | 3 days               | ✅                | ❌              |
| Enterprise | 4K             | 7 days               | ✅                | ✅              |

---

## User Dashboard

A **React-based dashboard** with tabs for:

- Viewing real-time logs  
- Downloading transcoded videos  
- Previewing streams (for eligible plans)  

---

## Scalable Architecture

Voxer is built on a robust, cloud-native architecture using **AWS services** and **modern JavaScript technologies**:

- **Frontend**:  
  - React with TypeScript  
  - `socket.io-client` for real-time log updates  
  - `axios` for API requests  
  - Responsive UI with auto-scrolling logs and export info (resolution, file size, completion time, thumbnails)

- **Backend**:  
  - Express.js (Node.js) with TypeScript  
  - API routes, WebSocket connections (socket.io)  
  - Redis Pub/Sub for log distribution

- **Transcoding**:  
  - ECS Fargate tasks running FFmpeg containers  
  - Triggered by SQS messages from S3 uploads  
  - Scales to process multiple jobs concurrently

---

## Storage

- **S3**: Stores raw and transcoded videos (`raw-transcoder-videos`, `final-bucket`), and thumbnails for previews.
- **CloudFront**: Serves transcoded videos and HLS streams with **signed URLs** for secure, low-latency access.

---

## Database

- **PostgreSQL** via **Drizzle ORM** for persisting:
  - User data  
  - Transcoding jobs (`transcodingJobs`)  
  - Logs (`jobLogs`)

---

## Real-Time Messaging

- **Redis Pub/Sub**:  
  - Decouples log publishing (from ECS tasks) and consumption (by backend)  
  - Handles ~1,333 logs/second for 1,000 concurrent jobs

- **WebSocket**:  
  - Pushes logs to clients in real-time  
  - Uses `job:${jobId}` rooms for efficient delivery

- **Queueing**:  
  - SQS polls S3 events to trigger ECS tasks  
  - Ensures reliable job processing

---

## Performance

- Transcodes a 150 MB video into all formats (144p to 4K) in ~2 minutes using ECS Fargate
- Supports:
  - ~160 logs per job (progress updates every 5% per resolution)  
  - ~1,333 logs/second for 1,000 concurrent jobs
- WebSocket and Redis Pub/Sub ensure **real-time log delivery** with **minimal latency**

---

## Target Audience

- **Content Creators**: YouTubers, streamers, educators needing various resolutions (e.g., Instagram: 720p, YouTube: 1080p)
- **Businesses**: Training and marketing videos with secure downloads and bulk processing (Enterprise)
- **Developers**: API-driven workflows for media platforms using Voxer’s scalable pipeline

---

## Business Value

- **Efficiency**: Transcodes videos in ~2 minutes, with real-time feedback to keep users engaged
- **Scalability**: Handles thousands of concurrent users, supporting global Enterprise clients
- **Security**: Signed CloudFront URLs and authentication ensure secure access
- **Upsell Opportunities**: Tiered plans promote upgrades (e.g., Free → Pro for 1080p and previews)
- **User Experience**: Clean dashboard with thumbnails, sizes, previews — driving retention and satisfaction
