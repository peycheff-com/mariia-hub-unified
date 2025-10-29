import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Download, ZoomIn, ZoomOut } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PhotoViewerProps {
  photos: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoViewer = ({
  photos,
  initialIndex,
  isOpen,
  onClose
}: PhotoViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDownload = async () => {
    try {
      const response = await fetch(photos[currentIndex]);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `review-photo-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download photo:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Photo Counter */}
          <div className="absolute top-4 left-4 z-50 text-white bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={photos.length <= 1}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2 bg-black/50 px-3 py-2 rounded-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsZoomed(!isZoomed)}
                className="text-white hover:bg-white/20"
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={photos.length <= 1}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Previous/Next Navigation Areas */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-0 bottom-0 w-1/4 flex items-start justify-start p-4 text-white hover:bg-white/10 transition-colors"
              />
              <button
                onClick={handleNext}
                className="absolute right-0 top-0 bottom-0 w-1/4 flex items-start justify-end p-4 text-white hover:bg-white/10 transition-colors"
              />
            </>
          )}

          {/* Main Image */}
          <div className="max-w-full max-h-full overflow-hidden">
            <img
              src={photos[currentIndex]}
              alt={`Review photo ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                isZoomed ? 'scale-150' : 'scale-100'
              }`}
              style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
              onClick={() => setIsZoomed(!isZoomed)}
            />
          </div>

          {/* Thumbnail Strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-full">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-champagne scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};