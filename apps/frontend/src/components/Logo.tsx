import React from "react";

export function Logo({
  className = "",
  height = 8,
  width = 8,
}: {
  className?: string;
  height?: number;
  width?: number;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-full transition-colors font-semibold bg-blue-600 ${className}`}
      style={{ height: `${height * 0.25}rem`, width: `${width * 0.25}rem` }}
    >
      <div
        className="rounded-full transition-colors font-semibold bg-primary shadow-sm"
        style={{ height: `${(height - 3) * 0.25}rem`, width: `${(width - 3) * 0.25}rem` }}
      />
    </div>
  );
}
