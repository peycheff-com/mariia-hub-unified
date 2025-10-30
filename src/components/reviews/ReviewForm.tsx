import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, Camera, Upload, X, CheckCircle, AlertCircle, Shield, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { useAuth } from "@/hooks/useAuth";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface Service {
  id: string;
  title: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  duration_minutes: number;
  price_pln: number;
}

interface ReviewFormData {
  rating: number;
  title: string;
  content: string;
  service_id: string;
  photos: string[];
  videos: string[];
  allow_verification: boolean;
}

const ReviewForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: '',
    content: '',
    service_id: serviceId || '',
    photos: [],
    videos: [],
    allow_verification: false
  });

  useEffect(() => {
    loadServices();
    if (serviceId) {
      loadServiceDetails(serviceId);
    }
  }, [serviceId]);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("title");

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } else {
      setServices(data || []);
    }
  };

  const loadServiceDetails = async (id: string) => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (data && !error) {
      setSelectedService(data);
      setFormData(prev => ({ ...prev, service_id: id }));
    }
  };

  const handleStarClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handlePhotoUpload = async (files: File[]) => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast aria-live="polite" aria-atomic="true"({
          title: "File too large",
          description: "Please upload photos under 5MB",
          variant: "destructive",
        });
        continue;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `review-photos/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('review-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Upload failed",
          description: uploadError.message,
          variant: "destructive",
        });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('review-media')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    setUploadedPhotos(prev => [...prev, ...uploadedUrls]);
    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...uploadedUrls] }));

    toast aria-live="polite" aria-atomic="true"({
      title: "Photos uploaded",
      description: `${uploadedUrls.length} photo(s) added to your review`,
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
    setFormData(prev => ({ ...prev, photos: newPhotos }));
  };

  const validateForm = (): boolean => {
    if (!formData.rating) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.content.trim() || formData.content.length < 20) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Review too short",
        description: "Please write at least 20 characters",
        variant: "destructive",
      });
      return false;
    }

    if (formData.content.length > 2000) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Review too long",
        description: "Please keep your review under 2000 characters",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.service_id) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Service required",
        description: "Please select a service you're reviewing",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const checkForDuplicateReview = async (serviceId: string): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("service_id", serviceId)
      .single();

    return !error && !!data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Authentication required",
        description: "Please log in to leave a review",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!validateForm()) return;

    // Check for duplicate review
    const isDuplicate = await checkForDuplicateReview(formData.service_id);
    if (isDuplicate) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Review already exists",
        description: "You have already reviewed this service. You can edit your existing review.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          service_id: formData.service_id,
          rating: formData.rating,
          title: formData.title.trim(),
          content: formData.content.trim(),
          photos: formData.photos,
          videos: formData.videos,
          source_platform: 'mariia_hub',
          metadata: {
            has_photos: formData.photos.length > 0,
            photo_count: formData.photos.length,
            allow_verification: formData.allow_verification
          }
        })
        .select()
        .single();

      if (error) throw error;

      // If photos uploaded and user opted for verification, create verification request
      if (formData.photos.length > 0 && formData.allow_verification) {
        await supabase
          .from("review_verifications")
          .insert({
            review_id: data.id,
            verification_type: 'photo',
            verification_status: 'pending',
            verification_data: {
              photo_count: formData.photos.length,
              auto_verify_enabled: true
            }
          });
      }

      // If photos uploaded, add them to review_photos table
      if (formData.photos.length > 0) {
        const photoInserts = formData.photos.map((url, index) => ({
          review_id: data.id,
          photo_url: url,
          order_index: index
        }));

        await supabase
          .from("review_photos")
          .insert(photoInserts);
      }

      toast aria-live="polite" aria-atomic="true"({
        title: "Review submitted!",
        description: "Thank you for your feedback. Your review will be visible after approval.",
      });

      // Navigate to the service page or reviews page
      if (selectedService) {
        navigate(`/service/${formData.service_id}`);
      } else {
        navigate('/reviews');
      }

    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'beauty': return 'bg-lip-rose/20 text-lip-rose border-lip-rose/30';
      case 'fitness': return 'bg-sage/20 text-sage border-sage/30';
      default: return 'bg-champagne/20 text-champagne border-champagne/30';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-champagne/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-serif">
            <Star className="w-6 h-6 text-champagne" />
            Share Your Experience
          </CardTitle>
          <CardDescription className="text-pearl/70">
            Your feedback helps others make informed decisions and helps us improve our services
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            {!serviceId && (
              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, service_id: value }));
                    const service = services.find(s => s.id === value);
                    setSelectedService(service || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service to review" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center gap-2">
                          <span>{service.title}</span>
                          <Badge variant="outline" className={getServiceTypeColor(service.service_type)}>
                            {service.service_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedService && (
              <div className="p-4 bg-champagne/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-pearl">{selectedService.title}</h3>
                    <p className="text-sm text-pearl/60">
                      {selectedService.duration_minutes} min • {selectedService.price_pln} PLN
                    </p>
                  </div>
                  <Badge className={getServiceTypeColor(selectedService.service_type)}>
                    {selectedService.service_type}
                  </Badge>
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="transition-transform hover:scale-110"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => handleStarClick(star)}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredStar || formData.rating)
                            ? "fill-champagne text-champagne"
                            : "text-pearl/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {formData.rating > 0 && (
                  <span className="text-sm text-pearl/70 ml-2">
                    {formData.rating}.0{formData.rating === 5 ? ' - Excellent!' : formData.rating >= 4 ? ' - Very Good' : formData.rating >= 3 ? ' - Good' : formData.rating >= 2 ? ' - Fair' : ' - Needs Improvement'}
                  </span>
                )}
              </div>
            </div>

            {/* Review Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                placeholder="Summarize your experience in a few words"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                maxLength={100}
              />
            </div>

            {/* Review Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Your Review *</Label>
              <Textarea
                id="content"
                placeholder="Share details about your experience. What did you like? What could be improved?"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                maxLength={2000}
              />
              <div className="text-right text-sm text-pearl/60">
                {formData.content.length}/2000 characters
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos (Optional)
              </Label>

              <div className="border-2 border-dashed border-champagne/30 rounded-lg p-6">
                <input
                  type="file"
                  id="photos"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handlePhotoUpload(files);
                  }}
                />
                <label
                  htmlFor="photos"
                  className="flex flex-col items-center justify-center cursor-pointer hover:text-champagne transition-colors"
                >
                  <Upload className="w-10 h-10 mb-2 text-pearl/50" />
                  <span className="text-pearl/70">Click to upload photos</span>
                  <span className="text-xs text-pearl/50 mt-1">PNG, JPG up to 5MB each</span>
                </label>
              </div>

              {/* Display uploaded photos */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedPhotos.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-champagne/10 rounded-lg">
                  <Shield className="w-4 h-4 text-champagne" />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_verification}
                      onChange={(e) => setFormData(prev => ({ ...prev, allow_verification: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-pearl/80">
                      Request photo verification for a verified badge
                    </span>
                  </label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button type="button" className="text-champagne hover:text-champagne/80">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Photo Verification</DialogTitle>
                        <DialogDescription>
                          By enabling photo verification, you allow us to verify that your photos are authentic
                          to your service experience. Verified reviews receive a special badge and are shown
                          more prominently to help other customers trust your feedback.
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || !user}
                className="flex-1 bg-champagne hover:bg-champagne/90 text-pearl"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>

            {!user && (
              <div className="text-center text-sm text-pearl/60">
                Please <button type="button" onClick={() => navigate('/login')} className="text-champagne hover:underline">log in</button> to submit a review
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewForm;