import { useState, useEffect } from "react";
import { Plus, Trash2, Star, Image as ImageIcon, Sparkles } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { ImageUpload } from "./ImageUpload";


interface GalleryImage {
  id: string;
  service_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_featured: boolean;
  services?: {
    title: string;
  };
}

interface Service {
  id: string;
  title: string;
  slug?: string;
}

const ServiceGalleryManagement = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    service_id: "",
    image_url: "",
    caption: "",
    is_featured: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: imagesData }, { data: servicesData }] = await Promise.all([
      supabase
        .from("service_gallery")
        .select("*, services(title)")
        .order("display_order", { ascending: true }),
      supabase
        .from("services")
        .select("id, title, slug")
        .eq("is_active", true)
        .order("title")
    ]);

    setImages(imagesData || []);
    setServices(servicesData || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url) {
      toast({
        title: "Please upload an image",
        variant: "destructive",
      });
      return;
    }

    const maxOrder = Math.max(...images.filter(i => i.service_id === formData.service_id).map(i => i.display_order), -1);

    const { error } = await supabase
      .from("service_gallery")
      .insert([{
        service_id: formData.service_id,
        image_url: formData.image_url,
        caption: formData.caption || null,
        is_featured: formData.is_featured,
        display_order: maxOrder + 1
      }]);

    if (error) {
      toast({
        title: "Error adding image",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Image added successfully" });
      setDialogOpen(false);
      loadData();
      resetForm();
    }
  };

  const generateWithAI = async () => {
    try {
      if (!formData.service_id) {
        toast({ title: 'Select a service first', variant: 'destructive' });
        return;
      }
      const svc = services.find(s => s.id === formData.service_id);
      const prompt = `Luxury gallery image for ${svc?.title}. Photorealistic, clean composition matching cocoa/champagne palette. Square crop (1:1). No text or logos.`;
      toast({ title: 'Generating image…', description: svc?.title });
      const { data, error } = await (supabase as any).functions.invoke('generate-image', { body: { prompt } });
      if (error || !data?.imageUrl) throw new Error(error?.message || 'Failed to generate');

      const res = await fetch(data.imageUrl);
      const blob = await res.blob();
      const filePath = `services/${svc?.slug || svc?.id}/gallery-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from('gallery-images').upload(filePath, blob, { upsert: true, cacheControl: '3600', contentType: 'image/png' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('gallery-images').getPublicUrl(filePath);
      const publicUrl = pub?.publicUrl;
      const maxOrder = Math.max(...images.filter(i => i.service_id === formData.service_id).map(i => i.display_order), -1);
      const { error: ins } = await supabase.from('service_gallery').insert([{ service_id: formData.service_id, image_url: publicUrl, caption: formData.caption || null, is_featured: false, display_order: maxOrder + 1 }]);
      if (ins) throw ins;
      toast({ title: 'Image generated & added' });
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (e: any) {
      toast({ title: 'AI generation failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      service_id: "",
      image_url: "",
      caption: "",
      is_featured: false
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;

    const { error } = await supabase
      .from("service_gallery")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting image",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Image deleted" });
      loadData();
    }
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("service_gallery")
      .update({ is_featured: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating image",
        description: error.message,
        variant: "destructive",
      });
    } else {
      loadData();
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const serviceId = result.source.droppableId;
    const serviceImages = images.filter(i => i.service_id === serviceId);
    const reorderedImages = Array.from(serviceImages);
    const [removed] = reorderedImages.splice(result.source.index, 1);
    reorderedImages.splice(result.destination.index, 0, removed);

    // Update display_order for all affected images
    const updates = reorderedImages.map((img, index) => ({
      id: img.id,
      display_order: index
    }));

    for (const update of updates) {
      await supabase
        .from("service_gallery")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }

    loadData();
  };

  if (loading) return <div className="text-pearl">Loading gallery...</div>;

  // Group images by service
  const imagesByService = images.reduce((acc, img) => {
    if (!acc[img.service_id]) acc[img.service_id] = [];
    acc[img.service_id].push(img);
    return acc;
  }, {} as Record<string, GalleryImage[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-pearl">Gallery Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-champagne text-charcoal hover:bg-champagne/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-charcoal border-graphite/20">
            <DialogHeader>
              <DialogTitle className="text-pearl">Add Gallery Image</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-pearl/70">Service</Label>
                <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                  <SelectTrigger className="bg-cocoa/50 border-graphite/20 text-pearl">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-pearl/70">Image</Label>
                <ImageUpload
                  bucket="gallery-images"
                  folder="services"
                  currentImage={formData.image_url}
                  onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
                />
              </div>

              <div>
                <Label className="text-pearl/70">Caption</Label>
                <Input
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                  placeholder="Optional caption"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label className="text-pearl/70">Featured Image</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90">
                  Add Image
                </Button>
                <Button type="button" variant="outline" className="flex-1 gap-2" onClick={generateWithAI}>
                  <Sparkles className="w-4 h-4" /> Generate with AI
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(imagesByService).map(([serviceId, serviceImages]) => {
          const service = services.find(s => s.id === serviceId);
          return (
            <Card key={serviceId} className="bg-charcoal/50 border-graphite/20 p-6">
              <h3 className="text-lg font-medium text-pearl mb-4">{service?.title}</h3>
              <Droppable droppableId={serviceId} direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {serviceImages.map((img, index) => (
                      <Draggable key={img.id} draggableId={img.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`relative group ${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <img
                              src={img.image_url}
                              alt={img.caption || ''}
                              className="w-full h-40 object-cover rounded-lg border border-graphite/20"
                            />
                            {img.is_featured && (
                              <Star className="absolute top-2 left-2 w-5 h-5 text-yellow-400 fill-yellow-400" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleFeatured(img.id, img.is_featured)}
                                className="border-graphite/20 text-pearl"
                              >
                                <Star className={`w-4 h-4 ${img.is_featured ? 'fill-yellow-400' : ''}`} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(img.id)}
                                className="border-red-500/20 text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            {img.caption && (
                              <p className="text-pearl/70 text-xs mt-1 truncate">{img.caption}</p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          );
        })}
      </DragDropContext>

      {images.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-pearl/30 mx-auto mb-4" alt="Service gallery image" />
          <p className="text-pearl/60">No gallery images yet</p>
        </div>
      )}
    </div>
  );
};

export default ServiceGalleryManagement;
