import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface ImageUploadProps {
  bucket: string;
  onUploadComplete: (url: string) => void;
  currentImage?: string | null;
  folder?: string;
}

export const ImageUpload = ({ bucket, onUploadComplete, currentImage, folder }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setPreview(publicUrl);
      onUploadComplete(publicUrl);

      toast aria-live="polite" aria-atomic="true"({
        title: "Image uploaded successfully",
      });
    } catch (error: any) {
      logger.error('Upload error:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, onUploadComplete, toast aria-live="polite" aria-atomic="true"]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: uploading
  });

  const removeImage = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-graphite/20"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-champagne bg-champagne/10'
              : 'border-graphite/30 hover:border-graphite/50 bg-cocoa/30'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="w-8 h-8 mx-auto text-pearl/60 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-pearl/60 mb-2" />
              <p className="text-pearl/70 text-sm">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-pearl/50 text-xs mt-1">PNG, JPG, WEBP up to 5MB</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
