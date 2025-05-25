import React, { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconMovie } from "@tabler/icons-react";

const UploadBox = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  // Simulate upload progress
  React.useEffect(() => {
    if (progress < 100) {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 100));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[460px] bg-primary-foreground border z-50 shadow-lg">
      <div className="flex items-center justify-between p-4">
        <h4 className="font-semibold">
          Uploads
          {isMinimized ? ` (${1})` : ""}
        </h4>
        <div className="flex items-center gap-2">
          <button className="cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button className="cursor-pointer" onClick={() => setIsVisible(false)}>
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-3 border-t">
          <div className="text-sm text-muted-foreground">All (1)</div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <IconMovie/>
              <p className="truncate max-w-[180px] text-sm">
                [AMV] AURA _ Solo Leveling
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="box" size="sm" className="text-xs px-2 py-0.5 rounded-none">
                Cancel
              </Button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">
            {progress < 100 ? "Uploading..." : "Uploaded"} {progress}%
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
