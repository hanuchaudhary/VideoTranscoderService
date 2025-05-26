import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconMovie } from "@tabler/icons-react";
import { useVideoStore } from "@/store/videoStore";

const UploadBox = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const { uploadProgress, cancelUpload, videoFile } = useVideoStore();

  // Prevent page unload during upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploadProgress !== undefined && uploadProgress < 100) {
        e.preventDefault();
        e.returnValue = "Upload in progress. Are you sure you want to leave?";
        return "Upload in progress. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uploadProgress]);

  if (!isVisible) return null;

  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  return (
    <div className="fixed bottom-4 right-4 w-[460px] bg-primary-foreground border z-50 shadow-lg">
      <div className="flex items-center justify-between p-4">
        <h4 className="font-semibold">
          Uploads
          {isMinimized ? ` (${1})` : ""}
        </h4>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button
            className="cursor-pointer"
            onClick={() => setIsVisible(false)}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3 border-t">
          <div className="text-sm text-muted-foreground">All (1)</div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconMovie />
              <p className="truncate max-w-[180px] text-sm">
                {videoFile ? videoFile.name : "No file selected"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (cancelUpload) {
                    cancelUpload();
                  }
                }}
                variant="box"
                size="sm"
                className="text-xs px-2 py-0.5 rounded-none"
              >
                Cancel
              </Button>
            </div>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          {isUploading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                Do not close or refresh this page until upload is complete
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {uploadProgress! < 100 ? "Uploading..." : "Uploaded"}{" "}
            {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
