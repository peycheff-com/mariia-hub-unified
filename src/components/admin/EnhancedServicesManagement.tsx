import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Sparkles, Search, Languages, GripVertical, BarChart3, Upload, Download, Copy, Image as ImageIcon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { ImageUpload } from "./ImageUpload";


interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  category: string | null;
  price_from: number | null;
  price_to: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  is_package: boolean;
  package_sessions: number | null;
  image_url: string | null;
  features: string[] | null;
  stripe_price_id: string | null;
  display_order: number;
  translations?: {
    title?: { en?: string; pl?: string; ua?: string; ru?: string };
    description?: { en?: string; pl?: string; ua?: string; ru?: string };
    features?: { en?: string[]; pl?: string[]; ua?: string[]; ru?: string[] };
  };
}

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'ua', label: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
];

const CATEGORIES = {
  beauty: ['PMU', 'Brows', 'Lips', 'Lashes', 'Skincare', 'Other'],
  fitness: ['Personal Training', 'Group Classes', 'Programs', 'Consultations', 'Other']
};

const EnhancedServicesManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'beauty' | 'fitness'>('beauty');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [translating, setTranslating] = useState(false);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  const [formData, setFormData] = useState({
    title: { en: '', pl: '', ua: '', ru: '' },
    description: { en: '', pl: '', ua: '', ru: '' },
    features: { en: [] as string[], pl: [] as string[], ua: [] as string[], ru: [] as string[] },
    slug: "",
    service_type: "beauty",
    category: "",
    price_from: "",
    price_to: "",
    duration_minutes: "",
    is_active: true,
    is_package: false,
    package_sessions: "",
    image_url: "",
    stripe_price_id: "",
    display_order: "0"
  });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, activeTab, searchQuery, categoryFilter]);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error loading services",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setServices((data || []) as Service[]);
    }
    setLoading(false);
  };

  const filterServices = () => {
    let filtered = services.filter(s => s.service_type === activeTab);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.slug.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }
    
    setFilteredServices(filtered);
  };

  const handleAutoTranslate = async (sourceText: string, type: 'title' | 'description' | 'features', sourceLang: string) => {
    if (!sourceText) {
      toast aria-live="polite" aria-atomic="true"({
        title: "No text to translate",
        description: `Please enter ${sourceLang.toUpperCase()} text first`,
        variant: "destructive",
      });
      return;
    }

    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-service', {
        body: {
          text: sourceText,
          sourceLanguage: sourceLang,
          type
        }
      });

      if (error) throw error;

      if (type === 'features') {
        // Convert translated strings back to arrays
        const translatedFeatures: any = {};
        for (const [lang, value] of Object.entries(data.translations)) {
          translatedFeatures[lang] = typeof value === 'string' 
            ? value.split('\n').filter(f => f.trim()) 
            : (Array.isArray(value) ? value : []);
        }
        setFormData(prev => ({
          ...prev,
          features: {
            ...prev.features,
            ...translatedFeatures
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            ...data.translations
          }
        }));
      }

      toast aria-live="polite" aria-atomic="true"({
        title: "Translation complete",
        description: "Content translated to all languages",
      });
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Translation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const serviceData = {
      title: formData.title.en,
      slug: formData.slug,
      description: formData.description.en,
      service_type: formData.service_type as 'beauty' | 'fitness' | 'lifestyle',
      category: formData.category || null,
      price_from: formData.price_from ? parseFloat(formData.price_from) : null,
      price_to: formData.price_to ? parseFloat(formData.price_to) : null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      is_active: formData.is_active,
      is_package: formData.is_package,
      package_sessions: formData.package_sessions ? parseInt(formData.package_sessions) : null,
      image_url: formData.image_url || null,
      features: formData.features.en.filter(f => f.trim()),
      stripe_price_id: formData.stripe_price_id || null,
      display_order: parseInt(formData.display_order),
      translations: {
        title: formData.title,
        description: formData.description,
        features: formData.features
      }
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);

      if (error) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error updating service",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast aria-live="polite" aria-atomic="true"({ title: "Service updated successfully" });
        setDialogOpen(false);
        loadServices();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("services")
        .insert([serviceData]);

      if (error) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error creating service",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast aria-live="polite" aria-atomic="true"({ title: "Service created successfully" });
        setDialogOpen(false);
        loadServices();
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: { en: '', pl: '', ua: '', ru: '' },
      description: { en: '', pl: '', ua: '', ru: '' },
      features: { en: [], pl: [], ua: [], ru: [] },
      slug: "",
      service_type: activeTab,
      category: "",
      price_from: "",
      price_to: "",
      duration_minutes: "",
      is_active: true,
      is_package: false,
      package_sessions: "",
      image_url: "",
      stripe_price_id: "",
      display_order: "0"
    });
    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: {
        en: service.translations?.title?.en || service.title || '',
        pl: service.translations?.title?.pl || '',
        ua: service.translations?.title?.ua || '',
        ru: service.translations?.title?.ru || ''
      },
      description: {
        en: service.translations?.description?.en || service.description || '',
        pl: service.translations?.description?.pl || '',
        ua: service.translations?.description?.ua || '',
        ru: service.translations?.description?.ru || ''
      },
      features: {
        en: (() => {
          const feat = service.translations?.features?.en || service.features;
          if (Array.isArray(feat)) return feat;
          if (typeof feat === 'string') return (feat as string).split('\n').filter(f => f.trim());
          return [];
        })(),
        pl: (() => {
          const feat = service.translations?.features?.pl;
          if (Array.isArray(feat)) return feat;
          if (typeof feat === 'string') return (feat as string).split('\n').filter(f => f.trim());
          return [];
        })(),
        ua: (() => {
          const feat = service.translations?.features?.ua;
          if (Array.isArray(feat)) return feat;
          if (typeof feat === 'string') return (feat as string).split('\n').filter(f => f.trim());
          return [];
        })(),
        ru: (() => {
          const feat = service.translations?.features?.ru;
          if (Array.isArray(feat)) return feat;
          if (typeof feat === 'string') return (feat as string).split('\n').filter(f => f.trim());
          return [];
        })()
      },
      slug: service.slug,
      service_type: service.service_type,
      category: service.category || "",
      price_from: service.price_from?.toString() || "",
      price_to: service.price_to?.toString() || "",
      duration_minutes: service.duration_minutes?.toString() || "",
      is_active: service.is_active,
      is_package: service.is_package,
      package_sessions: service.package_sessions?.toString() || "",
      image_url: service.image_url || "",
      stripe_price_id: service.stripe_price_id || "",
      display_order: service.display_order.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error deleting service",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({ title: "Service deleted successfully" });
      loadServices();
    }
  };

  const handleDuplicate = (service: Service) => {
    setEditingService(null);
    setFormData({
      title: {
        en: service.translations?.title?.en || service.title || '',
        pl: service.translations?.title?.pl || '',
        ua: service.translations?.title?.ua || '',
        ru: service.translations?.title?.ru || ''
      },
      description: {
        en: service.translations?.description?.en || service.description || '',
        pl: service.translations?.description?.pl || '',
        ua: service.translations?.description?.ua || '',
        ru: service.translations?.description?.ru || ''
      },
      features: {
        en: service.translations?.features?.en || service.features || [],
        pl: service.translations?.features?.pl || [],
        ua: service.translations?.features?.ua || [],
        ru: service.translations?.features?.ru || []
      },
      slug: `${service.slug}-copy`,
      service_type: service.service_type,
      category: service.category || "",
      price_from: service.price_from?.toString() || "",
      price_to: service.price_to?.toString() || "",
      duration_minutes: service.duration_minutes?.toString() || "",
      is_active: false,
      is_package: service.is_package,
      package_sessions: service.package_sessions?.toString() || "",
      image_url: service.image_url || "",
      stripe_price_id: "",
      display_order: (services.length).toString()
    });
    setDialogOpen(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(filteredServices);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((item, index) => ({
      id: item.id,
      display_order: index
    }));

    setFilteredServices(items);

    for (const update of updates) {
      await supabase
        .from("services")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }

    toast aria-live="polite" aria-atomic="true"({ title: "Order updated successfully" });
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedServices.size === 0) {
      toast aria-live="polite" aria-atomic="true"({
        title: "No services selected",
        description: "Please select services first",
        variant: "destructive",
      });
      return;
    }

    if (action === 'delete' && !confirm(`Delete ${selectedServices.size} service(s)?`)) {
      return;
    }

    const ids = Array.from(selectedServices);

    if (action === 'delete') {
      await supabase.from("services").delete().in("id", ids);
      toast aria-live="polite" aria-atomic="true"({ title: `${ids.length} service(s) deleted` });
    } else {
      await supabase
        .from("services")
        .update({ is_active: action === 'activate' })
        .in("id", ids);
      toast aria-live="polite" aria-atomic="true"({ title: `${ids.length} service(s) ${action}d` });
    }

    setSelectedServices(new Set());
    loadServices();
  };

  const generateHeroImage = async (service: Service) => {
    try {
      toast aria-live="polite" aria-atomic="true"({ title: 'Generating image…', description: service.title });
      const basePrompt = service.service_type === 'beauty'
        ? `Luxury PMU hero for ${service.title}. Photorealistic close-up implying natural results; cocoa/champagne palette (#8B4513, #F5DEB3); 16:9 with right-side negative space; soft studio light; no text or logos.`
        : `Luxury fitness hero for ${service.title}. Photorealistic boutique-gym scene; women-first aesthetic; subtle cyan within cocoa/champagne palette; 16:9 with right-side negative space; no text.`;
      const { data, error } = await (supabase as any).functions.invoke('generate-image', {
        body: { prompt: basePrompt }
      });
      if (error || !data?.imageUrl) throw new Error(error?.message || 'Failed to generate');

      const res = await fetch(data.imageUrl);
      const blob = await res.blob();
      const filePath = `services/${service.slug}-hero.png`;
      const { error: upErr } = await supabase.storage.from('service-images').upload(filePath, blob, { upsert: true, cacheControl: '3600', contentType: 'image/png' });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('service-images').getPublicUrl(filePath);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error('Public URL missing');
      const { error: upd } = await supabase.from('services').update({ image_url: publicUrl }).eq('id', service.id);
      if (upd) throw upd;
      toast aria-live="polite" aria-atomic="true"({ title: 'Hero image updated', description: service.title });
      loadServices();
    } catch (e: any) {
      toast aria-live="polite" aria-atomic="true"({ title: 'Image generation failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const stats = {
    total: services.length,
    beauty: services.filter(s => s.service_type === 'beauty').length,
    fitness: services.filter(s => s.service_type === 'fitness').length,
    active: services.filter(s => s.is_active).length,
    packages: services.filter(s => s.is_package).length,
  };

  if (loading) {
    return <div className="text-pearl">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-charcoal/50 border-graphite/20 p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-champagne" />
            <span className="text-pearl/60 text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-pearl mt-1">{stats.total}</p>
        </Card>
        <Card className="bg-charcoal/50 border-graphite/20 p-4">
          <span className="text-pearl/60 text-sm">Beauty</span>
          <p className="text-2xl font-bold text-pearl mt-1">{stats.beauty}</p>
        </Card>
        <Card className="bg-charcoal/50 border-graphite/20 p-4">
          <span className="text-pearl/60 text-sm">Fitness</span>
          <p className="text-2xl font-bold text-pearl mt-1">{stats.fitness}</p>
        </Card>
        <Card className="bg-charcoal/50 border-graphite/20 p-4">
          <span className="text-pearl/60 text-sm">Active</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
        </Card>
        <Card className="bg-charcoal/50 border-graphite/20 p-4">
          <span className="text-pearl/60 text-sm">Packages</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.packages}</p>
        </Card>
      </div>

      {/* Header with Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-auto">
          <TabsList className="bg-charcoal/50">
            <TabsTrigger value="beauty">Beauty ({stats.beauty})</TabsTrigger>
            <TabsTrigger value="fitness">Fitness ({stats.fitness})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-champagne text-charcoal hover:bg-champagne/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pearl/40" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-charcoal/50 border-graphite/20 text-pearl"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-charcoal/50 border-graphite/20 text-pearl">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES[activeTab].map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedServices.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedServices.size} selected</Badge>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
              Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
              Deactivate
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Services List with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="services">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {filteredServices.map((service, index) => (
                <Draggable key={service.id} draggableId={service.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-charcoal/50 border-graphite/20 p-4 ${
                        snapshot.isDragging ? 'shadow-lg ring-2 ring-champagne/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div {...provided.dragHandleProps} className="mt-2">
                          <GripVertical className="w-5 h-5 text-pearl/30 cursor-grab active:cursor-grabbing" />
                        </div>

                        <input
                          type="checkbox"
                          checked={selectedServices.has(service.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedServices);
                            if (e.target.checked) {
                              newSet.add(service.id);
                            } else {
                              newSet.delete(service.id);
                            }
                            setSelectedServices(newSet);
                          }}
                          className="mt-2"
                        />

                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-medium text-pearl">{service.title}</h3>
                                {service.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {service.category}
                                  </Badge>
                                )}
                                {!service.is_active && (
                                  <Badge variant="destructive" className="text-xs">
                                    Inactive
                                  </Badge>
                                )}
                                {service.is_package && (
                                  <Badge className="text-xs bg-blue-500/20 text-blue-400">
                                    {service.package_sessions} sessions
                                  </Badge>
                                )}
                                {service.translations && Object.keys(service.translations.title).length > 1 && (
                                  <Badge className="text-xs bg-emerald-500/20 text-emerald-400">
                                    <Languages className="w-3 h-3 mr-1" />
                                    {Object.keys(service.translations.title).length} languages
                                  </Badge>
                                )}
                              </div>
                              <p className="text-pearl/60 text-sm mt-1 line-clamp-2">
                                {service.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-pearl/50">
                                {service.price_from && (
                                  <span>
                                    {service.price_from === service.price_to
                                      ? `${service.price_from} PLN`
                                      : `${service.price_from}${service.price_to ? ` - ${service.price_to}` : '+'} PLN`}
                                  </span>
                                )}
                                {service.duration_minutes && (
                                  <span>{service.duration_minutes} min</span>
                                )}
                                <span className="text-pearl/30">#{service.display_order}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicate(service)}
                                className="text-pearl/60 hover:text-pearl"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => generateHeroImage(service)}
                                className="text-pearl/60 hover:text-pearl"
                                title="Generate hero image with AI"
                              >
                                <ImageIcon className="w-4 h-4" alt="" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                className="text-pearl/60 hover:text-pearl"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                className="text-red-400/60 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-pearl/30 mx-auto mb-4" />
          <p className="text-pearl/60">
            {searchQuery || categoryFilter !== 'all'
              ? "No services match your filters"
              : `No ${activeTab} services yet. Create your first one!`}
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="bg-charcoal border-graphite/20 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pearl text-xl">
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-pearl/70">Service Type</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value: any) => setFormData({ ...formData, service_type: value })}
                  >
                    <SelectTrigger className="bg-cocoa/50 border-graphite/20 text-pearl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-pearl/70">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-cocoa/50 border-graphite/20 text-pearl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {CATEGORIES[formData.service_type as 'beauty' | 'fitness'].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-pearl/70">URL Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                  placeholder="permanent-makeup-lips"
                  required
                />
              </div>
            </div>

            {/* Multi-language Content */}
            <Tabs defaultValue="en" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-cocoa/50">
                  {LANGUAGES.map(lang => (
                    <TabsTrigger key={lang.code} value={lang.code} className="gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Detect which language has content
                    let sourceLang = 'en';
                    if (formData.title.pl) sourceLang = 'pl';
                    else if (formData.title.ru) sourceLang = 'ru';
                    else if (formData.title.ua) sourceLang = 'ua';
                    
                    const sourceTitle = formData.title[sourceLang as keyof typeof formData.title];
                    const sourceDesc = formData.description[sourceLang as keyof typeof formData.description];
                    const sourceFeatures = Array.isArray(formData.features[sourceLang as keyof typeof formData.features]) 
                      ? formData.features[sourceLang as keyof typeof formData.features] as string[]
                      : [];
                    
                    if (sourceTitle) handleAutoTranslate(sourceTitle, 'title', sourceLang);
                    if (sourceDesc) handleAutoTranslate(sourceDesc, 'description', sourceLang);
                    if (sourceFeatures.length > 0) handleAutoTranslate(sourceFeatures.join('\n'), 'features', sourceLang);
                  }}
                  disabled={translating || (!formData.title.en && !formData.title.pl && !formData.title.ru && !formData.title.ua)}
                  className="border-graphite/20"
                >
                  <Sparkles className={`w-4 h-4 mr-2 ${translating ? 'animate-spin' : ''}`} />
                  Auto-translate
                </Button>
              </div>

              {LANGUAGES.map(lang => (
                <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                  <div>
                    <Label className="text-pearl/70">Title ({lang.label})</Label>
                    <Input
                      value={formData.title[lang.code as keyof typeof formData.title]}
                      onChange={(e) => setFormData({
                        ...formData,
                        title: { ...formData.title, [lang.code]: e.target.value }
                      })}
                      className="bg-cocoa/50 border-graphite/20 text-pearl"
                      required={lang.code === 'en'}
                    />
                  </div>

                  <div>
                    <Label className="text-pearl/70">Description ({lang.label})</Label>
                    <Textarea
                      value={formData.description[lang.code as keyof typeof formData.description]}
                      onChange={(e) => setFormData({
                        ...formData,
                        description: { ...formData.description, [lang.code]: e.target.value }
                      })}
                      className="bg-cocoa/50 border-graphite/20 text-pearl"
                      rows={4}
                      required={lang.code === 'en'}
                    />
                  </div>

                  <div>
                    <Label className="text-pearl/70">Features ({lang.label}) - One per line</Label>
                    <Textarea
                      value={(() => {
                        const features = formData.features[lang.code as keyof typeof formData.features];
                        return Array.isArray(features) ? features.join('\n') : (typeof features === 'string' ? features : '');
                      })()}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: {
                          ...formData.features,
                          [lang.code]: e.target.value.split('\n').filter(f => f.trim())
                        }
                      })}
                      className="bg-cocoa/50 border-graphite/20 text-pearl"
                      rows={4}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Pricing & Details */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-pearl/70">Price From (PLN)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_from}
                  onChange={(e) => setFormData({ ...formData, price_from: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                />
              </div>
              <div>
                <Label className="text-pearl/70">Price To (PLN)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price_to}
                  onChange={(e) => setFormData({ ...formData, price_to: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                />
              </div>
              <div>
                <Label className="text-pearl/70">Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                />
              </div>
            </div>

            <div>
              <Label className="text-pearl/70">Service Image</Label>
              <ImageUpload
                bucket="service-images"
                folder="services"
                currentImage={formData.image_url}
                onUploadComplete={(url) => setFormData({ ...formData, image_url: url })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-pearl/70">Stripe Price ID</Label>
                <Input
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                  placeholder="price_xxx"
                />
              </div>
              <div>
                <Label className="text-pearl/70">Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  className="bg-cocoa/50 border-graphite/20 text-pearl"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label className="text-pearl/70">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_package}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_package: checked })}
                />
                <Label className="text-pearl/70">Package</Label>
              </div>

              {formData.is_package && (
                <div className="flex items-center gap-2">
                  <Label className="text-pearl/70">Sessions:</Label>
                  <Input
                    type="number"
                    value={formData.package_sessions}
                    onChange={(e) => setFormData({ ...formData, package_sessions: e.target.value })}
                    className="w-20 bg-cocoa/50 border-graphite/20 text-pearl"
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full bg-champagne text-charcoal hover:bg-champagne/90">
              {editingService ? "Update Service" : "Create Service"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedServicesManagement;