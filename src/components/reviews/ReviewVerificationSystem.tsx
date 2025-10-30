import { useState, useEffect } from "react";
import {
  Shield,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  Filter,
  UserCheck,
  Image as ImageIcon,
  Fingerprint,
  Bot,
  Sparkles,
  Info,
  Flag,
  Ban,
  Zap,
  Award,
  Verified
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";

interface VerificationRequest {
  id: string;
  review_id: string;
  verification_type: 'photo' | 'service' | 'manual' | 'ai';
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verification_data: any;
  created_at: string;
  updated_at: string;
  reviews: {
    content: string;
    rating: number;
    photos: string[];
    profiles: {
      full_name: string;
    };
    services?: {
      title: string;
    };
  };
}

interface FraudDetection {
  id: string;
  review_id: string;
  flag_type: 'spam' | 'fake' | 'inappropriate' | 'duplicate';
  confidence_score: number;
  auto_action: 'hide' | 'flag_for_review' | 'approve';
  is_resolved: boolean;
  ai_analysis: any;
  created_at: string;
}

export const ReviewVerificationSystem = () => {
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [fraudDetections, setFraudDetections] = useState<FraudDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [selectedFraud, setSelectedFraud] = useState<FraudDetection | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [filterType, setFilterType] = useState("all");
  const { toast aria-live="polite" aria-atomic="true" } = useToast();

  useEffect(() => {
    loadVerificationRequests();
    loadFraudDetections();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('verification-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'review_verifications'
      }, () => {
        loadVerificationRequests();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'review_flags'
      }, () => {
        loadFraudDetections();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const loadVerificationRequests = async () => {
    const { data, error } = await supabase
      .from("review_verifications")
      .select(`
        *,
        reviews (
          content,
          rating,
          photos,
          profiles (full_name),
          services (title)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setVerificationRequests(data || []);
    }
    setLoading(false);
  };

  const loadFraudDetections = async () => {
    const { data, error } = await supabase
      .from("review_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading fraud detections:", error);
    } else {
      setFraudDetections(data || []);
    }
  };

  const approveVerification = async (requestId: string, verificationMethod: string) => {
    const { error } = await supabase
      .from("review_verifications")
      .update({
        verification_status: 'approved',
        verification_data: {
          ...verificationRequests.find(r => r.id === requestId)?.verification_data,
          verified_method: verificationMethod,
          verified_at: new Date().toISOString()
        }
      })
      .eq("id", requestId);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Mark review as verified
      const request = verificationRequests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from("reviews")
          .update({
            is_verified: true,
            verification_method: verificationMethod
          })
          .eq("id", request.review_id);
      }

      toast aria-live="polite" aria-atomic="true"({
        title: "Verification Approved",
        description: "Review has been verified successfully",
      });
      loadVerificationRequests();
    }
  };

  const rejectVerification = async (requestId: string, reason: string) => {
    const { error } = await supabase
      .from("review_verifications")
      .update({
        verification_status: 'rejected',
        verification_data: {
          ...verificationRequests.find(r => r.id === requestId)?.verification_data,
          rejection_reason: reason,
          rejected_at: new Date().toISOString()
        }
      })
      .eq("id", requestId);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Verification Rejected",
        description: "Verification request has been rejected",
      });
      loadVerificationRequests();
    }
  };

  const runAIVerification = async (requestId: string) => {
    const request = verificationRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const { data, error } = await supabase.functions.invoke('ai-verify-review', {
        body: {
          reviewId: request.review_id,
          photos: request.reviews.photos,
          content: request.reviews.content,
          verificationType: request.verification_type
        }
      });

      if (error) throw error;

      if (data.verified) {
        await approveVerification(requestId, `ai_${data.method}`);
        toast aria-live="polite" aria-atomic="true"({
          title: "AI Verification Complete",
          description: `Review verified using AI: ${data.method}`,
        });
      } else {
        await rejectVerification(requestId, data.reason);
        toast aria-live="polite" aria-atomic="true"({
          title: "AI Verification Failed",
          description: `Reason: ${data.reason}`,
        });
      }
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const runFraudDetection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-review-fraud');

      if (error) throw error;

      toast aria-live="polite" aria-atomic="true"({
        title: "Fraud Detection Complete",
        description: `Analyzed ${data.analyzed} reviews, flagged ${data.flagged}`,
      });

      loadFraudDetections();
      loadVerificationRequests();
    } catch (error: any) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resolveFraudFlag = async (flagId: string, action: 'approve' | 'hide' | 'dismiss') => {
    const { error } = await supabase
      .from("review_flags")
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        auto_action: action
      })
      .eq("id", flagId);

    if (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast aria-live="polite" aria-atomic="true"({
        title: "Flag Resolved",
        description: `Fraud flag resolved with action: ${action}`,
      });
      loadFraudDetections();
    }
  };

  const pendingRequests = verificationRequests.filter(r => r.verification_status === 'pending');
  const highRiskFraud = fraudDetections.filter(f => !f.is_resolved && f.confidence_score > 0.8);

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="w-4 h-4" />;
      case 'service': return <Award className="w-4 h-4" />;
      case 'ai': return <Bot className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-rose';
    if (score >= 0.6) return 'text-amber';
    return 'text-emerald';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-pearl">Loading verification system...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif text-pearl">Review Verification System</h2>
          <p className="text-pearl/60 mt-1">
            AI-powered verification and fraud detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {highRiskFraud.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {highRiskFraud.length} High Risk
            </Badge>
          )}

          <Button
            onClick={runFraudDetection}
            className="bg-sage hover:bg-sage/90"
          >
            <Zap className="w-4 h-4 mr-2" />
            Run AI Fraud Detection
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-champagne/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber/20 rounded-lg">
                <Clock className="w-5 h-5 text-amber" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pearl">{pendingRequests.length}</p>
                <p className="text-sm text-pearl/60">Pending Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-champagne/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pearl">
                  {verificationRequests.filter(r => r.verification_status === 'approved').length}
                </p>
                <p className="text-sm text-pearl/60">Verified Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-champagne/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pearl">{highRiskFraud.length}</p>
                <p className="text-sm text-pearl/60">High Risk Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-champagne/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-lip-rose/20 rounded-lg">
                <Shield className="w-5 h-5 text-lip-rose" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pearl">
                  {Math.round((verificationRequests.filter(r => r.verification_status === 'approved').length / Math.max(verificationRequests.length, 1)) * 100)}%
                </p>
                <p className="text-sm text-pearl/60">Verification Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending Verifications
            {pendingRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="verified">Verified Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-emerald mx-auto mb-4" />
                <p className="text-pearl/60">No pending verification requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} className="border-champagne/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-champagne/20 rounded-lg">
                        {getVerificationIcon(request.verification_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {request.verification_type === 'photo' ? 'Photo Verification' :
                           request.verification_type === 'service' ? 'Service Verification' :
                           request.verification_type === 'ai' ? 'AI Verification' :
                           'Manual Verification'}
                        </CardTitle>
                        <CardDescription>
                          Review by {request.reviews.profiles.full_name}
                          {request.reviews.services && ` • ${request.reviews.services.title}`}
                        </CardDescription>
                      </div>
                    </div>

                    <Badge variant="outline" className="bg-amber/20 text-amber border-amber/30">
                      Pending
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="p-3 bg-pearl/10 rounded-lg">
                    <p className="text-sm text-pearl/80 mb-2">Review Content:</p>
                    <p className="text-pearl line-clamp-3">{request.reviews.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-pearl/60">Rating: {request.reviews.rating}/5</span>
                      {request.reviews.photos && request.reviews.photos.length > 0 && (
                        <span className="text-xs text-pearl/60">
                          • {request.reviews.photos.length} photo(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {request.reviews.photos && request.reviews.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {request.reviews.photos.slice(0, 4).map((photo, index) => (
                        <Dialog key={index}>
                          <DialogTrigger asChild>
                            <button className="relative aspect-square rounded-lg overflow-hidden">
                              <img
                                src={photo}
                                alt={`Verification photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <img
                              src={photo}
                              alt={`Verification photo ${index + 1}`}
                              className="w-full h-auto rounded-lg"
                            />
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-pearl/50">
                      Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>

                    <div className="flex items-center gap-2">
                      {request.verification_type !== 'ai' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAIVerification(request.id)}
                          className="text-sage hover:bg-sage/20"
                        >
                          <Bot className="w-4 h-4 mr-1" />
                          AI Verify
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => approveVerification(request.id, request.verification_type)}
                        className="bg-emerald hover:bg-emerald/90"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectVerification(request.id, 'Manual rejection')}
                        className="text-rose hover:bg-rose/20"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          {fraudDetections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-12 h-12 text-champagne mx-auto mb-4" />
                <p className="text-pearl/60">No fraud detections yet</p>
                <Button onClick={runFraudDetection} className="mt-4">
                  Run AI Fraud Detection
                </Button>
              </CardContent>
            </Card>
          ) : (
            fraudDetections.map((fraud) => (
              <Card key={fraud.id} className={`border-2 ${fraud.confidence_score > 0.8 ? 'border-rose/50' : fraud.confidence_score > 0.6 ? 'border-amber/50' : 'border-emerald/50'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Flag className={`w-5 h-5 ${fraud.confidence_score > 0.8 ? 'text-rose' : fraud.confidence_score > 0.6 ? 'text-amber' : 'text-emerald'}`} />
                      <div>
                        <CardTitle className="text-lg capitalize">{fraud.flag_type} Detected</CardTitle>
                        <CardDescription>
                          Review ID: {fraud.review_id}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getConfidenceColor(fraud.confidence_score)}`}>
                        {Math.round(fraud.confidence_score * 100)}% confidence
                      </span>
                      {!fraud.is_resolved && (
                        <Badge variant="outline" className="bg-rose/20 text-rose border-rose/30">
                          Unresolved
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-pearl/60 mb-1">AI Analysis:</p>
                      <p className="text-pearl text-sm">
                        {fraud.ai_analysis?.reason || 'Suspicious pattern detected'}
                      </p>
                    </div>

                    <div className="text-right">
                      <Progress value={fraud.confidence_score * 100} className="w-32" />
                      <p className="text-xs text-pearl/50 mt-1">Risk Score</p>
                    </div>
                  </div>

                  {fraud.ai_analysis && (
                    <div className="p-3 bg-pearl/10 rounded-lg">
                      <p className="text-xs font-medium text-pearl mb-2">Detection Details:</p>
                      <ul className="text-xs text-pearl/70 space-y-1">
                        {fraud.ai_analysis.suspicious_words && (
                          <li>• Suspicious keywords detected</li>
                        )}
                        {fraud.ai_analysis.unusual_rating && (
                          <li>• Unusual rating pattern</li>
                        )}
                        {fraud.ai_analysis.duplicate_content && (
                          <li>• Potential duplicate content</li>
                        )}
                        {fraud.ai_analysis.fake_account_indicators && (
                          <li>• Fake account indicators</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {!fraud.is_resolved && (
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => resolveFraudFlag(fraud.id, 'dismiss')}
                        variant="outline"
                      >
                        Dismiss
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => resolveFraudFlag(fraud.id, 'hide')}
                        variant="outline"
                        className="text-amber hover:bg-amber/20"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Hide Review
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => resolveFraudFlag(fraud.id, 'approve')}
                        variant="outline"
                        className="text-rose hover:bg-rose/20"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Remove Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {verificationRequests.filter(r => r.verification_status === 'approved').map((request) => (
            <Card key={request.id} className="border-emerald/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald" />
                  <div>
                    <CardTitle className="text-lg">Verified Review</CardTitle>
                    <CardDescription>
                      {request.reviews.profiles.full_name} • {request.verification_type} verification
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Verified className="w-4 h-4 text-emerald" />
                    <span className="text-sm text-emerald">Verified</span>
                    <span className="text-xs text-pearl/50">
                      {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                    </span>
                  </div>

                  <Badge variant="outline" className="bg-emerald/20 text-emerald border-emerald/30">
                    {request.verification_type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewVerificationSystem;