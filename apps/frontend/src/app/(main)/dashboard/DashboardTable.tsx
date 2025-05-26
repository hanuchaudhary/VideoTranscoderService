"use client"

import { useRouteStore } from "@/store/routeStore"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Upload, Video } from "lucide-react"

export function DashboardTable() {
  const { fetchTranscodingJobs, transcodingJobs } = useRouteStore()
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await fetchTranscodingJobs()
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [fetchTranscodingJobs])

  const TableSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-40" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-4 p-4">
          <Skeleton className="h-10 w-16" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center space-x-4 p-4">
          <Skeleton className="h-10 w-16" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center space-x-4 p-4">
          <Skeleton className="h-10 w-16" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-60" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )

  const EmptyState = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full rounded-none shadow-none border-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">No assets yet</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            Get started by uploading your first video asset. You can transcode, optimize, and manage all your media
            files from here.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  if (isLoading) {
    return (
      <div className="">
        <TableSkeleton />
      </div>
    )
  }

  if (!transcodingJobs || transcodingJobs.length === 0) {
    return (
      <div className="">
        <div className="my-6 flex items-center justify-between">
          <h3 className="font-semibold text-4xl leading-none">Assets</h3>
          <Link
            href={"/upload"}
            className="border flex px-7 py-3 rounded-full transition-colors font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer border-primary"
          >
            Upload new asset
          </Link>
        </div>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="">
      <div className="my-6 flex items-center justify-between">
        <h3 className="font-semibold text-4xl leading-none">Assets</h3>
        <Link
          href={"/upload"}
          className="border flex px-7 py-3 rounded-full transition-colors font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer border-primary"
        >
          Upload new asset
        </Link>
      </div>
      <table className="min-w-full border-collapse w-full mt-20">
        <thead>
          <tr className="border-b text-right">
            <th className="py-3 px-4"></th>
            <th className="py-3 px-4 font-normal text-sm text-left">TITLE / ID</th>
            <th className="py-3 px-4 font-normal text-sm">DURATION</th>
            <th className="py-3 px-4 font-normal text-sm">STATUS</th>
            <th className="py-3 px-4 font-normal text-sm">CREATED</th>
          </tr>
        </thead>
        <tbody>
          {transcodingJobs.map((item) => (
            <tr
              onClick={() => router.push(`/dashboard/${item.id}`)}
              key={item.id}
              className="border-b hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <td className="py-6 px-4">
                <img
                  src={
                    "https://images.unsplash.com/photo-1747913647304-9f298ff28ff4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8"
                  }
                  alt={item.videoTitle}
                  className="h-10 object-cover bg-secondary"
                />
              </td>
              <td className="py-6 px-4">
                <Link href={`/dashboard/${item.id}`}>
                  <div className="font-medium">{item.videoTitle}</div>
                  <div className="text-sm text-muted-foreground break-all">{item.id}</div>
                </Link>
              </td>
              <td className="py-6 px-4 text-right font-mono">{Number.parseFloat(item.videoDuration).toFixed(2)}s</td>
              <td className="py-6 px-4 text-right font-semibold">{item.status}</td>
              <td className="py-6 px-4 text-right font-mono">
                {new Date(item.createdAt).toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
