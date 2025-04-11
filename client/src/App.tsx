import { VideoUploader } from "@/components/video-uploader"

export default function App() {
  return (
    <main className="py-10 px-20 bg-stone-900 text-white h-screen">
      <h1 className="text-3xl font-bold mb-8">Video Upload & Processing</h1>
      <VideoUploader />
    </main>
  )
}
