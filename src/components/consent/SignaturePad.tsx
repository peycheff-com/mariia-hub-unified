import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, X, Check, Pen, Type } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignatureData } from '@/types/consent';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  onSignatureChange: (signature: SignatureData | null) => void;
  value?: SignatureData | null;
  disabled?: boolean;
  className?: string;
}

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ onSave, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, [disabled]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, disabled]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  }, []);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  }, [isEmpty, onSave]);

  return (
    <div className="space-y-4">
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Sign here with mouse or finger</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={clearCanvas}
          disabled={disabled || isEmpty}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={disabled || isEmpty}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Signature
        </Button>
      </div>
    </div>
  );
};

interface TypedSignatureProps {
  onSave: (typedText: string) => void;
  disabled?: boolean;
}

const TypedSignature: React.FC<TypedSignatureProps> = ({ onSave, disabled }) => {
  const [typedText, setTypedText] = useState('');
  const [selectedFont, setSelectedFont] = useState('cursive');

  const fonts = [
    { value: 'cursive', label: 'Cursive', style: { fontFamily: 'cursive' } },
    { value: 'serif', label: 'Serif', style: { fontFamily: 'Georgia, serif' } },
    { value: 'sans-serif', label: 'Sans Serif', style: { fontFamily: 'Arial, sans-serif' } },
  ];

  const handleSave = useCallback(() => {
    if (typedText.trim()) {
      onSave(typedText.trim());
    }
  }, [typedText]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="typed-signature">Type your signature</Label>
        <Input
          id="typed-signature"
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder="Type your full name"
          disabled={disabled}
          className="mt-2"
        />
      </div>

      <div>
        <Label>Signature Style</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {fonts.map((font) => (
            <button
              key={font.value}
              type="button"
              onClick={() => setSelectedFont(font.value)}
              disabled={disabled}
              className={cn(
                "p-3 border rounded-lg text-center transition-colors",
                selectedFont === font.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
              style={font.style}
            >
              {typedText || 'Preview'}
            </button>
          ))}
        </div>
      </div>

      {typedText && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <p
            className="text-2xl text-center"
            style={{ fontFamily: selectedFont }}
          >
            {typedText}
          </p>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={disabled || !typedText.trim()}
        className="w-full"
      >
        <Check className="w-4 h-4 mr-2" />
        Save Typed Signature
      </Button>
    </div>
  );
};

interface UploadSignatureProps {
  onSave: (fileData: string, fileName: string) => void;
  disabled?: boolean;
}

const UploadSignature: React.FC<UploadSignatureProps> = ({ onSave, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload an image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(() => {
    if (selectedFile && preview) {
      onSave(preview, selectedFile.name);
    }
  }, [selectedFile, preview]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-2">
          Drag and drop your signature image here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="mt-4"
        >
          Choose File
        </Button>
      </div>

      {preview && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <img
              src={preview}
              alt="Signature preview"
              className="max-h-32 mx-auto border border-gray-200 rounded"
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              {selectedFile?.name}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearFile}
              disabled={disabled}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={disabled}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Use This Signature
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  value,
  disabled,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [currentSignature, setCurrentSignature] = useState<SignatureData | null>(value || null);

  useEffect(() => {
    onSignatureChange(currentSignature);
  }, [currentSignature, onSignatureChange]);

  const handleDrawnSignature = useCallback((dataUrl: string) => {
    const signature: SignatureData = {
      type: 'drawn',
      data: dataUrl,
      timestamp: new Date().toISOString()
    };
    setCurrentSignature(signature);
  }, []);

  const handleTypedSignature = useCallback((typedText: string) => {
    const signature: SignatureData = {
      type: 'typed',
      data: typedText,
      timestamp: new Date().toISOString()
    };
    setCurrentSignature(signature);
  }, []);

  const handleUploadSignature = useCallback((fileData: string, fileName: string) => {
    const signature: SignatureData = {
      type: 'uploaded',
      data: fileData,
      timestamp: new Date().toISOString()
    };
    setCurrentSignature(signature);
  }, []);

  const clearSignature = useCallback(() => {
    setCurrentSignature(null);
  }, []);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Digital Signature</span>
          {currentSignature && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSignature}
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {currentSignature ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Current Signature:</p>
              {currentSignature.type === 'drawn' || currentSignature.type === 'uploaded' ? (
                <img
                  src={currentSignature.data}
                  alt="Signature"
                  className="max-h-24 mx-auto border border-gray-200 rounded bg-white"
                />
              ) : (
                <p className="text-xl text-center italic">{currentSignature.data}</p>
              )}
              <p className="text-xs text-gray-500 mt-2 text-center">
                Signed: {new Date(currentSignature.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentSignature(null)}
                disabled={disabled}
              >
                Change Signature
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draw" className="flex items-center gap-2">
                <Pen className="w-4 h-4" />
                Draw
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Type
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draw" className="mt-6">
              <SignatureCanvas onSave={handleDrawnSignature} disabled={disabled} />
            </TabsContent>

            <TabsContent value="type" className="mt-6">
              <TypedSignature onSave={handleTypedSignature} disabled={disabled} />
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
              <UploadSignature onSave={handleUploadSignature} disabled={disabled} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default SignaturePad;