import { useEffect, useMemo, useState } from "react";
import { Sparkles, Image as ImageIcon, Filter } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ServiceRow {
  id: string;
  title: string;
  slug: string;
  service_type: 'beauty' | 'fitness' | 'lifestyle';
  image_url: string | null;
}

type GenState = 'idle' | 'running' | 'done' | 'error';

const defaultHeroPrompt = (svc: ServiceRow) => (
  svc.service_type === 'beauty'
    ? `Luxury PMU hero for ${svc.title}. Photorealistic soft glam; cocoa/champagne palette (#8B4513, #F5DEB3); 16:9 with right-side negative space; soft studio light; no text.`
    : `Luxury fitness hero for ${svc.title}. Photorealistic boutique-gym; women-first aesthetic; subtle cyan accents within cocoa/champagne palette; 16:9 right-side negative space; no text.`
);

const defaultGalleryPrompt = (svc: ServiceRow) => (
  `Luxury gallery image for ${svc.title}. Photorealistic, clean composition matching cocoa/champagne palette. Square 1:1. No text.`
);

const MediaStudio = () => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [heroPrompt, setHeroPrompt] = useState('');
  const [galleryPrompt, setGalleryPrompt] = useState('');
  const [galleryCount, setGalleryCount] = useState(2);
  const [state, setState] = useState<GenState>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id,title,slug,service_type,image_url')
        .eq('is_active', true)
        .order('display_order');
      if (error) {
        toast aria-live="polite" aria-atomic="true"({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setServices(data as ServiceRow[] || []);
      }
    };
    load();
  }, [toast aria-live="polite" aria-atomic="true"]);

  const visible = useMemo(() => services.filter(s => !onlyMissing || !s.image_url), [services, onlyMissing]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const runHeroBatch = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      toast aria-live="polite" aria-atomic="true"({ title: 'Select services', description: 'Pick at least one service to generate', variant: 'destructive' });
      return;
    }
    setState('running'); setProgress(0);
    for (let i = 0; i < ids.length; i++) {
      const svc = services.find(s => s.id === ids[i]);
      if (!svc) continue;
      try {
        const prompt = heroPrompt || defaultHeroPrompt(svc);
        const { data, error } = await (supabase as any).functions.invoke('generate-image', { body: { prompt } });
        if (error || !data?.imageUrl) throw new Error(error?.message || 'Failed to generate');
        const res = await fetch(data.imageUrl);
        const blob = await res.blob();
        const filePath = `services/${svc.slug}-hero.png`;
        const { error: upErr } = await supabase.storage.from('service-images').upload(filePath, blob, { upsert: true, cacheControl: '3600', contentType: 'image/png' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('service-images').getPublicUrl(filePath);
        const publicUrl = pub?.publicUrl;
        if (!publicUrl) throw new Error('Public URL missing');
        const { error: upd } = await supabase.from('services').update({ image_url: publicUrl }).eq('id', svc.id);
        if (upd) throw upd;
      } catch (e: any) {
        setState('error');
        toast aria-live="polite" aria-atomic="true"({ title: 'Hero generation failed', description: `${svc.title}: ${e?.message}`, variant: 'destructive' });
      }
      setProgress(Math.round(((i + 1) / ids.length) * 100));
    }
    setState('done');
    toast aria-live="polite" aria-atomic="true"({ title: 'Hero generation completed' });
  };

  const runGalleryBatch = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      toast aria-live="polite" aria-atomic="true"({ title: 'Select services', description: 'Pick at least one service to generate', variant: 'destructive' });
      return;
    }
    setState('running'); setProgress(0);
    const total = ids.length * galleryCount;
    let completed = 0;
    for (const id of ids) {
      const svc = services.find(s => s.id === id);
      if (!svc) continue;
      for (let i = 0; i < galleryCount; i++) {
        try {
          const prompt = galleryPrompt || defaultGalleryPrompt(svc);
          const { data, error } = await (supabase as any).functions.invoke('generate-image', { body: { prompt } });
          if (error || !data?.imageUrl) throw new Error(error?.message || 'Failed to generate');
          const res = await fetch(data.imageUrl);
          const blob = await res.blob();
          const filePath = `services/${svc.slug}/gallery-${Date.now()}-${i}.png`;
          const { error: upErr } = await supabase.storage.from('gallery-images').upload(filePath, blob, { upsert: true, cacheControl: '3600', contentType: 'image/png' });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from('gallery-images').getPublicUrl(filePath);
          const publicUrl = pub?.publicUrl;
          const { data: rows } = await supabase
            .from('service_gallery')
            .select('display_order')
            .eq('service_id', id)
            .order('display_order', { ascending: false })
            .limit(1);
          const nextOrder = rows && rows.length > 0 ? (rows[0].display_order + 1) : 0;
          const { error: ins } = await supabase.from('service_gallery').insert([{ service_id: id, image_url: publicUrl, caption: null, is_featured: false, display_order: nextOrder }]);
          if (ins) throw ins;
        } catch (e: any) {
          setState('error');
          toast aria-live="polite" aria-atomic="true"({ title: 'Gallery generation failed', description: `${svc.title}: ${e?.message}`, variant: 'destructive' });
        }
        completed += 1;
        setProgress(Math.round((completed / total) * 100));
      }
    }
    setState('done');
    toast aria-live="polite" aria-atomic="true"({ title: 'Gallery generation completed' });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-graphite/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5" alt="Image" /> Media Studio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Switch checked={onlyMissing} onCheckedChange={setOnlyMissing} />
              <span className="text-sm">Only missing hero images</span>
            </div>
            {state !== 'idle' && (
              <div className="flex items-center gap-3 w-64">
                <Progress value={progress} className="h-2" />
                <span className="text-xs text-muted-foreground w-10">{progress}%</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hero Prompt (optional override)</Label>
              <Input value={heroPrompt} onChange={(e) => setHeroPrompt(e.target.value)} placeholder="Custom hero prompt…" />
            </div>
            <div className="space-y-2">
              <Label>Gallery Prompt (optional override)</Label>
              <Input value={galleryPrompt} onChange={(e) => setGalleryPrompt(e.target.value)} placeholder="Custom gallery prompt…" />
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label>Gallery images per service</Label>
              <Input type="number" value={galleryCount} onChange={(e) => setGalleryCount(parseInt(e.target.value || '0'))} className="w-28" />
            </div>
            <Button className="gap-2" onClick={runHeroBatch} disabled={state==='running'}>
              <Sparkles className="w-4 h-4" /> Generate Heroes
            </Button>
            <Button variant="outline" className="gap-2" onClick={runGalleryBatch} disabled={state==='running'}>
              <Sparkles className="w-4 h-4" /> Generate Galleries
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map(svc => (
              <Card key={svc.id} className={`p-3 ${selected.has(svc.id) ? 'ring-1 ring-champagne/40' : ''}`}
                onClick={() => toggle(svc.id)}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{svc.title}</span>
                      <Badge variant="outline">{svc.service_type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">/{svc.slug}</div>
                  </div>
                  {svc.image_url ? (
                    <Badge className="bg-sage/20 text-sage">Has hero</Badge>
                  ) : (
                    <Badge variant="destructive">Missing hero</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaStudio;


