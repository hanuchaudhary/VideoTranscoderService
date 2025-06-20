import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconMovie } from "@tabler/icons-react";
import { useVideoStore } from "@/store/videoStore";

export const UploadBox = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { videoFiles, cancelUpload } = useVideoStore();

  // Filter uploading videos
  const uploadingVideos = videoFiles.filter((video) => video.isUploading);
  const completedVideos = videoFiles.filter(
    (video) => !video.isUploading && video.uploadProgress === 100
  );
  const allRelevantVideos = [...uploadingVideos, ...completedVideos];

  // Calculate overall progress
  const totalProgress =
    allRelevantVideos.length > 0
      ? Math.round(
          allRelevantVideos.reduce(
            (sum, video) => sum + video.uploadProgress,
            0
          ) / allRelevantVideos.length
        )
      : 0;

  const hasActiveUploads = uploadingVideos.length > 0;

  // Prevent page unload during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasActiveUploads) {
        e.preventDefault();
        e.returnValue = "Upload in progress. Are you sure you want to leave?";
        return "Upload in progress. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasActiveUploads]);

  // Auto-show when uploads start, auto-hide when all complete
  useEffect(() => {
    if (hasActiveUploads) {
      setIsVisible(true);
    }
  }, [hasActiveUploads]);

  // Don't show if no relevant videos
  if (!isVisible || allRelevantVideos.length === 0) return null;

  const getVideoStatus = (video: any) => {
    if (video.isUploading) {
      return "uploading";
    } else if (video.uploadProgress === 100) {
      return "completed";
    }
    return "pending";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <IconMovie className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (video: any) => {
    if (video.isUploading) {
      return `Uploading... ${video.uploadProgress}%`;
    } else if (video.uploadProgress === 100) {
      return "Completed";
    }
    return "Pending";
  };

  return (
    <div className="fixed bottom-4 right-4 w-[480px] bg-primary-foreground border z-50 shadow-lg rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">
            Uploads
            {isMinimized ? ` (${allRelevantVideos.length})` : ""}
          </h4>
          {hasActiveUploads && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {uploadingVideos.length} active
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer hover:bg-muted/50 p-1 rounded"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button
            className="cursor-pointer hover:bg-muted/50 p-1 rounded"
            onClick={() => setIsVisible(false)}
            disabled={hasActiveUploads}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="max-h-96 overflow-y-auto">
          {/* Overall Progress */}
          {allRelevantVideos.length > 1 && (
            <div className="p-4 border-b bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedVideos.length}/{allRelevantVideos.length} completed
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Individual Video Progress */}
          <div className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              All ({allRelevantVideos.length})
            </div>

            {allRelevantVideos.map((video) => {
              const status = getVideoStatus(video);

              return (
                <div key={video.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(status)}
                      <p className="truncate text-sm font-medium">
                        {video.file.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground min-w-0">
                        {getStatusText(video)}
                      </span>
                      {video.isUploading && (
                        <Button
                          onClick={() => cancelUpload(video.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1 h-auto"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for individual video */}
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        status === "completed"
                          ? "bg-green-500"
                          : status === "uploading"
                            ? "bg-blue-500"
                            : "bg-muted-foreground/30"
                      }`}
                      style={{ width: `${video.uploadProgress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning message for active uploads */}
          {hasActiveUploads && (
            <div className="p-4 border-t bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Do not close or refresh this page until all uploads are
                  complete
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
