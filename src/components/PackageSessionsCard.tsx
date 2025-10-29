import { Package, Calendar, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PackageSessionsCardProps {
  packageData: {
    total_sessions: number;
    sessions_used: number;
    sessions_remaining: number;
    service_title: string;
    purchased_at: string;
    expires_at?: string;
  };
}

export const PackageSessionsCard = ({ packageData }: PackageSessionsCardProps) => {
  const { formatPrice } = useCurrency();
  const progressPercentage = (packageData.sessions_used / packageData.total_sessions) * 100;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg">Active Package</CardTitle>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
            {packageData.sessions_remaining} sessions left
          </span>
        </div>
        <CardDescription>{packageData.service_title}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {packageData.sessions_used} / {packageData.total_sessions} used
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" aria-label={`${progressPercentage.toFixed(0)}% of sessions used`} />
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">
              Purchased {new Date(packageData.purchased_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {packageData.expires_at && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Valid until {new Date(packageData.expires_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};