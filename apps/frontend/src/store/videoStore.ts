import { create } from "zustand";
import { toast } from "sonner";
import axios from "axios";
import { BACKEND_URL } from "@/config";

export const VIDEO_QUALITIES = [
  { value: "144p", label: "144p", height: 144 },
  { value: "240p", label: "240p", height: 240 },
  { value: "360p", label: "360p", height: 360 },
  { value: "480p", label: "480p", height: 480 },
  { value: "720p", label: "720p HD", height: 720 },
  { value: "1080p", label: "1080p Full HD", height: 1080 },
  { value: "1440p", label: "1440p 2K", height: 1440 },
  { value: "4K", label: "4K Ultra HD", height: 2160 },
] as const;

export type VideoQuality = (typeof VIDEO_QUALITIES)[number]["value"];

interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
}

interface VideoFile {
  id: string;
  file: File;
  preview: string;
  frame: string | null;
  metadata: VideoMetadata | null;
  inputQuality: VideoQuality | null;
  resolutions: VideoQuality[];
  isProcessing: boolean;
  isUploading: boolean;
  uploadProgress: number;
  abortController?: AbortController;
  returnedVideoId?: string;
}

interface VideoState {
  videoFiles: VideoFile[];
  globalLoading: boolean;

  addVideoFiles: (files: File[]) => void;
  removeVideoFile: (id: string) => void;
  processVideoFile: (id: string) => Promise<void>;
  setVideoResolutions: (id: string, resolutions: VideoQuality[]) => void;
  uploadVideoFile: (id: string) => Promise<void>;
  uploadAllVideos: () => Promise<void>;
  cancelUpload: (id: string) => void;
  resetState: () => void;
}

