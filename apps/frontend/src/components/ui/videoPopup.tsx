"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { Play, X } from "lucide-react";

interface VideoPopupProps {
  video?: string | File
  thumbnail?: string;
  className?: string;
}

export const VideoPopup: React.FC<VideoPopupProps> = ({
  video,
  thumbnail,
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpenModal = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const getTransformOrigin = () => {
    if (!buttonRect) return "center center";

    const centerX = buttonRect.left + buttonRect.width / 2;
    const centerY = buttonRect.top + buttonRect.height / 2;

    return `${centerX}px ${centerY}px`;
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
    };
    if (isModalOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isModalOpen]);

  return (
    <>
      <motion.button
        ref={buttonRef}
        initial={{ scale: 1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpenModal}
        className={`
          relative overflow-hidden 
          shadow-sm hover:shadow-md transition-all duration-200
          group focus:outline-none focus:ring-0 hover:cursor-pointer
          ${className}
        `}
      >
        <div className="flex items-center">
          <div className="relative md:w-48 md:h-32 overflow-hidden flex-shrink-0">
            <Image
              src={thumbnail!}
              alt="Video thumbnail"
              fill
              className="object-cover"
              sizes="70px"
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-1 rounded-full bg-background shadow-sm border border-border">
                <Play
                  size={10}
                  className="fill-foreground text-foreground ml-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.button>
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
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
              style={{ transformOrigin: getTransformOrigin() }}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 hover:cursor-pointer"
                aria-label="Close video"
              >
                <X size={20} />
              </button>

              {/* Video or YouTube */}

              <video
                src={video}
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
