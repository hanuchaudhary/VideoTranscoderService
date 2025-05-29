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

interface VideoState {
  returnedVideoId?: string;
  videoFile: File | null;
  videoPreview: string | null;
  videoFrame: string | null;
  videoMetadata: VideoMetadata | null;
  inputQuality: VideoQuality | null;
  resolutions: VideoQuality[];
  videoLoading: boolean;
  isUploadingMedia: boolean;
  uploadProgress: number;
  abortController?: AbortController;

  cancelUpload?: () => void;
  processVideoSelection: (file: File) => void;
  handleFileUpload: () => void;
  setResolutions: (res: VideoQuality[]) => void;
  resetState: () => void;
}

function getVideoQualityFromDimensions(width: number, height: number) {
  if (width <= 256 && height <= 144) return "144p";
  if (width <= 426 && height <= 240) return "240p";
  if (width <= 640 && height <= 360) return "360p";
  if (width <= 854 && height <= 480) return "480p";
  if (width <= 1280 && height <= 720) return "720p";
  if (width <= 1920 && height <= 1080) return "1080p";
  if (width <= 2560 && height <= 1440) return "1440p";
  return "4K";
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videoPreview: null,
  videoFrame: null,
  videoMetadata: null,
  inputQuality: null,
  resolutions: [],
  videoLoading: false,
  isUploadingMedia: false,
  uploadProgress: 0,
  videoFile: null,
  abortController: new AbortController(),

  setResolutions: (res) => {
    set({ resolutions: res });
  },
  processVideoSelection: async (file) => {
    if (!file) {
      toast.error("No file selected", {
        description: "Please select a video file",
      });
      return;
    }

    set({ videoLoading: true });
    let isValid = true;
    if (file.size > 300 * 1024 * 1024) {
      // 300MB limit TODO: Adjust if needed
      isValid = false;
      toast.error("File too large", {
        description: "Please upload a file smaller than 300MB",
      });
    }

    if (file.type !== "video/mp4") {
      // MP4 format check TODO: Add more formats if needed
      isValid = false;
      toast.error("Invalid file type", {
        description: "Please upload a valid MP4 video file",
      });
    }

    // TODO: Check the duration of the video for paid plans
    if (!isValid) {
      set({ videoFile: null });
      return;
    }

    set({ videoFile: file });

    const videoUrl = URL.createObjectURL(file);
    set({ videoPreview: videoUrl });

    try {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
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
        video.onerror = () =>
          reject(new Error("Failed to load video metadata"));
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

      const [metadata, frame] = await Promise.all([
        metadataPromise,
        framePromise,
      ]);

      const quality = (() => {
        if (metadata.width <= 256 && metadata.height <= 144) return "144p";
        if (metadata.width <= 426 && metadata.height <= 240) return "240p";
        if (metadata.width <= 640 && metadata.height <= 360) return "360p";
        if (metadata.width <= 854 && metadata.height <= 480) return "480p";
        if (metadata.width <= 1280 && metadata.height <= 720) return "720p";
        if (metadata.width <= 1920 && metadata.height <= 1080) return "1080p";
        if (metadata.width <= 2560 && metadata.height <= 1440) return "1440p";
        return "4K";
      })();

      const detectedQuality = getVideoQualityFromDimensions(
        metadata.width,
        metadata.height
      );
      const inputQualityIndex = VIDEO_QUALITIES.findIndex(
        (q) => q.value === detectedQuality
      );
      const availableQualities = VIDEO_QUALITIES.slice(
        0,
        inputQualityIndex + 1
      ).map((q) => q.value);
      set({ resolutions: availableQualities });

      toast.success("File analyzed", {
        description: `Video quality detected: ${detectedQuality}. Available resolutions auto-selected.`,
      });

      set({
        videoMetadata: metadata,
        videoFrame: frame,
        inputQuality: quality,
      });
    } catch (error) {
      toast.error("Failed to process video", {
        description: "An error occurred while extracting metadata or frame",
      });
      set({ videoFile: null, videoMetadata: null, videoFrame: null });
    } finally {
      set({
        videoLoading: false,
      });
    }
  },
  resetState: () => {
    set({
      videoFile: null,
      videoPreview: null,
      videoFrame: null,
      videoMetadata: null,
      inputQuality: null,
      resolutions: [],
      videoLoading: false,
      isUploadingMedia: false,
      uploadProgress: 0,
    });
  },
  handleFileUpload: async () => {
    const { videoFile } = get();
    if (!videoFile) {
      toast.error("No video file selected", {
        description: "Please select a video file to upload",
      });
      return;
    }

    const prePayload = {
      fileType: videoFile.type,
      videoId: videoFile.name.split(".")[0],
      videoTitle: videoFile.name,
      videoSize: videoFile.size.toString(),
      videoDuration: get().videoMetadata?.duration.toString() || "0",
      resolutions: get().resolutions,
    };

    try {
      set({
        isUploadingMedia: true,
        uploadProgress: 0,
      });
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/transcoding/preSignedUrl`,
        {
          ...prePayload,
        },
        {
          withCredentials: true,
        }
      );

      if (!response) {
        throw new Error(`Failed to get presigned URL for ${videoFile.name}`);
      }

      set({
        abortController: new AbortController(),
      });

      const { url, jobId } = response.data;
      set({ returnedVideoId: jobId });
      const uploadResponse = await axios.put(url, videoFile, {
        headers: {
          "Content-Type": videoFile.type,
        },
        signal: get().abortController?.signal,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          toast.loading(`Uploading ${videoFile.name}: ${progress}%`, {
            id: "upload-progress",
          });
          set({ uploadProgress: progress });
        },
        withCredentials: true,
      });

      if (!uploadResponse.status) {
        toast.error("Upload failed", {
          description: "An error occurred while uploading the video",
        });
        set({
          isUploadingMedia: false,
          uploadProgress: 0,
        });
        throw new Error(`Failed to upload ${videoFile.name}`);
      }

      toast.success("Upload successful", {
        description: `Video ${videoFile.name} uploaded successfully!`,
      });
      toast.dismiss("upload-progress");
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      toast.error("Upload failed", {
        description:
          error.message || "An error occurred while uploading the video",
      });
    } finally {
      set({
        isUploadingMedia: false,
        uploadProgress: 0,
      });
    }
  },
  cancelUpload: async () => {
    const { abortController, isUploadingMedia } = get();
    if (isUploadingMedia && abortController) {
      abortController.abort();
      toast.error("Upload cancelled", {
        description: "The video upload has been cancelled.",
      });
      set({
        isUploadingMedia: false,
        uploadProgress: 0,
        abortController: undefined,
      });

      await axios.put(
        `${BACKEND_URL}/api/v1/transcoding/status/${get().returnedVideoId}`,
        {
          errorMessage: "Upload cancelled by user",
          status: "CANCELED",
        },
        {
          withCredentials: true,
        }
      );

      toast.dismiss("upload-progress");
    }
  },
}));
