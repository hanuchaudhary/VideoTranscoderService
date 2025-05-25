// stores/videoStore.ts
import { create } from "zustand";
import { toast } from "sonner";

export type VideoQuality =
  | "144p"
  | "240p"
  | "360p"
  | "480p"
  | "720p"
  | "1080p"
  | "1440p"
  | "4K";

export const VIDEO_QUALITIES: { value: VideoQuality; label: string; height: number }[] = [
  { value: "144p", label: "144p", height: 144 },
  { value: "240p", label: "240p", height: 240 },
  { value: "360p", label: "360p", height: 360 },
  { value: "480p", label: "480p", height: 480 },
  { value: "720p", label: "720p HD", height: 720 },
  { value: "1080p", label: "1080p Full HD", height: 1080 },
  { value: "1440p", label: "1440p 2K", height: 1440 },
  { value: "4K", label: "4K Ultra HD", height: 2160 },
];

interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
}

interface VideoState {
  videoFile: File | null;
  videoPreview: string | null;
  videoFrame: string | null;
  videoMetadata: VideoMetadata | null;
  inputQuality: VideoQuality | null;
  setVideoFile: (file: File | null) => void;
  setVideoPreview: (url: string | null) => void;
  setVideoMetadata: (meta: VideoMetadata | null) => void;
  setInputQuality: (q: VideoQuality | null) => void;
  setVideoFrame: (frame: string | null) => void;
  extractFrameFromVideo: (file: File) => Promise<string>;
  getVideoMetadata: (file: File) => Promise<VideoMetadata>;
  handleFileValidation: (file: File) => boolean;
  getVideoQualityFromDimensions: (width: number, height: number) => VideoQuality;
}

export const useVideoStore = create<VideoState>((set) => ({
  videoFile: null,
  videoPreview: null,
  videoFrame: null,
  videoMetadata: null,
  inputQuality: null,

  setVideoFile: (file) => set({ videoFile: file }),
  setVideoPreview: (url) => set({ videoPreview: url }),
  setVideoMetadata: (meta) => set({ videoMetadata: meta }),
  setInputQuality: (q) => set({ inputQuality: q }),
  setVideoFrame: (frame) => set({ videoFrame: frame }),

  getVideoQualityFromDimensions: (width, height) => {
    if (width <= 256 && height <= 144) return "144p";
    if (width <= 426 && height <= 240) return "240p";
    if (width <= 640 && height <= 360) return "360p";
    if (width <= 854 && height <= 480) return "480p";
    if (width <= 1280 && height <= 720) return "720p";
    if (width <= 1920 && height <= 1080) return "1080p";
    if (width <= 2560 && height <= 1440) return "1440p";
    return "4K";
  },

  extractFrameFromVideo: (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      video.addEventListener("loadeddata", () => {
        video.currentTime = 5;
      });

      video.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Failed to get canvas context");

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL("image/png");
        set({ videoFrame: imageUrl });
        resolve(imageUrl);
      });

      video.addEventListener("error", () => reject("Video load error"));
    });
  },

  getVideoMetadata: (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const metadata = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        };
        set({ videoMetadata: metadata });
        URL.revokeObjectURL(video.src);
        resolve(metadata);
      };

      video.onerror = () => {
        reject(new Error("Failed to load video metadata"));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  },

  handleFileValidation: (file) => {
    // if (file.type !== "video/mp4") {
    //   toast.error("Invalid file type", {
    //     description: "Please upload a valid MP4 video file",
    //   });
    //   return false;
    // }

    if (file.size > 300 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 300MB",
      });
      return false;
    }

    return true;
  },
}));
