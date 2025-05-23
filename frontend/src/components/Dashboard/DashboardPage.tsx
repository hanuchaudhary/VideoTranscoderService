"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formSchema = z.object({
  uploadMethod: z.enum(["url", "file"]),
  url: z
    .string()
    .url("Please enter a valid video URL")
    .optional()
    .or(z.literal("")),
  resolution: z.enum(["720p", "1080p", "4K"], {
    required_error: "Please select a resolution",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function DashboardPage() {
  const [uploadMethod, setUploadMethod] = useState<"url" | "file" | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      uploadMethod: "url",
      url: "",
      resolution: "720p",
    },
    resolver: zodResolver(formSchema),
  });

  const watchUrl = watch("url");
  const watchResolution = watch("resolution");

  const handleFileValidation = useCallback((file: File) => {
    if (file.type !== "video/mp4") {
      toast.error("Invalid file type", {
        description: "Please upload a valid MP4 video file",
      });
      return false;
    }

    if (file.size > 1000 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 100MB",
      });
      return false;
    }

    return true;
  }, []);

  const handleFileSelected = useCallback(
    (file: File) => {
      if (handleFileValidation(file)) {
        setVideoFile(file);
        setUploadMethod("file");
        setValue("uploadMethod", "file");
        setValue("url", "");

        const videoUrl = URL.createObjectURL(file);
        setVideoPreview(videoUrl);

        toast.success("File selected", {
          description: "Your video file is ready for transcoding",
        });
      }
    },
    [handleFileValidation, setValue]
  );

  const handleUrlChange = (url: string) => {
    if (url) {
      setUploadMethod("url");
      setValue("uploadMethod", "url");
      if (videoFile) {
        setVideoFile(null);
        setVideoPreview(null);
      }
    } else {
      setUploadMethod(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "video/mp4": [".mp4"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileSelected(acceptedFiles[0]);
      }
    },
    onDropRejected: () => {
      toast.error("File rejected", {
        description: "Please upload a valid MP4 video file",
      });
    },
    disabled: uploadMethod === "url",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.uploadMethod === "url" && data.url) {
        const response = await axios.post(`${"BACKEND_URL"}/transcode`, {
          url: data.url,
          resolution: data.resolution,
        });

        toast.success("Transcoding started", {
          description: "Your video is being transcoded",
        });

        console.log("Response data: ", response.data);
      } else if (data.uploadMethod === "file" && videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        formData.append("resolution", data.resolution);

        const response = await axios.post(
          `${"BACKEND_URL"}/upload-transcode`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Transcoding started", {
          description: "Your video is being transcoded",
        });

        console.log("Response data: ", response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error("Error during transcoding", {
          description: error.message || "Failed to transcode video",
        });
      } else {
        toast.error("Unexpected error", {
          description: "Something went wrong",
        });
      }
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setUploadMethod(null);
  };

  return (
    <div className="container max-w-4xl mx-auto px-2 md:py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Ready to transcode your videos?
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload your video or paste a video link and select transcoding
          options.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex w-full items-center gap-2">
          <div className="relative w-full">
            <Controller
              control={control}
              name="url"
              render={({ field }) => (
                <input
                  {...field}
                  type="url"
                  placeholder={
                    uploadMethod === "file"
                      ? "File upload active"
                      : "Paste your video link here"
                  }
                  className="border py-4 px-6 w-full h-full focus:outline-none bg-secondary/30 disabled:cursor-not-allowed disabled:bg-secondary/80"
                  disabled={uploadMethod === "file"}
                  onChange={(e) => {
                    field.onChange(e);
                    handleUrlChange(e.target.value);
                  }}
                />
              )}
            />
            <button
              disabled={uploadMethod !== "url" || !watchUrl}
              type="submit"
              className="absolute top-0 right-0 flex items-center justify-center h-full border-l px-5 font-semibold text-muted-foreground bg-secondary/30 hover:bg-secondary/10 disabled:cursor-not-allowed disabled:bg-secondary/80 hover:text-primary cursor-pointer backdrop-blur-lg"
            >
              Transcode
            </button>
          </div>

          <div>
            <Controller
              control={control}
              name="resolution"
              render={({ field }) => (
                <Select onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4K">4K</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.resolution && (
              <p className="text-sm text-red-500">
                {errors.resolution.message}
              </p>
            )}
          </div>
        </div>
        {errors.url && (
          <p className="text-sm text-red-500">{errors.url.message}</p>
        )}

        <div className="flex items-center justify-center my-4">
          <span className="px-4 text-sm text-muted-foreground">or</span>
        </div>

        {!videoPreview ? (
          <div
            {...getRootProps()}
            className={`h-80 w-full border transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : uploadMethod === "url"
                ? "border-muted bg-muted/30 opacity-30"
                : "border-border bg-secondary/30"
            } ${
              uploadMethod === "url" ? "cursor-not-allowed" : "cursor-pointer"
            } flex flex-col items-center justify-center p-6 relative`}
          >
            <input {...getInputProps()} disabled={uploadMethod === "url"} />

            {uploadMethod === "url" && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg">
                <p className="font-medium border px-4 py-2 bg-secondary ">
                  URL input is active
                </p>
              </div>
            )}

            <p className="text-center text-muted-foreground mb-2">
              {isDragActive
                ? "Drop your video file here"
                : "Drag and drop your MP4 video file here"}
            </p>
            <p className="text-xs text-muted-foreground">
              Only MP4 format supported, max 100MB
            </p>
            <button
              type="button"
              className="border py-2 mt-4 px-5 font-semibold text-muted-foreground bg-secondary/40"
              disabled={uploadMethod === "url"}
              onClick={(e) => {
                e.stopPropagation();
                if (uploadMethod === "url") return;

                const input = document.createElement("input");
                input.type = "file";
                input.accept = "video/mp4";
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files.length > 0) {
                    handleFileSelected(files[0]);
                  }
                };
                input.click();
              }}
            >
              Select Video
            </button>
          </div>
        ) : (
          <div>
            <div className="relative h-80 w-full border overflow-hidden">
              <Button
                type="button"
                variant="box"
                className="absolute top-2 right-2 z-10 backdrop-blur-lg"
                onClick={clearVideo}
              >
                Remove
              </Button>
              <video
                src={videoPreview}
                controls
                className="w-full h-full object-contain bg-black"
              />
            </div>
            <div className="bg-background/30 my-4 border backdrop-blur-sm p-3">
              <p className="text-sm truncate">
                {videoFile?.name || "Selected video"}
              </p>
              <div className="flex w-full justify-end">
                <Button size={"default"} variant={"box"} type="submit">
                  Transcode Video
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
