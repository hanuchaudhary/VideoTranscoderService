import { create } from "zustand";
import type { TranscodingJob } from "@repo/common/types";
import { BACKEND_URL } from "@/config";
import axios from "axios";
type RouteState = {
  fetchTranscodingJobs: () => void;
  transcodingJobs: TranscodingJob[];
};

export const useRouteStore = create<RouteState>((set) => ({
  transcodingJobs: [],
  fetchTranscodingJobs: async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/transcoding`,{
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status !== 200) {
        throw new Error("Failed to fetch transcoding jobs");
      }
      const data: TranscodingJob[] = response.data;
      console.log("Fetched transcoding jobs:", data);

      set({ transcodingJobs: data });
    } catch (error) {
      console.error("Error fetching transcoding jobs:", error);
    }
  },
}));
