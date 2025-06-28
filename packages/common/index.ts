import z from "zod";

export const preSignedUrlSchema = z.object({
  fileType: z.string().min(1, "File type is required"),
  videoId: z.string().min(1, "Video ID is required"),
  resolutions: z.array(z.string()).optional(),
  videoDuration: z.string().min(1, "Video duration is required"),
  videoTitle: z.string().min(1, "Video title is required"),
  videoSize: z.string().min(1, "Video size is required"),
});

export const subscriptionSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  street: z.string().min(1, "Street is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
});
