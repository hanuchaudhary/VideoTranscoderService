"use client"

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconMovie } from "@tabler/icons-react";
import { useVideoStore } from "@/store/videoStore";
import { AnimatePresence, motion } from "motion/react";

export const UploadBox = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { videoFiles, cancelUpload } = useVideoStore();

  const uploadingVideos = videoFiles.filter((video) => video.isUploading);
  const completedVideos = videoFiles.filter(
    (video) => !video.isUploading && video.uploadProgress === 100
  );
  const allRelevantVideos = [...uploadingVideos, ...completedVideos];

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

  useEffect(() => {
    if (hasActiveUploads) {
      setIsVisible(true);
    }
  }, [hasActiveUploads]);

  if (!isVisible || allRelevantVideos.length === 0) return null;

  const getVideoStatus = (video: any) => {
    if (video.isUploading) {
      return "uploading";
    } else if (video.uploadProgress === 100) {
      return "completed";
    }
    return "pending";
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
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 w-[calc(100vw-16px)] sm:w-[480px] max-w-[480px] bg-primary-foreground border z-50 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm sm:text-base">
            Uploads
            {isMinimized ? ` (${allRelevantVideos.length})` : ""}
          </h4>
          {hasActiveUploads && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">
                {uploadingVideos.length} active
              </span>
              <span className="sm:hidden">{uploadingVideos.length}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            className="cursor-pointer hover:bg-muted/50 p-1 rounded"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <ChevronUp size={16} className="sm:w-[18px] sm:h-[18px]" />
            ) : (
              <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px]" />
            )}
          </button>
          <button
            className="cursor-pointer hover:bg-muted/50 p-1 rounded"
            onClick={() => setIsVisible(false)}
            disabled={hasActiveUploads}
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            style={{ scrollbarWidth: "none" }}
            className="max-h-64 sm:max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden"
            initial={{ opacity: 0, height: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            {allRelevantVideos.length > 1 && (
              <div className="p-3 sm:p-4 border-b bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium">
                    Overall Progress
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {completedVideos.length}/{allRelevantVideos.length}{" "}
                    <span className="hidden sm:inline">completed</span>
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
            <div className="p-3 sm:p-4 space-y-3">
              <div className="text-xs sm:text-sm text-muted-foreground">
                All ({allRelevantVideos.length})
              </div>

              {allRelevantVideos.map((video) => {
                const status = getVideoStatus(video);

                return (
                  <div key={video.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IconMovie className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                        <p className="truncate text-xs sm:text-sm font-medium">
                          {video.file.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground min-w-0 hidden sm:inline">
                          {getStatusText(video)}
                        </span>
                        <span className="text-xs text-muted-foreground min-w-0 sm:hidden">
                          {video.uploadProgress}%
                        </span>
                        {video.isUploading && (
                          <Button
                            onClick={() => cancelUpload(video.id)}
                            variant="outline"
                            size="sm"
                            className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 h-auto"
                          >
                            <span className="hidden sm:inline">Cancel</span>
                            <X className="h-3 w-3 sm:hidden text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          status === "uploading"
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

            {hasActiveUploads && (
              <div className="p-3 sm:p-4 border-t bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">
                      Do not close or refresh this page until all uploads are
                      complete
                    </span>
                    <span className="sm:hidden">
                      Don't close until uploads complete
                    </span>
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
