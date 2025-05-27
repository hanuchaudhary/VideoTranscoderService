import { create } from "zustand";
import type { JobLog, TranscodingJob } from "@repo/common/types";
import { BACKEND_URL } from "@/config";
import axios from "axios";
import { toast } from "sonner";

interface singleTranscodingJobState extends TranscodingJob {
  logs: JobLog[];
};

type RouteState = {
  fetchTranscodingJobs: () => void;
  transcodingJobs: TranscodingJob[];

  singleTranscodingJob?: singleTranscodingJobState;
  fetchSingleTranscodingJob: (jobId: string) => Promise<void>;
  isFetchingSingleJob?: boolean;

  deleteTranscodingJob?: (jobId: string) => Promise<void>;
};

export const useRouteStore = create<RouteState>((set) => ({
  transcodingJobs: [],
  fetchTranscodingJobs: async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/v1/transcoding`, {
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

  isFetchingSingleJob: false,
  singleTranscodingJob: undefined,
  fetchSingleTranscodingJob: async (jobId: string) => {
    set({ isFetchingSingleJob: true });
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/v1/transcoding/${jobId}`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status !== 200) {
        throw new Error("Failed to fetch single transcoding job");
      }
      const data: singleTranscodingJobState = response.data;
      console.log("Fetched single transcoding job:", data);

      set({ singleTranscodingJob: data });
    } catch (error) {
      console.error("Error fetching single transcoding job:", error);
    } finally {
      set({ isFetchingSingleJob: false });
    }
  },

  deleteTranscodingJob: async (jobId: string) => {
    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/v1/transcoding/${jobId}`,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status !== 200) {
        throw new Error("Failed to delete transcoding job");
      }
      set((state) => ({
        transcodingJobs: state.transcodingJobs.filter((job) => job.id !== jobId),
      }));
    } catch (error) {
      console.error("Error deleting transcoding job:", error);
    }
  },
}));
