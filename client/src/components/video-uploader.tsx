import type React from "react"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Film, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { VideoList } from "@/components/video-list"

type VideoStatus = "idle" | "uploading" | "processing" | "success" | "error"

interface VideoFile {
  id: string
  name: string
  size: number
  status: VideoStatus
  progress: number
  formats?: {
    resolution: string
    url: string
    status: "processing" | "complete"
  }[]
}

export function VideoUploader() {
  const [videos, setVideos] = useState<VideoFile[]>([])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newVideos: VideoFile[] = []

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i]
      const videoId = crypto.randomUUID()

      newVideos.push({
        id: videoId,
        name: file.name,
        size: file.size,
        status: "idle",
        progress: 0,
      })

      // Add to state immediately to show in UI
      setVideos((prev) => [...prev, ...newVideos])

      // Process each file
      await processFile(file, videoId)
    }
  }

  const processFile = async (file: File, videoId: string) => {
    try {
      // Update status to uploading
      updateVideoStatus(videoId, "uploading")

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId && video.progress < 100
              ? { ...video, progress: Math.min(video.progress + 5, 100) }
              : video,
          ),
        )
      }, 300)

      // Upload to AWS via server action
      const formData = new FormData()
      formData.append("file", file)
      formData.append("videoId", videoId)

      const result = await uploadVideo(formData)

      clearInterval(progressInterval)

      if (result.success) {
        // Update status to processing
        updateVideoStatus(videoId, "processing")

        // Simulate processing time
        setTimeout(() => {
          setVideos((prev) =>
            prev.map((video) =>
              video.id === videoId
                ? {
                    ...video,
                    status: "success",
                    formats: [
                      { resolution: "1080p", url: `/videos/${videoId}/1080p.mp4`, status: "complete" },
                      { resolution: "720p", url: `/videos/${videoId}/720p.mp4`, status: "complete" },
                      { resolution: "480p", url: `/videos/${videoId}/480p.mp4`, status: "complete" },
                      { resolution: "360p", url: `/videos/${videoId}/360p.mp4`, status: "complete" },
                    ],
                  }
                : video,
            ),
          )
        }, 5000)
      } else {
        updateVideoStatus(videoId, "error")
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      updateVideoStatus(videoId, "error")
    }
  }

  const updateVideoStatus = (videoId: string, status: VideoStatus) => {
    setVideos((prev) => prev.map((video) => (video.id === videoId ? { ...video, status } : video)))
  }

  return (
    <div className="space-y-8">
      <Card className="bg-stone-800 border-stone-700">
        <CardHeader>
          <CardTitle>Upload Videos</CardTitle>
          <CardDescription>
            Upload your videos to convert them to multiple formats (1080p, 720p, 480p, 360p)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="video-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">MP4, MOV, or AVI (MAX. 500MB)</p>
              </div>
              <input
                id="video-upload"
                type="file"
                className="hidden"
                accept="video/mp4,video/mov,video/avi"
                multiple
                onChange={handleFileChange}
              />
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">Supported formats: MP4, MOV, AVI</p>
        </CardFooter>
      </Card>

      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Status</CardTitle>
            <CardDescription>Track the status of your video uploads and processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Film className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium truncate max-w-[200px]">{video.name}</span>
                    </div>
                    <StatusBadge status={video.status} />
                  </div>

                  <div className="mb-2">
                    <Progress value={video.progress} className="h-2" />
                  </div>

                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{formatFileSize(video.size)}</span>
                    <span>{video.progress}%</span>
                  </div>

                  {video.formats && (
                    <div className="mt-4 border-t pt-3">
                      <h4 className="text-sm font-medium mb-2">Available Formats:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {video.formats.map((format) => (
                          <div key={format.resolution} className="text-xs flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{format.resolution}</span>
                          </div>
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

      {videos.some((v) => v.status === "success") && (
        <VideoList videos={videos.filter((v) => v.status === "success")} />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: VideoStatus }) {
  switch (status) {
    case "uploading":
      return (
        <div className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Upload className="h-3 w-3" />
          <span>Uploading</span>
        </div>
      )
    case "processing":
      return (
        <div className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Processing</span>
        </div>
      )
    case "success":
      return (
        <div className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Complete</span>
        </div>
      )
    case "error":
      return (
        <div className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Error</span>
        </div>
      )
    default:
      return null
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
