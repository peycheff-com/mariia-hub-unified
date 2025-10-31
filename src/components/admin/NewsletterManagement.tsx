import { useState, useEffect } from "react";
import { Mail, Download, Search } from "lucide-react";
import { format } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

const NewsletterManagement = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading subscribers",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  };

  const exportSubscribers = () => {
    const activeSubscribers = subscribers.filter(s => s.status === "active");
    const csv = [
      "Email,Status,Subscribed At",
      ...activeSubscribers.map(s => 
        `${s.email},${s.status},${format(new Date(s.subscribed_at), "yyyy-MM-dd HH:mm")}`
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    
    toast({ title: "Subscribers exported successfully" });
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = subscribers.filter(s => s.status === "active").length;
  const unsubscribedCount = subscribers.filter(s => s.status === "unsubscribed").length;

  if (loading) {
    return <div className="text-pearl">Loading subscribers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-pearl">Newsletter Management</h2>
        <Button
          onClick={exportSubscribers}
          className="bg-champagne text-charcoal hover:bg-champagne/90"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Active Subscribers
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-charcoal/50 border-graphite/20 p-6">
          <div className="text-pearl/60 text-sm">Total Subscribers</div>
          <div className="text-3xl font-bold text-pearl mt-2">{subscribers.length}</div>
        </Card>
        <Card className="bg-charcoal/50 border-graphite/20 p-6">
          <div className="text-pearl/60 text-sm">Active</div>
          <div className="text-3xl font-bold text-green-400 mt-2">{activeCount}</div>
        </Card>
        <Card className="bg-charcoal/50 border-graphite/20 p-6">
          <div className="text-pearl/60 text-sm">Unsubscribed</div>
          <div className="text-3xl font-bold text-red-400 mt-2">{unsubscribedCount}</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pearl/40" />
        <Input
          placeholder="Search by email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-charcoal/50 border-graphite/20 text-pearl"
        />
      </div>

      {/* Subscribers List */}
      <div className="space-y-2">
        {filteredSubscribers.map((subscriber) => (
          <Card key={subscriber.id} className="bg-charcoal/50 border-graphite/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className={`w-5 h-5 ${subscriber.status === "active" ? "text-green-400" : "text-red-400"}`} />
                <div>
                  <div className="text-pearl font-medium">{subscriber.email}</div>
                  <div className="text-pearl/50 text-sm">
                    Subscribed: {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                    {subscriber.unsubscribed_at && (
                      <span className="ml-2">
                        • Unsubscribed: {format(new Date(subscriber.unsubscribed_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                subscriber.status === "active" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {subscriber.status}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {filteredSubscribers.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-pearl/30 mx-auto mb-4" />
          <p className="text-pearl/60">
            {searchTerm ? "No subscribers found matching your search." : "No newsletter subscribers yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsletterManagement;
