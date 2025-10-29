import React, { useState } from 'react';
import { Eye, Download, Share2, Shield, Camera } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LazyImage } from '@/components/ui/lazy-image';
import { ReviewMedia } from '@/types/review';

interface PhotoReviewProps {
  media: ReviewMedia[];
  verified?: boolean;
  className?: string;
}

export const PhotoReview: React.FC<PhotoReviewProps> = ({
  media,
  verified = false,
  className = ''
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!media || media.length === 0) {
    return null;
  }

  const handleDownload = async (photo: ReviewMedia) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `review-photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download photo:', error);
    }
  };

  const handleShare = async (photo: ReviewMedia) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Customer Review Photo',
          text: 'Check out this customer review photo',
          url: photo.url
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(photo.url);
    }
  };

  const getVerificationBadge = (photo: ReviewMedia) => {
    if (!photo.metadata?.verified) {
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
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {media.map((photo, index) => (
          <Dialog key={photo.id}>
            <DialogTrigger asChild>
              <div
                className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border"
                onClick={() => setSelectedPhotoIndex(index)}
              >
                <LazyImage
                  src={photo.thumbnail_url || photo.url}
                  alt={photo.caption || `Review photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {getVerificationBadge(photo)}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs line-clamp-2">
                      {photo.caption}
                    </p>
                  </div>
                )}
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-4xl">
              <div className="space-y-4">
                {/* Main Photo Display */}
                <div className="relative">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Review photo ${index + 1}`}
                    className="w-full rounded-lg"
                  />
                  {getVerificationBadge(photo)}
                </div>

                {/* Photo Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold">Photo Details</h4>

                  {photo.caption && (
                    <p className="text-sm text-muted-foreground">{photo.caption}</p>
                  )}

                  {photo.metadata && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Dimensions:</span>
                        <br />
                        {photo.metadata.width} × {photo.metadata.height}
                      </div>
                      <div>
                        <span className="font-medium">Size:</span>
                        <br />
                        {(photo.metadata.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      <div>
                        <span className="font-medium">Format:</span>
                        <br />
                        {photo.metadata.format.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium">Camera:</span>
                        <br />
                        {photo.metadata.exif?.Make && photo.metadata.exif?.Model
                          ? `${photo.metadata.exif.Make} ${photo.metadata.exif.Model}`
                          : 'Unknown'}
                      </div>
                    </div>
                  )}

                  {/* EXIF Data */}
                  {photo.metadata?.exif && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">
                        Technical Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                        {JSON.stringify(photo.metadata.exif, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(photo)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(photo)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>

      {/* Photo Count and Verification Status */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          <span>{media.length} photo{media.length !== 1 ? 's' : ''}</span>
        </div>

        {verified && (
          <Badge variant="secondary" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            All photos verified
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PhotoReview;