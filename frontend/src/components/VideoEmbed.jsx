// YouTube video embed helper + responsive player.
export function getYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function VideoEmbed({ url, title = "Video" }) {
  const id = getYouTubeId(url);
  if (!id) return null;
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-border bg-black aspect-video" data-testid="video-embed">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
