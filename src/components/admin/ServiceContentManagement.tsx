import { useState, useEffect } from "react";
import { FileText, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceContent {
  id: string;
  service_id: string;
  preparation_instructions: string | null;
  aftercare_instructions: string | null;
  what_to_expect: string[] | null;
  contraindications: string[] | null;
}

interface Service {
  id: string;
  title: string;
}

const ServiceContentManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [content, setContent] = useState<ServiceContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    preparation_instructions: "",
    aftercare_instructions: "",
    what_to_expect: "",
    contraindications: ""
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      loadContent();
    }
  }, [selectedServiceId]);

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, title")
      .eq("is_active", true)
      .order("title");

    setServices(data || []);
    setLoading(false);
  };

  const loadContent = async () => {
    const { data } = await supabase
      .from("service_content")
      .select("*")
      .eq("service_id", selectedServiceId)
      .maybeSingle();

    setContent(data);
    
    if (data) {
      setFormData({
        preparation_instructions: data.preparation_instructions || "",
        aftercare_instructions: data.aftercare_instructions || "",
        what_to_expect: data.what_to_expect?.join("\n") || "",
        contraindications: data.contraindications?.join("\n") || ""
      });
    } else {
      setFormData({
        preparation_instructions: "",
        aftercare_instructions: "",
        what_to_expect: "",
        contraindications: ""
      });
    }
  };

  const handleSave = async () => {
    if (!selectedServiceId) {
      toast({
        title: "Please select a service",
        variant: "destructive",
      });
      return;
    }

    const contentData = {
      service_id: selectedServiceId,
      preparation_instructions: formData.preparation_instructions || null,
      aftercare_instructions: formData.aftercare_instructions || null,
      what_to_expect: formData.what_to_expect 
        ? formData.what_to_expect.split("\n").filter(line => line.trim()) 
        : null,
      contraindications: formData.contraindications 
        ? formData.contraindications.split("\n").filter(line => line.trim()) 
        : null
    };

    if (content) {
      const { error } = await supabase
        .from("service_content")
        .update(contentData)
        .eq("id", content.id);

      if (error) {
        toast({
          title: "Error updating content",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Content updated successfully" });
        loadContent();
      }
    } else {
      const { error } = await supabase
        .from("service_content")
        .insert([contentData]);

      if (error) {
        toast({
          title: "Error creating content",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Content created successfully" });
        loadContent();
      }
    }
  };

  if (loading) return <div className="text-pearl">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-pearl">Service Content Management</h2>
      </div>

      <Card className="bg-charcoal/50 border-graphite/20 p-6">
        <div className="space-y-6">
          <div>
            <Label className="text-pearl/70">Select Service</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="bg-cocoa/50 border-graphite/20 text-pearl">
                <SelectValue placeholder="Choose a service to edit" />
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

          {selectedServiceId && (
            <>
              <div>
                <Label className="text-pearl/70">Preparation Instructions</Label>
                <Textarea
                  value={formData.preparation_instructions}
                  onChange={(e) => setFormData({ ...formData, preparation_instructions: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl mt-2"
                  rows={5}
                  placeholder="Enter preparation instructions..."
                />
                <p className="text-pearl/50 text-xs mt-1">Instructions for clients before the service</p>
              </div>

              <div>
                <Label className="text-pearl/70">Aftercare Instructions</Label>
                <Textarea
                  value={formData.aftercare_instructions}
                  onChange={(e) => setFormData({ ...formData, aftercare_instructions: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl mt-2"
                  rows={5}
                  placeholder="Enter aftercare instructions..."
                />
                <p className="text-pearl/50 text-xs mt-1">Instructions for clients after the service</p>
              </div>

              <div>
                <Label className="text-pearl/70">What to Expect (one per line)</Label>
                <Textarea
                  value={formData.what_to_expect}
                  onChange={(e) => setFormData({ ...formData, what_to_expect: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl mt-2"
                  rows={5}
                  placeholder="Enter what clients should expect (one point per line)..."
                />
                <p className="text-pearl/50 text-xs mt-1">Each line will be a separate bullet point</p>
              </div>

              <div>
                <Label className="text-pearl/70">Contraindications (one per line)</Label>
                <Textarea
                  value={formData.contraindications}
                  onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl mt-2"
                  rows={5}
                  placeholder="Enter contraindications (one per line)..."
                />
                <p className="text-pearl/50 text-xs mt-1">Medical conditions or situations where service shouldn't be performed</p>
              </div>

              <Button 
                onClick={handleSave}
                className="w-full bg-champagne text-charcoal hover:bg-champagne/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Content
              </Button>
            </>
          )}

          {!selectedServiceId && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-pearl/30 mx-auto mb-4" />
              <p className="text-pearl/60">Select a service to manage its content</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ServiceContentManagement;
