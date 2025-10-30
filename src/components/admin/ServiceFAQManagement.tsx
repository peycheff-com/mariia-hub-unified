import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, HelpCircle, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FAQ {
  id: string;
  service_id: string;
  question: string;
  answer: string;
  display_order: number;
  services?: {
    title: string;
  };
}

interface Service {
  id: string;
  title: string;
}

const ServiceFAQManagement = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [formData, setFormData] = useState({
    service_id: "",
    question: "",
    answer: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: faqsData }, { data: servicesData }] = await Promise.all([
      supabase
        .from("service_faqs")
        .select("*, services(title)")
        .order("display_order", { ascending: true }),
      supabase
        .from("services")
        .select("id, title")
        .eq("is_active", true)
        .order("title")
    ]);

    setFaqs(faqsData || []);
    setServices(servicesData || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingFAQ) {
      const { error } = await supabase
        .from("service_faqs")
        .update({
          question: formData.question,
          answer: formData.answer
        })
        .eq("id", editingFAQ.id);

      if (error) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error updating FAQ",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast aria-live="polite" aria-atomic="true"({ title: "FAQ updated successfully" });
        setDialogOpen(false);
        loadData();
        resetForm();
      }
    } else {
      const maxOrder = Math.max(...faqs.filter(f => f.service_id === formData.service_id).map(f => f.display_order), -1);

      const { error } = await supabase
        .from("service_faqs")
        .insert([{
          service_id: formData.service_id,
          question: formData.question,
          answer: formData.answer,
          display_order: maxOrder + 1
        }]);

      if (error) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error adding FAQ",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast aria-live="polite" aria-atomic="true"({ title: "FAQ added successfully" });
        setDialogOpen(false);
        loadData();
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      service_id: "",
      question: "",
      answer: ""
    });
    setEditingFAQ(null);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      service_id: faq.service_id,
      question: faq.question,
      answer: faq.answer
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;

    const { error } = await supabase
      .from("service_faqs")
      .delete()
      .eq("id", id);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error deleting FAQ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({ title: "FAQ deleted" });
      loadData();
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const serviceId = result.source.droppableId;
    const serviceFaqs = faqs.filter(f => f.service_id === serviceId);
    const reorderedFaqs = Array.from(serviceFaqs);
    const [removed] = reorderedFaqs.splice(result.source.index, 1);
    reorderedFaqs.splice(result.destination.index, 0, removed);

    const updates = reorderedFaqs.map((faq, index) => ({
      id: faq.id,
      display_order: index
    }));

    for (const update of updates) {
      await supabase
        .from("service_faqs")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }

    loadData();
  };

  if (loading) return <div className="text-pearl">Loading FAQs...</div>;

  const faqsByService = faqs.reduce((acc, faq) => {
    if (!acc[faq.service_id]) acc[faq.service_id] = [];
    acc[faq.service_id].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-pearl">FAQs Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-champagne text-charcoal hover:bg-champagne/90">
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-charcoal border-graphite/20">
            <DialogHeader>
              <DialogTitle className="text-pearl">
                {editingFAQ ? "Edit FAQ" : "Add FAQ"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingFAQ && (
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
              )}

              <div>
                <Label className="text-pearl/70">Question</Label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                  required
                />
              </div>

              <div>
                <Label className="text-pearl/70">Answer</Label>
                <Textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-champagne text-charcoal hover:bg-champagne/90">
                {editingFAQ ? "Update FAQ" : "Add FAQ"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {Object.entries(faqsByService).map(([serviceId, serviceFaqs]) => {
          const service = services.find(s => s.id === serviceId);
          return (
            <Card key={serviceId} className="bg-charcoal/50 border-graphite/20 p-6">
              <h3 className="text-lg font-medium text-pearl mb-4">{service?.title}</h3>
              <Droppable droppableId={serviceId}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                    {serviceFaqs.map((faq, index) => (
                      <Draggable key={faq.id} draggableId={faq.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 bg-cocoa/30 rounded-lg ${snapshot.isDragging ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab pt-1">
                                <GripVertical className="w-5 h-5 text-pearl/40" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-pearl font-medium mb-1">{faq.question}</h4>
                                <p className="text-pearl/60 text-sm">{faq.answer}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(faq)}
                                  className="border-graphite/20 text-pearl hover:bg-cocoa/50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(faq.id)}
                                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
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

      {faqs.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="w-12 h-12 text-pearl/30 mx-auto mb-4" />
          <p className="text-pearl/60">No FAQs yet</p>
        </div>
      )}
    </div>
  );
};

export default ServiceFAQManagement;
