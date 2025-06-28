"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";

interface VideoPopupProps {
  video?: string | File;
  onCloseModal?: () => void;
}

export const VideoPopup: React.FC<VideoPopupProps> = ({
  video,
  onCloseModal,
}) => {
  const [videoUrl, setVideoUrl] = useState<string>("");

  useEffect(() => {
    if (video instanceof File) {
      const url = URL.createObjectURL(video);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setVideoUrl("");
      };
    } else if (typeof video === "string") {
      setVideoUrl(video);
    } else {
      setVideoUrl("");
    }
  }, [video]);

  const handleCloseModal = () => {
    onCloseModal?.();
  };

  return (
    <>
      <AnimatePresence>
        {video && (
          <motion.div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Video Modal"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.1 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-4xl aspect-video bg-card rounded-2xl overflow-hidden shadow-2xl border border-border"
              style={{ transformOrigin: "center center" }}
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 hover:cursor-pointer"
                aria-label="Close video"
              >
                <X size={20} />
              </button>

              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
