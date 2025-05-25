"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Upload, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useVideoStore } from "@/store/transcodingStore";
import { BACKEND_URL } from "@/config";
import UploadBox from "./UploadBox";

const VIDEO_QUALITIES = [
  { value: "144p", label: "144p", height: 144 },
  { value: "240p", label: "240p", height: 240 },
  { value: "360p", label: "360p", height: 360 },
  { value: "480p", label: "480p", height: 480 },
  { value: "720p", label: "720p HD", height: 720 },
  { value: "1080p", label: "1080p Full HD", height: 1080 },
  { value: "1440p", label: "1440p 2K", height: 1440 },
  { value: "4K", label: "4K Ultra HD", height: 2160 },
] as const;

type VideoQuality = (typeof VIDEO_QUALITIES)[number]["value"];

const formSchema = z.object({
  resolutions: z
    .array(
      z.enum(["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "4K"])
    )
    .min(1, "Please select at least one resolution"),
});

type FormValues = z.infer<typeof formSchema>;
export function UploadPage() {
  const {
    videoFile,
    videoPreview,
    inputQuality,
    videoMetadata,
    videoFrame,
    setVideoFile,
    setVideoPreview,
    setVideoMetadata,
    setInputQuality,
    getVideoQualityFromDimensions,
    extractFrameFromVideo,
    getVideoMetadata,
    handleFileValidation,
  } = useVideoStore();

  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      resolutions: [],
    },
    resolver: zodResolver(formSchema),
  });
  const watchResolutions = watch("resolutions");

  const handleFileSelected = useCallback(
    async (file: File) => {
      setMediaLoading(true);
      if (handleFileValidation(file)) {
        setVideoFile(file);
        await extractFrameFromVideo(file);
        const videoUrl = URL.createObjectURL(file);
        setVideoPreview(videoUrl);
        try {
          const metadata = await getVideoMetadata(file);
          setVideoMetadata(metadata);
          const detectedQuality = getVideoQualityFromDimensions(
            metadata.width,
            metadata.height
          );
          setInputQuality(detectedQuality);
          // Auto-select resolutions based on input quality
          const inputQualityIndex = VIDEO_QUALITIES.findIndex(
            (q) => q.value === detectedQuality
          );
          const availableQualities = VIDEO_QUALITIES.slice(
            0,
            inputQualityIndex + 1
          ).map((q) => q.value);
          setValue("resolutions", availableQualities);

          toast.success("File analyzed", {
            description: `Video quality detected: ${detectedQuality}. Available resolutions auto-selected.`,
          });
        } catch (error) {
          toast.error("Failed to analyze video", {
            description: "Could not detect video quality",
          });
        } finally {
          setMediaLoading(false);
        }
      }
    },
    [handleFileValidation, setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/mp4": [".mp4"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileSelected(acceptedFiles[0]);
      }
    },
    onDropRejected: () => {
      toast.error("File rejected", {
        description: "Please upload a valid MP4 video file",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!videoFile) {
      toast.error("No file selected", {
        description: "Please select a video file to transcode",
      });
      return;
    }

    setMediaUploading(true);
    toast.loading("Starting transcoding...");
    try {
      const preResponse = await axios.post(
        `${BACKEND_URL}/api/v1/transcoding/preSignedUrl`,
        {
          fileType: videoFile.type,
          videoId: videoFile.name.split(".")[0],
          resolutions: data.resolutions,
          videoDuration: videoMetadata?.duration.toString() || "0",
          videoTitle: videoFile.name,
          videoSize: videoFile.size.toString(),
        },
        {
          withCredentials: true,
        }
      );

      const { url, method } = preResponse.data;
      if (!url || !method) {
        toast.error("Failed to get pre-signed URL");
        console.error("Invalid pre-signed URL response:", preResponse.data);
        return;
      }

      const uploadResponse = await axios({
        method,
        url,
        data: videoFile,
        headers: {
          "Content-Type": videoFile.type,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!
          );
          setUploadProgress(percentCompleted);
          toast.loading(`Uploading video... ${percentCompleted}%`, {
            id: "upload-progress",
          });
        },
      });

      if (uploadResponse.status !== 200) {
        toast.error("Failed to upload video", {
          description: "Please try again",
        });
        console.error("Upload failed:", uploadResponse);
        return;
      }

      toast.success("Transcoding started", {
        description: `Your video is being transcoded to ${data.resolutions.join(", ")}`,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error("Error during transcoding", {
          description: error.message || "Failed to transcode video",
        });
      } else {
        toast.error("Unexpected error", {
          description: "Something went wrong",
        });
      }
    } finally {
      setMediaUploading(false);
      toast.dismiss();
      
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoMetadata(null);
    setInputQuality(null);
    setValue("resolutions", []);
  };

  const handleQualityToggle = (quality: VideoQuality) => {
    if (!inputQuality) return;

    const inputQualityIndex = VIDEO_QUALITIES.findIndex(
      (q) => q.value === inputQuality
    );
    const qualityIndex = VIDEO_QUALITIES.findIndex((q) => q.value === quality);

    // Don't allow selection of qualities higher than input
    if (qualityIndex > inputQualityIndex) return;

    const currentResolutions = watchResolutions || [];
    const isSelected = currentResolutions.includes(quality);

    if (isSelected) {
      setValue(
        "resolutions",
        currentResolutions.filter((r) => r !== quality)
      );
    } else {
      setValue("resolutions", [...currentResolutions, quality]);
    }
  };

  const isQualityDisabled = (quality: VideoQuality): boolean => {
    if (!inputQuality) return false;
    const inputQualityIndex = VIDEO_QUALITIES.findIndex(
      (q) => q.value === inputQuality
    );
    const qualityIndex = VIDEO_QUALITIES.findIndex((q) => q.value === quality);
    return qualityIndex > inputQualityIndex;
  };

  const isQualitySelected = (quality: VideoQuality): boolean => {
    return watchResolutions?.includes(quality) || false;
  };

  return (
    <div
      className={`relative px-2 md:py-8 ${!videoFile ? "max-w-4xl mx-auto" : ""}`}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Ready to transcode your videos?
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload your video file and select transcoding resolutions.
        </p>
      </div>

      {mediaLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {mediaUploading && (
        <UploadBox progress={uploadProgress} loading={mediaUploading} />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`space-y-6 flex gap-6`}
      >
        <div className="w-full">
          {!videoPreview ? (
            <div
              {...getRootProps()}
              className={`h-80 w-full border-2 transition-colors relative ${
                isDragActive
                  ? "border-blue-600 bg-primary/5"
                  : "border-border bg-secondary/30"
              } cursor-pointer flex flex-col items-center justify-center p-6`}
            >
              <input {...getInputProps()} />

              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-2">
                {isDragActive
                  ? "Drop your video file here"
                  : "Drag and drop your MP4 video file here"}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Only MP4 format supported, max 100MB
              </p>
              <Button
                type="button"
                variant="box"
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.createElement("input");
                  input.type = "file";
                  // input.accept = "video/mp4";
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files.length > 0) {
                      handleFileSelected(files[0]);
                    }
                  };
                  input.click();
                }}
              >
                Select Video File
              </Button>
            </div>
          ) : !mediaLoading ? (
            <div>
              <div className="relative h-[28rem] w-full flex items-center justify-center rounded-none">
                {videoFrame ? (
                  <div className="absolute inset-0 z-10 scale- blur-2xl flex items-center justify-center">
                    <img
                      src={videoFrame}
                      alt="Video frame preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="box"
                  className="absolute top-2 right-2 z-30"
                  onClick={clearVideo}
                >
                  Remove
                </Button>
                <video
                  src={videoPreview}
                  controls
                  className="w-full relative z-20 h-full object-cover bg-black/90 backdrop-blur-3xl rounded-2xl"
                />
              </div>
              <div className="bg-secondary/30 my-4 border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Selected file: {videoFile?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Size:{" "}
                      {videoFile
                        ? (videoFile.size / (1024 * 1024)).toFixed(2)
                        : 0}{" "}
                      MB
                    </p>
                  </div>
                  {videoMetadata && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        Input Quality: {inputQuality}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {videoMetadata.width} × {videoMetadata.height}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative z-20">
          {!mediaLoading && videoFile && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Select Output Resolutions
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {inputQuality &&
                    `Based on your ${inputQuality} input video, higher qualities are disabled. Lower qualities are auto-selected.`}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {VIDEO_QUALITIES.map((quality) => {
                    const disabled = isQualityDisabled(quality.value);
                    const selected = isQualitySelected(quality.value);

                    return (
                      <button
                        key={quality.value}
                        type="button"
                        onClick={() => handleQualityToggle(quality.value)}
                        disabled={disabled}
                        className={`
                        relative p-4 border rounded-lg transition-all duration-200 text-left
                        ${
                          disabled
                            ? "border-muted bg-muted/50 backdrop-blur-sm text-muted-foreground cursor-not-allowed opacity-50"
                            : selected
                              ? "border-2 bg-secondary/40 text-primary shadow-sm"
                              : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                        }
                      `}
                      >
                        {selected && !disabled && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}

                        <div className="font-medium text-sm mb-1">
                          {quality.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {quality.height}p resolution
                        </div>

                        {disabled && (
                          <div className="text-xs text-muted-foreground mt-1 font-medium">
                            Not available
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {errors.resolutions && (
                  <p className="text-sm text-red-500 mt-3">
                    {errors.resolutions.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  !videoFile || !watchResolutions?.length || mediaUploading
                }
              >
                Transcode Video
                {watchResolutions?.length > 0 && (
                  <span className="ml-2">
                    ({watchResolutions.length} resolution
                    {watchResolutions.length > 1 ? "s" : ""})
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
