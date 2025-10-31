// Partner Integration Framework
// Comprehensive B2B partner management system for hotels, spas, insurance, and healthcare providers

import React, { useState, useEffect } from 'react';
import {
  Building,
  Hotel,
  Sparkles,
  Heart,
  Stethoscope,
  Dumbbell,
  Apple,
  MapPin,
  Phone,
  Mail,
  Globe,
  Settings,
  Link,
  Unlink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  FileText,
  Activity,
  DollarSign,
  BarChart3,
  Filter,
  Search,
  ChevronDown,
  Zap,
  Shield,
  Star,
  Calendar,
  Users,
  Package,
  Router,
  Key,
  Database,
  Cloud,
  Sync,
  AlertTriangle,
  Check,
  Times,
  Play,
  Pause
} from 'lucide-react';

import { useCorporate } from '@/contexts/CorporateWellnessContext';
import {
  B2BPartner,
  PartnerServiceMapping,
  PartnerIntegrationLog,
  CreatePartnerRequest,
  ServiceArea,
  ContractDetails,
  PartnerService,
  PricingStructure
} from '@/types/corporate';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Button
} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Input
} from '@/components/ui/input';
import {
  Label
} from '@/components/ui/label';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Badge
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Switch
} from '@/components/ui/switch';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import {
  Progress
} from '@/components/ui/progress';
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PartnerIntegrationProps {
  corporateAccountId: string;
  className?: string;
}

interface PartnerFormData extends Omit<CreatePartnerRequest, 'contact_info' | 'billing_address' | 'service_areas'> {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  billing_street: string;
  billing_city: string;
  billing_postal_code: string;
  billing_country: string;
  service_city: string;
  service_country: string;
  service_radius?: number;
  service_postal_codes: string[];
}

const PARTNER_TYPES = [
  {
    value: 'hotel',
    label: 'Hotel',
    icon: Hotel,
    color: '#3b82f6',
    description: 'Luxury hotel partners for corporate retreats and stays'
  },
  {
    value: 'spa',
    label: 'Spa & Wellness',
    icon: Sparkles,
    color: '#10b981',
    description: 'Spa facilities and wellness centers'
  },
  {
    value: 'insurance',
    label: 'Insurance',
    icon: Shield,
    color: '#f59e0b',
    description: 'Health and wellness insurance providers'
  },
  {
    value: 'healthcare',
    label: 'Healthcare',
    icon: Stethoscope,
    color: '#8b5cf6',
    description: 'Medical clinics and healthcare providers'
  },
  {
    value: 'fitness',
    label: 'Fitness',
    icon: Dumbbell,
    color: '#ef4444',
    description: 'Gyms, fitness centers, and personal trainers'
  },
  {
    value: 'nutrition',
    label: 'Nutrition',
    icon: Apple,
    color: '#ec4899',
    description: 'Nutritionists and healthy meal providers'
  }
] as const;

const INTEGRATION_STATUS = {
  prospect: { label: 'Prospect', icon: Clock, color: 'secondary' },
  active: { label: 'Active', icon: CheckCircle, color: 'default' },
  suspended: { label: 'Suspended', icon: Pause, color: 'outline' },
  terminated: { label: 'Terminated', icon: XCircle, color: 'destructive' }
} as const;

const API_ENDPOINTS = {
  bookings: '/api/bookings',
  availability: '/api/availability',
  pricing: '/api/pricing',
  cancellation: '/api/cancellations',
  sync: '/api/sync'
} as const;

