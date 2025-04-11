import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoFormat {
  resolution: string
  url: string
  status: "processing" | "complete"
}

interface VideoFile {
  id: string
  name: string
  size: number
  status: string
  progress: number
  formats?: VideoFormat[]
}

interface VideoListProps {
  videos: VideoFile[]
}

export function VideoList({ videos }: VideoListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Processed Videos</CardTitle>
        <CardDescription>Your videos have been processed and are ready to use</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {videos.map((video) => (
            <div key={video.id} className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/30">
                <h3 className="font-medium truncate">{video.name}</h3>
              </div>

              <div className="p-4">
                <div className="relative aspect-video mb-4 bg-black rounded-lg overflow-hidden">
                  <img
                    src={`/placeholder.svg?height=720&width=1280`}
                    alt={video.name}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="icon" variant="secondary" className="rounded-full w-12 h-12">
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="1080p">
                  <TabsList className="grid grid-cols-4 mb-4">
                    {video.formats?.map((format) => (
                      <TabsTrigger key={format.resolution} value={format.resolution}>
                        {format.resolution}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {video.formats?.map((format) => (
                    <TabsContent key={format.resolution} value={format.resolution} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{format.resolution} Version</h4>
                          <p className="text-sm text-muted-foreground">Optimized for {format.resolution} playback</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>

                      <div className="text-sm">
                        <p className="font-medium">Video Details:</p>
                        <ul className="text-muted-foreground space-y-1 mt-1">
                          <li>Resolution: {format.resolution}</li>
                          <li>Format: MP4</li>
                          <li>URL: {format.url}</li>
                        </ul>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
