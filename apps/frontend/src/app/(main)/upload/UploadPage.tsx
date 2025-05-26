"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useVideoStore,
  VIDEO_QUALITIES,
  VideoQuality,
} from "@/store/videoStore";
import UploadBox from "./UploadBox";
import Link from "next/link";

export function UploadPage() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const {
    videoFile,
    videoPreview,
    inputQuality,
    videoMetadata,
    videoFrame,
    handleFileUpload,
    processVideoSelection,
    isUploadingMedia,
    uploadProgress,
    videoLoading,
    resolutions,
    setResolutions,
    resetState,
  } = useVideoStore();

  // Drag and drop functionality
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/mp4": [".mp4"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processVideoSelection(acceptedFiles[0]);
      }
    },
    onDropRejected: () => {
      toast.error("File rejected", {
        description: "Please upload a valid MP4 video file",
      });
    },
  });

  // Resolution selection logic
  const handleQualityToggle = (quality: VideoQuality) => {
    if (!inputQuality) return;
    const inputQualityIndex = VIDEO_QUALITIES.findIndex(
      (q) => q.value === inputQuality
    );

    const qualityIndex = VIDEO_QUALITIES.findIndex((q) => q.value === quality);

    if (qualityIndex < inputQualityIndex) {
      if (resolutions.includes(quality)) {
        setResolutions(resolutions.filter((q) => q !== quality));
        toast.info(`Unselected ${quality} resolution`);
      } else {
        setResolutions([...resolutions, quality]);
        toast.success(`Selected ${quality} resolution`);
      }
    } else {
      toast.error(
        `Cannot select ${quality} resolution. Higher qualities are disabled.`
      );
    }
  };

  // Check if a quality is disabled based on input quality
  const isQualityDisabled = (quality: VideoQuality): boolean => {
    if (!inputQuality) return false;
    const inputQualityIndex = VIDEO_QUALITIES.findIndex(
      (q) => q.value === inputQuality
    );
    const qualityIndex = VIDEO_QUALITIES.findIndex((q) => q.value === quality);
    return qualityIndex > inputQualityIndex;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processVideoSelection(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className={`relative px-2 md:py-8 ${!videoFile ? "max-w-4xl mx-auto" : ""}`}
    >
      <div className="flex items-center mb-4 text-xs select-none">
        <Link
          className="hover:text-foreground text-muted-foreground transition-colors border-b border-primary/70 hover:border-primary leading-4 uppercase"
          href={`/dashboard`}
        >
          Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Ready to transcode your videos?
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload your video file and select transcoding resolutions.
        </p>
      </div>

      {videoLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isUploadingMedia && <UploadBox />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFileUpload();
        }}
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

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/jpeg,image/png,image/gif,video/mp4"
                className="hidden"
                disabled={isUploadingMedia}
              />
              <Button
                type="button"
                variant="box"
                onClick={() => fileInputRef.current?.click()}
                disabled={videoLoading}
              >
                Select Video File
              </Button>
            </div>
          ) : !videoLoading ? (
            <div>
              <div className="relative h-[28rem] w-full flex items-center justify-center rounded-none">
                {videoFrame ? (
                  <div className="absolute inset-0 z-10 blur-2xl flex items-center justify-center">
                    <img
                      src={videoFrame}
                      alt="Video frame preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <Button
                  type="button"
                  size={"sm"}
                  variant="outline"
                  className="absolute top-2 right-2 z-30 rounded-[8px] bg-secondary/30 hover:bg-secondary/40 backdrop-blur-sm border-secondary/30"
                  onClick={() => {
                    resetState();
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
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
          {!videoLoading && videoFile && (
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
                    const selected = resolutions.includes(quality.value);

                    return (
                      <button
                        key={quality.value}
                        type="button"
                        onClick={() => handleQualityToggle(quality.value)}
                        disabled={disabled}
                        className={`
                        relative p-4 border cursor-pointer rounded-lg transition-all duration-200 text-left
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
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  !videoFile ||
                  isUploadingMedia ||
                  videoLoading ||
                  resolutions.length === 0
                }
              >
                Transcode Video
                {resolutions?.length > 0 && (
                  <span className="">
                    ({resolutions.length} resolution
                    {resolutions.length > 1 ? "s" : ""})
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
