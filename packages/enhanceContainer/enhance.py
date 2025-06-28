import os
import cv2
import boto3
import redis
import json
import logging
from pathlib import Path
from realesrgan import RealESRGAN
import subprocess

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize AWS and Redis clients
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'ap-south-1')
)
redis_client = redis.Redis.from_url(os.getenv('REDIS_URL'))

def publish_to_redis(data):
    """Publish status to Redis, matching Node.js container's logging."""
    try:
        redis_client.publish('transcoding', json.dumps(data))
        logger.info(f"Published to Redis: {data}")
    except Exception as e:
        logger.error(f"Failed to publish to Redis: {e}")

def enhance_resolution(video_id, input_bucket, input_key, output_bucket, resolution_name):
    """Download video from S3, enhance resolution with Real-ESRGAN, and upload to S3."""
    try:
        # Validate environment variables
        required_env_vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'REDIS_URL']
        for var in required_env_vars:
            if not os.getenv(var):
                raise ValueError(f"Missing environment variable: {var}")

        # Step 1: Download video from S3
        input_path = f"/tmp/input-{video_id}.mp4"
        logger.info(f"Downloading video: s3://{input_bucket}/{input_key}")
        publish_to_redis({
            'logLevel': 'INFO',
            'logMessage': f"Downloading video for enhancement: {video_id}",
            'videoId': video_id
        })
        s3_client.download_file(input_bucket, input_key, input_path)

        # Step 2: Extract frames
        frame_dir = Path(f"/tmp/frames-{video_id}")
        frame_dir.mkdir(exist_ok=True)
        cap = cv2.VideoCapture(input_path)
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            cv2.imwrite(str(frame_dir / f"frame-{frame_count:04d}.png"), frame)
            frame_count += 1
        cap.release()
        logger.info(f"Extracted {frame_count} frames")
        publish_to_redis({
            'logLevel': 'INFO',
            'logMessage': f"Extracted {frame_count} frames for {resolution_name}",
            'videoId': video_id
        })

        # Step 3: Enhance frames with Real-ESRGAN on CPU
        model = RealESRGAN(device='cpu', model_name='RealESRGAN_x4plus')
        logger.info(f"Loaded Real-ESRGAN model for {resolution_name}")
        enhanced_dir = Path(f"/tmp/enhanced-{video_id}")
        enhanced_dir.mkdir(exist_ok=True)
        for i in range(frame_count):
            frame_path = str(frame_dir / f"frame-{i:04d}.png")
            frame = cv2.imread(frame_path)
            enhanced_frame = model.enhance(frame)[0]  # 4x super-resolution
            cv2.imwrite(str(enhanced_dir / f"frame-{i:04d}.png"), enhanced_frame)
            if i % 10 == 0:  # Log less frequently for CPU
                logger.info(f"Enhanced {i}/{frame_count} frames")
                publish_to_redis({
                    'logLevel': 'INFO',
                    'logMessage': f"Enhanced {i}/{frame_count} frames for {resolution_name}",
                    'videoId': video_id
                })

        # Step 4: Re-encode enhanced frames to video
        output_path = f"/tmp/enhanced-{video_id}-{resolution_name}.mp4"
        cmd = [
            'ffmpeg', '-i', f'{enhanced_dir}/frame-%04d.png',
            '-c:v', 'libx264', '-r', '30',
            '-pix_fmt', 'yuv420p', output_path
        ]
        subprocess.run(cmd, check=True)
        logger.info(f"Re-encoded enhanced frames to {output_path}")
        publish_to_redis({
            'logLevel': 'INFO',
            'logMessage': f"Re-encoded enhanced video for {resolution_name}",
            'videoId': video_id
        })

        # Step 5: Upload enhanced video to S3
        output_key = f"videos/{video_id}/enhanced/{resolution_name}.mp4"
        s3_client.upload_file(
            output_path, output_bucket, output_key, ExtraArgs={'ContentType': 'video/mp4'}
        )
        logger.info(f"Uploaded enhanced video: s3://{output_bucket}/{output_key}")
        publish_to_redis({
            'logLevel': 'INFO',
            'logMessage': f"Enhancement completed for {resolution_name}",
            'videoId': video_id,
            'outputKey': output_key
        })

        # Step 6: Clean up
        os.remove(input_path)
        for frame in frame_dir.glob("*.png"):
            frame.unlink()
        for frame in enhanced_dir.glob("*.png"):
            frame.unlink()
        os.remove(output_path)
        frame_dir.rmdir()
        enhanced_dir.rmdir()
        logger.info("Cleaned up temporary files")

    except Exception as e:
        logger.error(f"Enhancement failed for {resolution_name}: {e}")
        publish_to_redis({
            'logLevel': 'ERROR',
            'logMessage': f"Enhancement failed for {resolution_name}: {str(e)}",
            'videoId': video_id
        })
        raise

if __name__ == "__main__":
    # Validate environment variables
    required_env_vars = ["BUCKET_NAME", "KEY", "VIDEO_ID", "FINAL_BUCKET_NAME", "RESOLUTION"]
    for var in required_env_vars:
        if not os.getenv(var):
            logger.error(f"Missing environment variable: {var}")
            exit(1)

    # Run enhancement
    enhance_resolution(
        video_id=os.getenv("VIDEO_ID"),
        input_bucket=os.getenv("BUCKET_NAME"),
        input_key=os.getenv("KEY"),
        output_bucket=os.getenv("FINAL_BUCKET_NAME"),
        resolution_name=os.getenv("RESOLUTION")
    )