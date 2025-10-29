import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Shield, Video, Download, Share2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ReviewMedia } from '@/types/review';

interface VideoTestimonialProps {
  media: ReviewMedia[];
  verified?: boolean;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

export const VideoTestimonial: React.FC<VideoTestimonialProps> = ({
  media,
  verified = false,
  autoPlay = false,
  showControls = true,
  className = ''
}) => {
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: string]: boolean }>({});
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  if (!media || media.length === 0) {
    return null;
  }

  const handlePlayPause = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying({ ...isPlaying, [videoId]: true });
    } else {
      video.pause();
      setIsPlaying({ ...isPlaying, [videoId]: false });
    }
  };

  const handleMuteToggle = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted({ ...isMuted, [videoId]: video.muted });
  };

  const handleTimeUpdate = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;

    const progressPercentage = (video.currentTime / video.duration) * 100;
    setProgress({ ...progress, [videoId]: progressPercentage });
  };

  const handleVideoEnd = (videoId: string) => {
    setIsPlaying({ ...isPlaying, [videoId]: false });
    setProgress({ ...progress, [videoId]: 0 });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoThumbnail = (video: ReviewMedia) => {
    // In a real implementation, you might extract a thumbnail from the video
    // or use a predefined thumbnail URL
    return video.thumbnail_url || '/assets/video-placeholder.jpg';
  };

  const getVerificationBadge = (video: ReviewMedia) => {
    if (!video.metadata?.verified) {
      return null;
    }

    return (
      <Badge variant="secondary" className="absolute top-2 right-2 z-10">
        <Shield className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {media.map((video, index) => (
          <div key={video.id} className="relative group">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={(el) => {
                  if (el) videoRefs.current[video.id] = el;
                }}
                className="w-full h-full"
                poster={getVideoThumbnail(video)}
                onTimeUpdate={() => handleTimeUpdate(video.id)}
                onEnded={() => handleVideoEnd(video.id)}
                playsInline
                muted={isMuted[video.id] || false}
              >
                <source src={video.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Play/Pause Overlay */}
              {!isPlaying[video.id] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="rounded-full w-16 h-16 bg-black/50 hover:bg-black/70"
                    onClick={() => handlePlayPause(video.id)}
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </Button>
                </div>
              )}

              {/* Controls */}
              {showControls && isPlaying[video.id] && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => handlePlayPause(video.id)}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>

                    <div className="flex-1">
                      <Progress value={progress[video.id] || 0} className="h-1" />
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleMuteToggle(video.id)}
                    >
                      {isMuted[video.id] ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white hover:bg-white/20"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-6xl">
                        <div className="aspect-video">
                          <video
                            className="w-full h-full"
                            controls
                            autoPlay
                          >
                            <source src={video.url} type="video/mp4" />
                          </video>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}

              {getVerificationBadge(video)}

              {/* Duration Badge */}
              {video.metadata?.duration && (
                <Badge
                  variant="secondary"
                  className="absolute bottom-2 left-2 text-xs"
                >
                  {formatDuration(video.metadata.duration)}
                </Badge>
              )}
            </div>

            {/* Video Info */}
            <div className="mt-2">
              {video.caption && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {video.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Video Count and Verification Status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4" />
          <span>{media.length} video{media.length !== 1 ? 's' : ''}</span>
        </div>

        {verified && (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            All videos verified
          </Badge>
        )}
      </div>
    </div>
  );
};

export default VideoTestimonial;