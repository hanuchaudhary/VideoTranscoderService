import { useState, useRef, useCallback, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Film,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  Video,
} from "lucide-react";
import { VideoList } from "@/components/video-list";
import { cn } from "@/lib/utils"; // ShadCN utility for classNames

type VideoStatus = "idle" | "uploading" | "processing" | "success" | "error";

interface VideoFile {
  id: string;
  name: string;
  size: number;
  status: VideoStatus;
  progress: number;
  file: File | null; // Store file for retries
  thumbnail?: string; // For preview
  formats?: {
    resolution: string;
    url: string;
    status: "processing" | "complete";
  }[];
  abortController?: AbortController; // For canceling uploads
}

export function VideoUploader() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processFiles(e.target.files);
  };

  // Handle drag-and-drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    await processFiles(files);
  }, []);

  // Process multiple files
  const processFiles = async (files: FileList) => {
    const newVideos: VideoFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Validate file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 500MB limit`);
        continue;
      }
      const videoId = crypto.randomUUID();
      newVideos.push({
        id: videoId,
        name: file.name,
        size: file.size,
        status: "idle",
        progress: 0,
        file,
        abortController: new AbortController(),
      });
    }

    setVideos((prev) => [...prev, ...newVideos]);

    // Process files concurrently with a limit
    await Promise.all(newVideos.map((video) => processFile(video)));
  };

  // Process a single file
  const processFile = async (video: VideoFile) => {
    if (!video.file) return;

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      updateVideoStatus(video.id, "uploading");

      // Generate thumbnail
      const thumbnail = await generateThumbnail(video.file);
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, thumbnail } : v))
      );

      // Simulate progress (replace with actual upload progress if available)
      progressInterval = setInterval(() => {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === video.id && v.progress < 90
              ? { ...v, progress: Math.min(v.progress + 5, 90) }
              : v
          )
        );
      }, 300);

      // Get pre-signed URL
      const response = await fetch("http://localhost:3000/preSignedUrl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: `${video.id}.mp4`, // Use videoId as the file name
          fileType: video.file.type,
          videoId: video.id,
        }),
        signal: video.abortController?.signal,
      });

      if (!response.ok) throw new Error("Failed to get pre-signed URL");

      const { url } = await response.json();

      console.log("Uploading to S3....");

      // Upload to S3
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: video.file,
        headers: { "Content-Type": video.file.type },
        signal: video.abortController?.signal,
      });
      console.log("Uploaded", uploadResponse);

      clearInterval(progressInterval);
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, progress: 100 } : v))
      );

      if (!uploadResponse.ok) throw new Error("Upload failed");

      // Update status to processing
      updateVideoStatus(video.id, "processing");

      // Poll for transcoding results
      await pollForFormats("904bc863-69c3-41fe-a6d1-ca58d0254e3a");
    } catch (error: any) {
      clearInterval(progressInterval);
      if (error.name === "AbortError") {
        updateVideoStatus(video.id, "error");
        setVideos((prev) =>
          prev.map((v) => (v.id === video.id ? { ...v, progress: 0 } : v))
        );
      } else {
        console.error("Error uploading video:", error);
        updateVideoStatus(video.id, "error");
      }
    }
  };

  // // Poll for transcoded formats
  const pollForFormats = async (videoId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds max wait
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `http://localhost:3000/videos/${videoId}/formats`
        );
        const { status, formats } = await response.json();

        if (status === "complete" && formats.length > 0) {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === videoId ? { ...v, status: "success", formats } : v
            )
          );
          return;
        }
      } catch (error) {
        console.error(`Error polling formats for video ${videoId}:`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
      attempts++;
    }

    // If polling times out, mark as error
    updateVideoStatus(videoId, "error");
  };

  let videURLs;

  useEffect(() => {
    // pollForFormats("904bc863-69c3-41fe-a6d1-ca58d0254e3a")
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/videos/904bc863-69c3-41fe-a6d1-ca58d0254e3a`
        );
        const { urls } = await response.json();

        videURLs = urls;
        console.log(videURLs);
      } catch (error) {
        console.error(`Error polling formats for video :`, error);
      }
    };
    fetchVideos();
  }, []);

  // Update video status
  const updateVideoStatus = (videoId: string, status: VideoStatus) => {
    setVideos((prev) =>
      prev.map((video) => (video.id === videoId ? { ...video, status } : video))
    );
  };

  // Cancel upload
  const cancelUpload = (videoId: string) => {
    setVideos((prev) =>
      prev.map((video) => {
        if (video.id === videoId && video.status === "uploading") {
          video.abortController?.abort();
          return { ...video, status: "error", progress: 0 };
        }
        return video;
      })
    );
  };

  // Retry upload
  const retryUpload = (videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId && video.file
          ? {
              ...video,
              status: "idle",
              progress: 0,
              abortController: new AbortController(),
            }
          : video
      )
    );
    const video = videos.find((v) => v.id === videoId);
    if (video?.file) {
      processFile(video);
    }
  };

  // Generate thumbnail
  const generateThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.currentTime = 1; // Get frame at 1 second
      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL("image/jpeg");
        URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      };
      video.onerror = () => resolve("");
    });
  };

  return (
    <div className="space-y-8 p-4 max-w-5xl mx-auto">
      {/* Upload Card */}
      <Card className="bg-stone-900/50 border-stone-700/50 backdrop-blur-sm transition-all hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Upload Videos
          </CardTitle>
          <CardDescription className="text-stone-300">
            Upload videos to transcode into multiple formats (1080p, 720p, 480p,
            360p)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "flex items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all",
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : "border-stone-600 hover:border-stone-500 hover:bg-stone-800/50"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <label
              htmlFor="video-upload"
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
              aria-label="Upload video files"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload
                  className={cn(
                    "w-12 h-12 mb-3 transition-transform",
                    isDragging ? "scale-110 text-blue-500" : "text-stone-400"
                  )}
                />
                <p className="mb-2 text-sm text-stone-300">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-stone-400">
                  MP4, MOV, AVI, WEBM (Max 500MB)
                </p>
              </div>
              <input
                id="video-upload"
                type="file"
                className="hidden"
                accept="video/mp4,video/mov,video/avi,video/webm"
                multiple
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-stone-400">
          Supported formats: MP4, MOV, AVI, WEBM
        </CardFooter>
      </Card>

      {/* Upload Status */}
      {videos.length > 0 && (
        <Card className="bg-stone-900/50 border-stone-700/50">
          <CardHeader>
            <CardTitle className="text-xl text-white">Upload Status</CardTitle>
            <CardDescription className="text-stone-300">
              Track your video uploads and transcoding progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="border border-stone-700 rounded-xl p-4 bg-stone-800/50 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.name}
                        className="w-20 h-12 object-cover rounded-md"
                      />
                    ) : (
                      <Video className="w-20 h-12 text-stone-400" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Film className="h-5 w-5 text-stone-400" />
                          <span className="font-medium text-white truncate max-w-[200px] sm:max-w-[400px]">
                            {video.name}
                          </span>
                        </div>
                        <StatusBadge status={video.status} />
                      </div>
                      <div className="mb-2">
                        <Progress
                          value={video.progress}
                          className="h-2 bg-stone-700"
                          // indicatorClassName="bg-blue-500"
                        />
                      </div>
                      <div className="text-xs text-stone-400 flex justify-between">
                        <span>{formatFileSize(video.size)}</span>
                        <span>{video.progress}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 mt-2">
                    {video.status === "uploading" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelUpload(video.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    {video.status === "error" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => retryUpload(video.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>

                  {/* Formats */}
                  {video.formats && (
                    <div className="mt-4 border-t border-stone-700 pt-3">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Available Formats
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {video.formats.map((format) => (
                          <a
                            key={format.resolution}
                            href={format.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <CheckCircle
                              className={cn(
                                "h-3 w-3",
                                format.status === "complete"
                                  ? "text-green-500"
                                  : "text-yellow-500"
                              )}
                            />
                            <span>{format.resolution}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video List */}
      {videos.some((v) => v.status === "success") && (
        <VideoList videos={videos.filter((v) => v.status === "success")} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: VideoStatus }) {
  const baseStyles =
    "text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium";
  switch (status) {
    case "uploading":
      return (
        <div className={cn(baseStyles, "bg-blue-500/20 text-blue-400")}>
          <Upload className="h-3 w-3 animate-pulse" />
          <span>Uploading</span>
        </div>
      );
    case "processing":
      return (
        <div className={cn(baseStyles, "bg-yellow-500/20 text-yellow-400")}>
          <Clock className="h-3 w-3 animate-spin" />
          <span>Processing</span>
        </div>
      );
    case "success":
      return (
        <div className={cn(baseStyles, "bg-green-500/20 text-green-400")}>
          <CheckCircle className="h-3 w-3" />
          <span>Complete</span>
        </div>
      );
    case "error":
      return (
        <div className={cn(baseStyles, "bg-red-500/20 text-red-400")}>
          <AlertCircle className="h-3 w-3" />
          <span>Error</span>
        </div>
      );
    default:
      return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