function getVideoQualityFromDimensions(width: number, height: number): VideoQuality {
  if (width <= 256 && height <= 144) return "144p";
  if (width <= 426 && height <= 240) return "240p";
  if (width <= 640 && height <= 360) return "360p";
  if (width <= 854 && height <= 480) return "480p";
  if (width <= 1280 && height <= 720) return "720p";
  if (width <= 1920 && height <= 1080) return "1080p";
  if (width <= 2560 && height <= 1440) return "1440p";
  return "4K";
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videoFiles: [],
  globalLoading: false,

  addVideoFiles: (files) => {
    const newVideoFiles: VideoFile[] = files.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      frame: null,
      metadata: null,
      inputQuality: null,
      resolutions: [],
      isProcessing: false,
      isUploading: false,
      uploadProgress: 0,
    }));

    set((state) => ({
      videoFiles: [...state.videoFiles, ...newVideoFiles],
    }));

    // Process each video file
    newVideoFiles.forEach((videoFile) => {
      get().processVideoFile(videoFile.id);
    });
  },

  removeVideoFile: (id) => {
    set((state) => {
      const videoFile = state.videoFiles.find((v) => v.id === id);
      if (videoFile) {
        // Cancel upload if in progress
        if (videoFile.isUploading && videoFile.abortController) {
          videoFile.abortController.abort();
        }
        // Revoke object URL to prevent memory leaks
        URL.revokeObjectURL(videoFile.preview);
      }
      return {
        videoFiles: state.videoFiles.filter((v) => v.id !== id),
      };
    });
  },

  processVideoFile: async (id) => {
    const { videoFiles } = get();
    const videoFile = videoFiles.find((v) => v.id === id);
    if (!videoFile) return;

    // Validate file
    let isValid = true;
    if (videoFile.file.size > 300 * 1024 * 1024) {
      isValid = false;
      toast.error("File too large", {
        description: `${videoFile.file.name}: Please upload a file smaller than 300MB`,
      });
    }

    if (videoFile.file.type !== "video/mp4") {
      isValid = false;
      toast.error("Invalid file type", {
        description: `${videoFile.file.name}: Please upload a valid MP4 video file`,
      });
    }

    if (!isValid) {
      get().removeVideoFile(id);
      return;
    }

    // Set processing state
    set((state) => ({
      videoFiles: state.videoFiles.map((v) =>
        v.id === id ? { ...v, isProcessing: true } : v
      ),
    }));

    try {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(videoFile.file);
      video.preload = "metadata";

      const metadataPromise = new Promise<VideoMetadata>((resolve, reject) => {
        video.onloadedmetadata = () => {
          const metadata = {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
          };
          resolve(metadata);
        };
        video.onerror = () => reject(new Error("Failed to load video metadata"));
      });

      const framePromise = new Promise<string>((resolve, reject) => {
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
          resolve(imageUrl);
        });

        video.addEventListener("error", () => reject("Video load error"));
      });

      const [metadata, frame] = await Promise.all([metadataPromise, framePromise]);

      const detectedQuality = getVideoQualityFromDimensions(metadata.width, metadata.height);
      const inputQualityIndex = VIDEO_QUALITIES.findIndex((q) => q.value === detectedQuality);
      const availableQualities = VIDEO_QUALITIES.slice(0, inputQualityIndex + 1).map((q) => q.value);

      set((state) => ({
        videoFiles: state.videoFiles.map((v) =>
          v.id === id
            ? {
                ...v,
                metadata,
                frame,
                inputQuality: detectedQuality,
                resolutions: availableQualities,
                isProcessing: false,
              }
            : v
        ),
      }));

      toast.success("File analyzed", {
        description: `${videoFile.file.name}: Quality detected as ${detectedQuality}`,
      });
    } catch (error) {
      toast.error("Failed to process video", {
        description: `${videoFile.file.name}: An error occurred while extracting metadata`,
      });
      set((state) => ({
        videoFiles: state.videoFiles.map((v) =>
          v.id === id ? { ...v, isProcessing: false } : v
        ),
      }));
    }
  },

  setVideoResolutions: (id, resolutions) => {
    set((state) => ({
      videoFiles: state.videoFiles.map((v) =>
        v.id === id ? { ...v, resolutions } : v
      ),
    }));
  },

  uploadVideoFile: async (id) => {
    const { videoFiles } = get();
    const videoFile = videoFiles.find((v) => v.id === id);
    if (!videoFile || !videoFile.metadata) {
      toast.error("Video not ready for upload");
      return;
    }

    const prePayload = {
      fileType: videoFile.file.type,
      videoId: videoFile.file.name.split(".")[0],
      videoTitle: videoFile.file.name,
      videoSize: videoFile.file.size.toString(),
      videoDuration: videoFile.metadata.duration.toString(),
      resolutions: videoFile.resolutions,
    };

    try {
      // Set uploading state
      const abortController = new AbortController();
      set((state) => ({
        videoFiles: state.videoFiles.map((v) =>
          v.id === id
            ? { ...v, isUploading: true, uploadProgress: 0, abortController }
            : v
        ),
      }));

      const response = await axios.post(
        `${BACKEND_URL}/api/v1/transcoding/preSignedUrl`,
        prePayload,
        { withCredentials: true }
      );

      if (!response) {
        throw new Error(`Failed to get presigned URL for ${videoFile.file.name}`);
      }

      const { url, jobId } = response.data;

      // Update with job ID
      set((state) => ({
        videoFiles: state.videoFiles.map((v) =>
          v.id === id ? { ...v, returnedVideoId: jobId } : v
        ),
      }));

      const uploadResponse = await axios.put(url, videoFile.file, {
        headers: { "Content-Type": videoFile.file.type },
        signal: abortController.signal,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          set((state) => ({
            videoFiles: state.videoFiles.map((v) =>
              v.id === id ? { ...v, uploadProgress: progress } : v
            ),
          }));
        },
        withCredentials: true,
      });

      if (!uploadResponse.status) {
        throw new Error(`Failed to upload ${videoFile.file.name}`);
      }

      toast.success("Upload successful", {
        description: `${videoFile.file.name} uploaded successfully!`,
      });

      // Reset upload state
      set((state) => ({
        videoFiles: state.videoFiles.map((v) =>
          v.id === id
            ? { ...v, isUploading: false, uploadProgress: 0, abortController: undefined }
            : v
        ),
      }));
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      toast.error("Upload failed", {
        description: `${videoFile.file.name}: ${error.message || "Upload error"}`,
      });
      set((state) => ({
        videoFiles: state.videoFiles.map((v) =>
          v.id === id
            ? { ...v, isUploading: false, uploadProgress: 0, abortController: undefined }
            : v
        ),
      }));
    }
  },

  uploadAllVideos: async () => {
    const { videoFiles } = get();
    const readyVideos = videoFiles.filter(
      (v) => !v.isProcessing && !v.isUploading && v.resolutions.length > 0 && v.metadata
    );

    if (readyVideos.length === 0) {
      toast.error("No videos ready for upload");
      return;
    }

    set({ globalLoading: true });

    try {
      await Promise.all(readyVideos.map((video) => get().uploadVideoFile(video.id)));
    } finally {
      set({ globalLoading: false });
    }
  },

  cancelUpload: async (id) => {
    const { videoFiles } = get();
    const videoFile = videoFiles.find((v) => v.id === id);
    
    if (videoFile?.isUploading && videoFile.abortController) {
      videoFile.abortController.abort();
      
      set((state) => ({
        videoFiles: state.videoFiles.map((v) =>
          v.id === id
            ? { ...v, isUploading: false, uploadProgress: 0, abortController: undefined }
            : v
        ),
      }));

      if (videoFile.returnedVideoId) {
        try {
          await axios.put(
            `${BACKEND_URL}/api/v1/transcoding/status/${videoFile.returnedVideoId}`,
            {
              errorMessage: "Upload cancelled by user",
              status: "CANCELED",
            },
            { withCredentials: true }
          );
        } catch (error) {
          console.error("Failed to update cancellation status:", error);
        }
      }

      toast.error("Upload cancelled", {
        description: `${videoFile.file.name} upload has been cancelled.`,
      });
    }
  },

  resetState: () => {
    const { videoFiles } = get();
    // Clean up object URLs
    videoFiles.forEach((video) => {
      URL.revokeObjectURL(video.preview);
      if (video.isUploading && video.abortController) {
        video.abortController.abort();
      }
    });

    set({
      videoFiles: [],
      globalLoading: false,
    });
  },
}));