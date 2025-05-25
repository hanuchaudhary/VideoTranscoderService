import React from "react";

type DashboardTableData = {
  id: string;
  videoTitle: string;
  videoDuration: string;
  videoThumbnail: string;
  videoUrl: string;
  videoCreatedAt: string;
  status: "Processing" | "Completed" | "Failed" | "Pending";
};

export function DashboardTable() {
  const data: DashboardTableData[] = [
    {
      id: "kaanwdkaldjljdwwlmldnlnwdnankdnk",
      videoTitle: "Sample Video",
      videoDuration: "5:00",
      videoThumbnail: "https://via.placeholder.com/150",
      videoUrl: "https://example.com/video/1",
      videoCreatedAt: "2023-10-01T12:00:00Z",
      status: "Completed",
    },
    {
      id: "wdckncndkcncndkncndkncndkncndkn",
      videoTitle: "Sample Video",
      videoDuration: "5:00",
      videoThumbnail: "https://via.placeholder.com/150",
      videoUrl: "https://example.com/video/1",
      videoCreatedAt: "2023-10-01T12:00:00Z",
      status: "Completed",
    },
  ];
  return (
    <div>
      <div className="header flex items-center justify-between border-b pb-3 mb-3">
        <div></div>
        <div>TITLE/ID</div>
        <div>DURATION</div>
        <div>STATUS</div>
        <div>CREATED</div>
      </div>
      <div className="">
        {data.map((item) => (
          <div key={item.id} className="row flex items-center border-b py-6 justify-between">
            <div>
              {/* <img
                src={item.videoThumbnail}
                alt={item.videoTitle}
                className="thumbnail"
              /> */}
            </div>
            <div>
              <h2 className="video-link">{item.videoTitle}</h2>
              <p>{item.id}</p>
            </div>
            <div>{item.videoDuration}</div>
            <div>{item.status}</div>
            <div>{new Date(item.videoCreatedAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
