"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useVideoStore,
  VIDEO_QUALITIES,
  VideoQuality,
} from "@/store/videoStore";
import Link from "next/link";
import { VideoPopup } from "@/components/ui/videoPopup";
import { IconCloudUpload, IconTrashXFilled } from "@tabler/icons-react";

export function UploadPage() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const {
    videoFiles,
    globalLoading,
    addVideoFiles,
    removeVideoFile,
    setVideoResolutions,
    uploadVideoFile,
    uploadAllVideos,
    cancelUpload,
    resetState,
  } = useVideoStore();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/mp4": [".mp4"],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        addVideoFiles(acceptedFiles);
      }
    },
    onDropRejected: () => {
      toast.error("Files rejected", {
        description: "Please upload valid MP4 video files",
      });
    },
  });

  const handleQualityToggle = (videoId: string, quality: VideoQuality) => {
    const video = videoFiles.find((v) => v.id === videoId);
    if (!video?.inputQuality) return;

    const inputQualityIndex = VIDEO_QUALITIES.findIndex(
      (q) => q.value === video.inputQuality
    );
    const qualityIndex = VIDEO_QUALITIES.findIndex((q) => q.value === quality);

    if (qualityIndex < inputQualityIndex) {
      const newResolutions = video.resolutions.includes(quality)
        ? video.resolutions.filter((q) => q !== quality)
        : [...video.resolutions, quality];

      setVideoResolutions(videoId, newResolutions);

      // toast.info(
      //   video.resolutions.includes(quality)
      //     ? `Unselected ${quality} for ${video.file.name}`
      //     : `Selected ${quality} for ${video.file.name}`
      // );
    } else {
      toast.error(
        `Cannot select ${quality} resolution for ${video.file.name}. Higher qualities are disabled.`
      );
    }
  };

  const isQualityDisabled = (
    videoId: string,
    quality: VideoQuality
  ): boolean => {
    const video = videoFiles.find((v) => v.id === videoId);
    if (!video?.inputQuality) return false;

    const inputQualityIndex = VIDEO_QUALITIES.findIndex(
      (q) => q.value === video.inputQuality
    );
    const qualityIndex = VIDEO_QUALITIES.findIndex((q) => q.value === quality);
    return qualityIndex >= inputQualityIndex;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      addVideoFiles(filesArray);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalReadyVideos = videoFiles.filter(
    (v) => !v.isProcessing && v.resolutions.length > 0 && v.metadata
  ).length;

  const totalUploading = videoFiles.filter((v) => v.isUploading).length;

  return (
    <div className="relative px-2 md:py-8 max-w-7xl mx-auto">
      <div className="flex items-center mb-4 text-xs select-none">
        <Link
          className="hover:text-foreground text-muted-foreground transition-colors border-b border-primary/70 hover:border-primary leading-4 uppercase"
          href={`/dashboard`}
        >
          Dashboard
        </Link>
      </div>

      <div className="mb-8 flex md: items-center justify-between">
        <div>
          <h1 className="md:text-2xl text- font-semibold">
            Ready to transcode your videos?
          </h1>
          <p className="text-sm md:block hidden text-muted-foreground">
            Upload multiple video files and select transcoding resolutions for
            each.
          </p>
        </div>
        {videoFiles.length > 0 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              multiple
              accept="video/mp4"
              className="hidden"
              disabled={globalLoading}
            />
            <Button
              type="button"
              variant="default"
              size={"sm"}
              onClick={() => fileInputRef.current?.click()}
              disabled={globalLoading}
            >
              Select Video Files
            </Button>
          </div>
        )}
      </div>

      {globalLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}


      <div className="space-y-6">
        {videoFiles.length === 0 && (
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <div
              className={`relative z-20 flex flex-col items-center justify-center h-80 border-2 dark:border-border border-neutral-300/50 font-mono ${
                isDragActive
                  ? "border-blue-600 bg-primary/5"
                  : "border-border bg-secondary/30"
              } cursor-pointer p-6`}
            >
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-2">
                {isDragActive
                  ? "Drop your video files here"
                  : "Drag and drop your MP4 video files here"}
              </p>
              <p className="text-xs text-center text-muted-foreground mb-4">
                Multiple files supported, MP4 format only, max 300MB each
              </p>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                multiple
                accept="video/mp4"
                className="hidden"
                disabled={globalLoading}
              />
              <Button
                type="button"
                variant="default"
                // onClick={() => fileInputRef.current?.click()}
                disabled={globalLoading}
              >
                Select Video Files
              </Button>
            </div>
          </div>
        )}

        {/* Background Effects */}
        <div className="flex flex-col dark:opacity-100 opacity-50 items-end fixed -right-60 -bottom-80 blur-xl z-0 ">
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
          <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
          <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
        </div>

        {videoFiles.length > 0 && (
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <h2 className="md:text-lg font-semibold">
                Uploaded Videos ({videoFiles.length})
              </h2>
              <div className="flex md:flex-row flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetState}
                  disabled={totalUploading > 0}
                >
                  <IconTrashXFilled className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
                <Button
                  onClick={uploadAllVideos}
                  disabled={totalReadyVideos === 0 || totalUploading > 0}
                  size={"sm"}
                >
                  <IconCloudUpload className="h-4 w-4 mr-1" />
                  Upload All ({totalReadyVideos})
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {videoFiles.map((video) => (
                <div
                  key={video.id}
                  className="border p-4 bg-secondary/30 backdrop-blur-sm"
                >
                  <div className="flex md:flex-row flex-col gap-4">
                    <div className="md:w-48 md:h-32 md:block hidden relative flex-shrink-0">
                      {video.isProcessing ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : video.frame ? (
                        <div className="relative w-full h-full overflow-hidden">
                          <VideoPopup
                            thumbnail={video.frame}
                            video={video.preview}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            No preview
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-sm mb-1 truncate max-w-md">
                            {video.file.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Size: {(video.file.size / (1024 * 1024)).toFixed(2)}{" "}
                            MB
                            {video.metadata && (
                              <>
                                {" • "}
                                {video.metadata.width} × {video.metadata.height}
                                {" • "}
                                {Math.round(video.metadata.duration)}s
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {video.inputQuality && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {video.inputQuality}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeVideoFile(video.id)}
                            disabled={video.isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {video.isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span>Uploading...</span>
                            <span>{video.uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${video.uploadProgress}%` }}
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelUpload(video.id)}
                          >
                            Cancel Upload
                          </Button>
                        </div>
                      )}

                      {!video.isProcessing &&
                        !video.isUploading &&
                        video.inputQuality && (
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium">
                                Output Resolutions
                              </h4>
                              <p className="text-xs text-muted-foreground mb-3">
                                Based on {video.inputQuality} input, higher
                                qualities are disabled.
                              </p>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              {VIDEO_QUALITIES.map((quality) => {
                                const disabled = isQualityDisabled(
                                  video.id,
                                  quality.value
                                );
                                const selected = video.resolutions.includes(
                                  quality.value
                                );

                                return (
                                  <Button
                                    key={quality.value}
                                    variant={"box"}
                                    onClick={() =>
                                      handleQualityToggle(
                                        video.id,
                                        quality.value
                                      )
                                    }
                                    disabled={disabled}
                                    className={`
                                    relative p-2 border border-muted-foreground cursor-pointer text-left text-xs transition-all
                                    ${
                                      disabled
                                        ? "border-muted bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"
                                        : selected
                                          ? "border-primary/80 bg-primary/10 text-primary"
                                          : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                                    }
                                  `}
                                  >
                                    {selected && !disabled && (
                                      <div className="absolute md:block hidden top-2 right-2">
                                        <Check className="h-3 w-3 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="font-medium">
                                      <span className="md:block hidden">{quality.label}</span>
                                      <span className="md:hidden block">{quality.label.split(" ")[0]}</span>
                                    </div>
                                  </Button>
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {video.resolutions.length} resolution
                                {video.resolutions.length !== 1 ? "s" : ""}{" "}
                                selected
                              </span>
                              <Button
                                size="sm"
                                onClick={() => uploadVideoFile(video.id)}
                                disabled={video.resolutions.length === 0}
                              >
                                Upload This Video
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