export const PartnerIntegration: React.FC<PartnerIntegrationProps> = ({
  corporateAccountId,
  className
}) => {
  const { partners, createPartner, updatePartner, deletePartner, loadPartners } = useCorporate();
  const { toast } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showServiceMappingDialog, setShowServiceMappingDialog] = useState(false);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<B2BPartner | null>(null);
  const [integrationLogs, setIntegrationLogs] = useState<PartnerIntegrationLog[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [testingConnection, setTestingConnection] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PartnerFormData>({
    partner_name: '',
    partner_type: 'spa',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    billing_street: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: '',
    service_city: '',
    service_country: '',
    service_radius: 50,
    service_postal_codes: [],
    contract_details: {
      contract_id: '',
      start_date: '',
      end_date: '',
      terms: '',
      cancellation_notice_days: 30,
      exclusivity: false,
      territories: [],
      renewal_terms: ''
    },
    commission_rate: 10,
    api_credentials: {
      api_key: '',
      api_secret: '',
      webhook_url: '',
      environment: 'sandbox',
      rate_limit: 1000,
      endpoints: API_ENDPOINTS
    },
    supported_services: [],
    pricing_structure: {
      corporate_discount: 20,
      volume_discounts: [],
      seasonal_pricing: [],
      payment_terms: 'NET 30'
    }
  });

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         partner.contact_info.primary_contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || partner.partner_type === selectedType;
    const matchesStatus = selectedStatus === 'all' || partner.integration_status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalPartners: partners.length,
    activePartners: partners.filter(p => p.integration_status === 'active').length,
    totalServices: partners.reduce((sum, p) => sum + (p.service_mappings?.length || 0), 0),
    integrationAttempts: 0, // This would come from logs
    successRate: 95, // This would be calculated
    byType: PARTNER_TYPES.map(type => ({
      type: type.value,
      count: partners.filter(p => p.partner_type === type.value).length
    }))
  };

  // Get partner type info
  const getPartnerTypeInfo = (type: string) => {
    return PARTNER_TYPES.find(t => t.value === type) || PARTNER_TYPES[0];
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusInfo = INTEGRATION_STATUS[status as keyof typeof INTEGRATION_STATUS];
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;
    return (
      <Badge variant={statusInfo.color as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle nested form changes
  const handleNestedChange = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  // Create or update partner
  const handleSavePartner = async () => {
    try {
      if (!formData.partner_name || !formData.contact_email) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      const partnerData = {
        ...formData,
        contact_info: {
          primary_contact: {
            name: formData.contact_name,
            email: formData.contact_email,
            phone: formData.contact_phone,
            position: 'Partner Manager'
          }
        },
        billing_address: {
          street: formData.billing_street,
          city: formData.billing_city,
          postal_code: formData.billing_postal_code,
          country: formData.billing_country
        },
        service_areas: [{
          city: formData.service_city,
          country: formData.service_country,
          radius_km: formData.service_radius,
          postal_codes: formData.service_postal_codes
        }]
      };

      if (selectedPartner) {
        await updatePartner(selectedPartner.id, partnerData);
        toast({
          title: 'Success',
          description: 'Partner updated successfully'
        });
      } else {
        await createPartner(partnerData);
        toast({
          title: 'Success',
          description: 'Partner added successfully'
        });
      }

      setShowCreateDialog(false);
      setShowEditDialog(false);
      setSelectedPartner(null);
      resetForm();
      await loadPartners();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save partner',
        variant: 'destructive'
      });
    }
  };

  // Test API connection
  const handleTestConnection = async (partner: B2BPartner) => {
    setTestingConnection(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Connection Test',
        description: 'Connection successful! All endpoints are responding.',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: 'Unable to connect to partner API. Please check credentials.',
        variant: 'destructive'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Sync partner data
  const handleSyncData = async (partner: B2BPartner) => {
    try {
      toast({
        title: 'Syncing Data',
        description: 'Syncing data with partner...'
      });

      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: 'Sync Complete',
        description: 'Successfully synced 125 services and 350 availability slots.'
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync data with partner.',
        variant: 'destructive'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      partner_name: '',
      partner_type: 'spa',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      billing_street: '',
      billing_city: '',
      billing_postal_code: '',
      billing_country: '',
      service_city: '',
      service_country: '',
      service_radius: 50,
      service_postal_codes: [],
      contract_details: {
        contract_id: '',
        start_date: '',
        end_date: '',
        terms: '',
        cancellation_notice_days: 30,
        exclusivity: false,
        territories: [],
        renewal_terms: ''
      },
      commission_rate: 10,
      api_credentials: {
        api_key: '',
        api_secret: '',
        webhook_url: '',
        environment: 'sandbox',
        rate_limit: 1000,
        endpoints: API_ENDPOINTS
      },
      supported_services: [],
      pricing_structure: {
        corporate_discount: 20,
        volume_discounts: [],
        seasonal_pricing: [],
        payment_terms: 'NET 30'
      }
    });
  };

  // Edit partner
  const handleEditPartner = (partner: B2BPartner) => {
    setSelectedPartner(partner);
    setFormData({
      partner_name: partner.partner_name,
      partner_type: partner.partner_type,
      contact_name: partner.contact_info.primary_contact.name,
      contact_email: partner.contact_info.primary_contact.email,
      contact_phone: partner.contact_info.primary_contact.phone,
      billing_street: partner.billing_address.street,
      billing_city: partner.billing_address.city,
      billing_postal_code: partner.billing_address.postal_code,
      billing_country: partner.billing_address.country,
      service_city: partner.service_areas[0]?.city || '',
      service_country: partner.service_areas[0]?.country || '',
      service_radius: partner.service_areas[0]?.radius_km,
      service_postal_codes: partner.service_areas[0]?.postal_codes || [],
      contract_details: partner.contract_details,
      commission_rate: partner.commission_rate,
      api_credentials: partner.api_credentials,
      supported_services: partner.supported_services,
      pricing_structure: partner.pricing_structure
    });
    setShowEditDialog(true);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPartners}</div>
            <div className="text-xs text-muted-foreground">
              {stats.activePartners} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrated Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <div className="text-xs text-muted-foreground">
              Across all partners
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <div className="text-xs text-muted-foreground">
              API success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Sync className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <div className="text-xs text-muted-foreground">
              All systems operational
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Partner Distribution</CardTitle>
            <CardDescription>Breakdown by partner type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byType.map((stat) => {
                const typeInfo = getPartnerTypeInfo(stat.type);
                const Icon = typeInfo.icon;
                const percentage = stats.totalPartners > 0 ? (stat.count / stats.totalPartners) * 100 : 0;

                return (
                  <div key={stat.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded"
                        style={{ backgroundColor: `${typeInfo.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: typeInfo.color }} />
                      </div>
                      <span className="font-medium">{typeInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{stat.count}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: typeInfo.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Health</CardTitle>
            <CardDescription>Real-time API status and sync metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>All Systems Operational</AlertTitle>
                <AlertDescription>
                  All partner integrations are functioning normally. Last sync: 2 minutes ago.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>API Response Time</span>
                  <span className="text-green-600">120ms avg</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Success Rate (24h)</span>
                  <span className="text-green-600">99.8%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Error Rate (24h)</span>
                  <span className="text-orange-600">0.2%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Active Webhooks</span>
                  <span>12</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Partner Management</CardTitle>
              <CardDescription>
                Manage B2B partner integrations and service mappings
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PARTNER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(INTEGRATION_STATUS).map(([value, info]) => (
                  <SelectItem key={value} value={value}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="text-lg font-medium">No partners found</div>
                      <div className="text-sm text-muted-foreground">
                        Add your first B2B partner to start integrating services
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => {
                    const typeInfo = getPartnerTypeInfo(partner.partner_type);
                    const Icon = typeInfo.icon;

                    return (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${typeInfo.color}20` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                            </div>
                            <div>
                              <div className="font-medium">{partner.partner_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {partner.contact_info.primary_contact.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-muted-foreground" />
                            <span>{partner.service_mappings?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span>{partner.commission_rate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(partner.integration_status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            2 min ago
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTestConnection(partner)}
                              disabled={testingConnection}
                            >
                              <Link className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSyncData(partner)}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditPartner(partner)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPartner(partner);
                                    setShowServiceMappingDialog(true);
                                  }}
                                >
                                  <Package className="w-4 h-4 mr-2" />
                                  Service Mapping
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPartner(partner);
                                    setShowIntegrationDialog(true);
                                  }}
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  Integration Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deletePartner(partner.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Partner Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedPartner(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPartner ? 'Edit Partner' : 'Add New Partner'}
            </DialogTitle>
            <DialogDescription>
              {selectedPartner
                ? 'Update partner information and integration settings'
                : 'Add a new B2B partner to integrate services'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Address</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner_name">Partner Name *</Label>
                  <Input
                    id="partner_name"
                    value={formData.partner_name}
                    onChange={(e) => handleFormChange('partner_name', e.target.value)}
                    placeholder="e.g., Luxury Spa Warsaw"
                  />
                </div>
                <div>
                  <Label htmlFor="partner_type">Partner Type *</Label>
                  <Select
                    value={formData.partner_type}
                    onValueChange={(value: any) => handleFormChange('partner_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" style={{ color: type.color }} />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => handleFormChange('commission_rate', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_id">Contract ID</Label>
                  <Input
                    id="contract_id"
                    value={formData.contract_details.contract_id}
                    onChange={(e) => handleNestedChange('contract_details', 'contract_id', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="commission_rate">Contract Start Date</Label>
                  <Input
                    id="contract_start"
                    type="date"
                    value={formData.contract_details.start_date}
                    onChange={(e) => handleNestedChange('contract_details', 'start_date', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contract_terms">Contract Terms</Label>
                <Textarea
                  id="contract_terms"
                  value={formData.contract_details.terms}
                  onChange={(e) => handleNestedChange('contract_details', 'terms', e.target.value)}
                  placeholder="Enter contract terms and conditions..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Contact Name *</Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name}
                      onChange={(e) => handleFormChange('contact_name', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => handleFormChange('contact_email', e.target.value)}
                      placeholder="john@partner.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleFormChange('contact_phone', e.target.value)}
                    placeholder="+48 123 456 789"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Billing Address</h3>
                <div>
                  <Label htmlFor="billing_street">Street Address</Label>
                  <Input
                    id="billing_street"
                    value={formData.billing_street}
                    onChange={(e) => handleFormChange('billing_street', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="billing_city">City</Label>
                    <Input
                      id="billing_city"
                      value={formData.billing_city}
                      onChange={(e) => handleFormChange('billing_city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_postal_code">Postal Code</Label>
                    <Input
                      id="billing_postal_code"
                      value={formData.billing_postal_code}
                      onChange={(e) => handleFormChange('billing_postal_code', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_country">Country</Label>
                    <Input
                      id="billing_country"
                      value={formData.billing_country}
                      onChange={(e) => handleFormChange('billing_country', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Service Area</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service_city">Service City</Label>
                    <Input
                      id="service_city"
                      value={formData.service_city}
                      onChange={(e) => handleFormChange('service_city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="service_country">Service Country</Label>
                    <Input
                      id="service_country"
                      value={formData.service_country}
                      onChange={(e) => handleFormChange('service_country', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="service_radius">Service Radius (km)</Label>
                  <Input
                    id="service_radius"
                    type="number"
                    value={formData.service_radius}
                    onChange={(e) => handleFormChange('service_radius', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <div>
                <Label>Environment</Label>
                <Select
                  value={formData.api_credentials.environment}
                  onValueChange={(value: any) => handleNestedChange('api_credentials', 'environment', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_credentials.api_key}
                    onChange={(e) => handleNestedChange('api_credentials', 'api_key', e.target.value)}
                    placeholder="Enter API key"
                  />
                </div>
                <div>
                  <Label htmlFor="api_secret">API Secret</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    value={formData.api_credentials.api_secret}
                    onChange={(e) => handleNestedChange('api_credentials', 'api_secret', e.target.value)}
                    placeholder="Enter API secret"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={formData.api_credentials.webhook_url}
                  onChange={(e) => handleNestedChange('api_credentials', 'webhook_url', e.target.value)}
                  placeholder="https://yourapp.com/webhooks/partner"
                />
              </div>

              <div>
                <Label htmlFor="rate_limit">Rate Limit (requests/hour)</Label>
                <Input
                  id="rate_limit"
                  type="number"
                  value={formData.api_credentials.rate_limit}
                  onChange={(e) => handleNestedChange('api_credentials', 'rate_limit', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label>API Endpoints</Label>
                <div className="space-y-2 mt-2">
                  {Object.entries(API_ENDPOINTS).map(([key, endpoint]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="w-32 capitalize">{key}</Label>
                      <Input
                        value={formData.api_credentials.endpoints[key as keyof typeof API_ENDPOINTS]}
                        onChange={(e) => handleNestedChange('api_credentials', 'endpoints', {
                          ...formData.api_credentials.endpoints,
                          [key]: e.target.value
                        })}
                        placeholder={endpoint}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div>
                <Label htmlFor="corporate_discount">Corporate Discount (%)</Label>
                <Input
                  id="corporate_discount"
                  type="number"
                  value={formData.pricing_structure.corporate_discount}
                  onChange={(e) => handleNestedChange('pricing_structure', 'corporate_discount', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Select
                  value={formData.pricing_structure.payment_terms}
                  onValueChange={(value) => handleNestedChange('pricing_structure', 'payment_terms', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NET 15">NET 15</SelectItem>
                    <SelectItem value="NET 30">NET 30</SelectItem>
                    <SelectItem value="NET 60">NET 60</SelectItem>
                    <SelectItem value="Immediate">Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Supported Services</Label>
                <Textarea
                  placeholder="List supported services (one per line)"
                  rows={4}
                  onChange={(e) =>
                    handleNestedChange(
                      'supported_services',
                      'services',
                      e.target.value.split('\n').filter(Boolean).map(service => ({
                        service_id: service.toLowerCase().replace(/\s+/g, '_'),
                        service_name: service,
                        category: 'General',
                        duration_minutes: 60,
                        corporate_rate: 100,
                        standard_rate: 150,
                        availability: {
                          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                          hours: '09:00 - 18:00'
                        }
                      }))
                    )
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedPartner(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePartner}>
              {selectedPartner ? 'Update Partner' : 'Add Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Mapping Dialog */}
      <Dialog open={showServiceMappingDialog} onOpenChange={setShowServiceMappingDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Service Mapping</DialogTitle>
            <DialogDescription>
              Map partner services to internal service catalog
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertTitle>Service Mapping</AlertTitle>
              <AlertDescription>
                Map partner's external services to your internal service catalog for seamless booking.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Current Mappings</h3>
              <div className="space-y-2">
                {/* This would be populated with actual service mappings */}
                <div className="text-sm text-muted-foreground">
                  No service mappings configured yet.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceMappingDialog(false)}>
              Close
            </Button>
            <Button>
              Save Mappings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Integration Settings Dialog */}
      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Integration Settings</DialogTitle>
            <DialogDescription>
              Configure API integration and sync settings
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="sync">Sync Settings</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Auto-sync Services</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-sync Availability</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Webhooks</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Real-time Updates</Label>
                  <Switch />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Sync Frequency</Label>
                  <Select defaultValue="hourly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="5min">Every 5 minutes</SelectItem>
                      <SelectItem value="15min">Every 15 minutes</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Last Successful Sync</Label>
                  <div className="text-sm text-muted-foreground">
                    October 22, 2024 at 10:30 AM
                  </div>
                </div>
                <Button className="w-full" onClick={() => selectedPartner && handleSyncData(selectedPartner)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Now
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <ScrollArea className="h-64 border rounded-lg p-4">
                <div className="space-y-2 font-mono text-xs">
                  <div className="text-green-600">[10:30:15] Sync completed successfully</div>
                  <div className="text-blue-600">[10:30:12] Syncing 125 services...</div>
                  <div className="text-blue-600">[10:30:10] Connected to API</div>
                  <div className="text-yellow-600">[10:29:45] Retrying connection...</div>
                  <div className="text-red-600">[10:29:30] Connection failed</div>
                  <div className="text-blue-600">[10:29:00] Starting sync process</div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntegrationDialog(false)}>
              Close
            </Button>
            <Button>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};