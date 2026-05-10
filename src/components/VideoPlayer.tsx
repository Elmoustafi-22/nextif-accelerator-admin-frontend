interface VideoPlayerProps {
  url: string;
}

const VideoPlayer = ({ url }: VideoPlayerProps) => {
  // Transform Google Drive links to embeddable preview links
  const getEmbedUrl = (sourceUrl: string) => {
    if (sourceUrl.includes('drive.google.com') && sourceUrl.includes('/view')) {
      return sourceUrl.replace('/view', '/preview');
    }
    return sourceUrl;
  };

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
      <iframe
        src={getEmbedUrl(url)}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPlayer;
