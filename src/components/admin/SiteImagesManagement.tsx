import { useState, useEffect } from "react";
import { Pencil, Trash2, Upload, Image as ImageIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

import { ImageUpload } from "./ImageUpload";

interface SiteImage {
  id: string;
  key: string;
  title: string;
  description: string | null;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_active: boolean;
}

const SiteImagesManagement = () => {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<SiteImage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    key: "",
    title: "",
    description: "",
    image_url: "",
    alt_text: "",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from("site_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading images",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (url: string) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingImage) {
        const { error } = await supabase
          .from("site_images")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingImage.id);

        if (error) throw error;

        toast({
          title: "Image updated",
          description: "Site image has been updated successfully",
        });
      } else {
        const { error } = await supabase.from("site_images").insert([formData]);

        if (error) throw error;

        toast({
          title: "Image added",
          description: "New site image has been added successfully",
        });
      }

      fetchImages();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (image: SiteImage) => {
    setEditingImage(image);
    setFormData({
      key: image.key,
      title: image.title,
      description: image.description || "",
      image_url: image.image_url,
      alt_text: image.alt_text || "",
      display_order: image.display_order,
      is_active: image.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const { error } = await supabase.from("site_images").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Image deleted",
        description: "Site image has been deleted successfully",
      });

      fetchImages();
    } catch (error: any) {
      toast({
        title: "Error deleting image",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("site_images")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      fetchImages();
      toast({
        title: "Status updated",
        description: `Image ${!currentStatus ? "activated" : "deactivated"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      key: "",
      title: "",
      description: "",
      image_url: "",
      alt_text: "",
      display_order: 0,
      is_active: true,
    });
    setEditingImage(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading site images...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Images Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all images across the website (hero, about, logos, etc.)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Upload className="w-4 h-4 mr-2" />
              Add New Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? "Edit Image" : "Add New Image"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="key">Key (Unique Identifier)*</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="e.g., hero-main, about-photo"
                  required
                  disabled={!!editingImage}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use kebab-case. This is used to identify the image in code.
                </p>
              </div>

              <div>
                <Label htmlFor="title">Title*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description of where/how this image is used"
                />
              </div>

              <div>
                <Label>Image Upload*</Label>
                <ImageUpload
                  bucket="site-images"
                  onUploadComplete={handleImageUpload}
                  currentImage={formData.image_url} alt="Image" />
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="alt_text">Alt Text (SEO)*</Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) =>
                    setFormData({ ...formData, alt_text: e.target.value })
                  }
                  placeholder="Descriptive alt text for accessibility"
                  required
                />
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingImage ? "Update" : "Add"} Image
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Site Images ({images.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Alt Text</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <div className="w-16 h-16 rounded overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || image.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {image.key}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{image.title}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {image.alt_text}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={image.is_active}
                      onCheckedChange={() =>
                        toggleActive(image.id, image.is_active)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(image)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Keys Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-primary">Hero Images:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>hero-main</code> - Homepage hero</li>
                <li><code>hero-beauty</code> - Beauty section</li>
                <li><code>hero-fitness</code> - Fitness section</li>
                <li><code>hero-lifestyle</code> - Lifestyle section</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary">Profile & Brand:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>about-mariia</code> - About page photo</li>
                <li><code>profile-mariia</code> - Profile picture</li>
                <li><code>logo</code> - Main site logo</li>
                <li><code>favicon</code> - Browser icon</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-primary">Service Images:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code>service-[name]</code> - Service thumbnails</li>
                <li><code>og-image</code> - Social media preview</li>
                <li><code>404-image</code> - Error page</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteImagesManagement;