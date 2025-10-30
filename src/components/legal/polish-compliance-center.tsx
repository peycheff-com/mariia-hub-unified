import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  Heart,
  Dumbbell,
  Building,
  Gavel,
  Scale,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Package,
  Clock,
  Star,
  Award,
  Certificate
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ComplianceArea {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'in_progress' | 'needs_attention';
  lastUpdated: string;
  nextReview: string;
  requirements: string[];
  documents: string[];
  responsible: string;
}

interface PolishRegulation {
  id: string;
  name: string;
  acronym: string;
  description: string;
  category: 'data_protection' | 'consumer_protection' | 'health_safety' | 'business_regulation';
  status: 'compliant' | 'partial' | 'non_compliant';
  effectiveDate: string;
  lastAudit: string;
  requirements: string[];
}

export function PolishComplianceCenter() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  const complianceAreas: ComplianceArea[] = [
    {
      id: 'beauty_services',
      title: t('polish.beauty_services_compliance', 'Beauty Services Compliance'),
      description: t('polish.beauty_services_desc', 'Compliance with Polish beauty industry regulations and cosmetology standards'),
      status: 'compliant',
      lastUpdated: '2024-01-15',
      nextReview: '2024-04-15',
      requirements: [
        t('polish.requirement_beauty_1', 'Cosmetologist licenses and certifications'),
        t('polish.requirement_beauty_2', 'Product safety documentation (MSDS)'),
        t('polish.requirement_beauty_3', 'Sanitary and epidemiological requirements'),
        t('polish.requirement_beauty_4', 'Service quality standards'),
      ],
      documents: [
        t('polish.doc_beauty_licenses', 'Beauty Specialist Licenses'),
        t('polish.doc_product_safety', 'Product Safety Certificates'),
        t('polish.doc_sanitary_reports', 'Sanitary Inspection Reports'),
      ],
      responsible: 'operations@mariaborysevych.com',
    },
    {
      id: 'fitness_services',
      title: t('polish.fitness_services_compliance', 'Fitness Services Compliance'),
      description: t('polish.fitness_services_desc', 'Compliance with Polish fitness industry regulations and trainer certifications'),
      status: 'compliant',
      lastUpdated: '2024-01-10',
      nextReview: '2024-04-10',
      requirements: [
        t('polish.requirement_fitness_1', 'Fitness instructor certifications (PZFit)'),
        t('polish.requirement_fitness_2', 'Health and safety standards'),
        t('polish.requirement_fitness_3', 'Equipment safety inspections'),
        t('polish.requirement_fitness_4', 'First aid and emergency procedures'),
      ],
      documents: [
        t('polish.doc_fitness_certificates', 'Fitness Instructor Certificates'),
        t('polish.doc_equipment_inspections', 'Equipment Safety Inspections'),
        t('polish.doc_first_aid', 'First Aid Certifications'),
      ],
      responsible: 'fitness@mariaborysevych.com',
    },
    {
      id: 'consumer_protection',
      title: t('polish.consumer_protection_compliance', 'Consumer Protection'),
      description: t('polish.consumer_protection_desc', 'Polish consumer protection laws and customer rights regulations'),
      status: 'compliant',
      lastUpdated: '2024-01-12',
      nextReview: '2024-07-12',
      requirements: [
        t('polish.requirement_consumer_1', 'Price transparency and display requirements'),
        t('polish.requirement_consumer_2', 'Terms of service in Polish language'),
        t('polish.requirement_consumer_3', 'Complaint handling procedures'),
        t('polish.requirement_consumer_4', 'Consumer rights information'),
      ],
      documents: [
        t('polish.doc_price_lists', 'Price Lists in PLN'),
        t('polish.doc_complaint_procedures', 'Complaint Handling Procedures'),
        t('polish.doc_consumer_rights', 'Consumer Rights Documentation'),
      ],
      responsible: 'legal@mariaborysevych.com',
    },
    {
      id: 'data_protection',
      title: t('polish.data_protection_compliance', 'Data Protection (GDPR/UODO)'),
      description: t('polish.data_protection_desc', 'Polish Data Protection Authority (UODO) compliance and GDPR implementation'),
      status: 'compliant',
      lastUpdated: '2024-01-15',
      nextReview: '2024-03-15',
      requirements: [
        t('polish.requirement_data_1', 'UODO registration and reporting'),
        t('polish.requirement_data_2', 'Data processing register (Article 30)'),
        t('polish.requirement_data_3', 'DPO appointment and contact details'),
        t('polish.requirement_data_4', 'Cross-border data transfer documentation'),
      ],
      documents: [
        t('polish.doc_uodo_registration', 'UODO Registration Certificate'),
        t('polish.doc_data_processing_register', 'Data Processing Register'),
        t('polish.doc_dpo_appointment', 'DPO Appointment Document'),
      ],
      responsible: 'dpo@mariaborysevych.com',
    },
    {
      id: 'financial_regulations',
      title: t('polish.financial_compliance', 'Financial Regulations'),
      description: t('polish.financial_desc', 'Polish financial regulations, tax compliance, and payment processing'),
      status: 'in_progress',
      lastUpdated: '2024-01-08',
      nextReview: '2024-03-01',
      requirements: [
        t('polish.requirement_financial_1', 'VAT registration and reporting (NIP)'),
        t('polish.requirement_financial_2', 'Split payment (MPP) compliance'),
        t('polish.requirement_financial_3', 'JPK tax filing requirements'),
        t('polish.requirement_financial_4', 'Cash register regulations (Online kasa)'),
      ],
      documents: [
        t('polish.doc_vat_registration', 'VAT Registration Certificate'),
        t('polish.doc_nip_certificate', 'NIP Tax Certificate'),
        t('polish.doc_jpk_reports', 'JPK Tax Reports'),
      ],
      responsible: 'finance@mariaborysevych.com',
    },
  ];

  const polishRegulations: PolishRegulation[] = [
    {
      id: '1',
      name: t('polish.reg_gdpr', 'General Data Protection Regulation'),
      acronym: 'GDPR/RODO',
      description: t('polish.reg_gdpr_desc', 'EU data protection regulation implemented in Polish law'),
      category: 'data_protection',
      status: 'compliant',
      effectiveDate: '2018-05-25',
      lastAudit: '2024-01-15',
      requirements: [
        t('polish.gdpr_req1', 'Lawful basis for processing'),
        t('polish.gdpr_req2', 'Data subject rights implementation'),
        t('polish.gdpr_req3', 'Breach notification aria-live="polite" aria-atomic="true" procedures'),
        t('polish.gdpr_req4', 'Privacy by design and default'),
      ],
    },
    {
      id: '2',
      name: t('polish.reg_consumer_act', 'Consumer Rights Act'),
      acronym: 'Ustawa o prawach konsumenta',
      description: t('polish.reg_consumer_act_desc', 'Polish consumer protection law implementing EU directives'),
      category: 'consumer_protection',
      status: 'compliant',
      effectiveDate: '2014-12-25',
      lastAudit: '2024-01-12',
      requirements: [
        t('polish.consumer_req1', '14-day withdrawal right'),
        t('polish.consumer_req2', 'Clear terms and conditions'),
        t('polish.consumer_req3', 'Complaint handling within 30 days'),
        t('polish.consumer_req4', 'Price transparency requirements'),
      ],
    },
    {
      id: '3',
      name: t('polish.reg_cosmetics', 'Cosmetics Products Regulation'),
      acronym: 'Rozporządzenie Kosmetyczne',
      description: t('polish.reg_cosmetics_desc', 'Regulation on cosmetic products safety and labeling'),
      category: 'health_safety',
      status: 'compliant',
      effectiveDate: '2019-01-01',
      lastAudit: '2024-01-10',
      requirements: [
        t('polish.cosmetics_req1', 'Product safety assessment'),
        t('polish.cosmetics_req2', 'Ingredient labeling requirements'),
        t('polish.cosmetics_req3', 'Good manufacturing practices'),
        t('polish.cosmetics_req4', 'Adverse reaction reporting'),
      ],
    },
    {
      id: '4',
      name: t('polish.reg_sanitary', 'Sanitary Regulations'),
      acronym: 'Ustawa sanitarna',
      description: t('polish.reg_sanitary_desc', 'Sanitary and epidemiological requirements for service premises'),
      category: 'health_safety',
      status: 'compliant',
      effectiveDate: '2019-01-01',
      lastAudit: '2024-01-05',
      requirements: [
        t('polish.sanitary_req1', 'Sanitary inspection approval'),
        t('polish.sanitary_req2', 'Staff health certificates'),
        t('polish.sanitary_req3', 'Premises hygiene standards'),
        t('polish.sanitary_req4', 'Waste disposal procedures'),
      ],
    },
    {
      id: '5',
      name: t('polish.reg_vat', 'VAT Act'),
      acronym: 'Ustawa o VAT',
      description: t('polish.reg_vat_desc', 'Value Added Tax regulations and compliance requirements'),
      category: 'business_regulation',
      status: 'partial',
      effectiveDate: '2011-01-01',
      lastAudit: '2024-01-08',
      requirements: [
        t('polish.vat_req1', 'VAT registration and reporting'),
        t('polish.vat_req2', 'Split payment mechanism'),
        t('polish.vat_req3', 'JPK structured filing'),
        t('polish.vat_req4', 'Invoice requirements (JPK_FA)'),
      ],
    },
    {
      id: '6',
      name: t('polish.reg_jpk', 'JPK Tax Filing System'),
      acronym: 'JPK',
      description: t('polish.reg_jpk_desc', 'Uniform Control File system for tax reporting'),
      category: 'business_regulation',
      status: 'in_progress',
      effectiveDate: '2019-07-01',
      lastAudit: '2024-01-08',
      requirements: [
        t('polish.jpk_req1', 'Monthly JPK_VAT filing'),
        t('polish.jpk_req2', 'Annual JPK_PR filing'),
        t('polish.jpk_req3', 'Structured invoice format'),
        t('polish.jpk_req4', 'Digital signature requirements'),
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'needs_attention': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'needs_attention': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'partial': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'non_compliant': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data_protection': return <Shield className="w-4 h-4" />;
      case 'consumer_protection': return <Users className="w-4 h-4" />;
      case 'health_safety': return <Heart className="w-4 h-4" />;
      case 'business_regulation': return <Building className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {t('polish.title', 'Polish Compliance Center')}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t('polish.description',
              'Comprehensive compliance management for Polish regulations including GDPR/UODO, consumer protection, ' +
              'health and safety standards, and business regulations for beauty and fitness services.')}
          </p>
        </div>

        {/* Polish Market Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('polish.market_overview', 'Polish Market Compliance Overview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {complianceAreas.filter(a => a.status === 'compliant').length}/{complianceAreas.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('polish.areas_compliant', 'Compliance Areas')}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">PL</div>
                <p className="text-sm text-muted-foreground">
                  {t('polish.primary_market', 'Primary Market')}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">UODO</div>
                <p className="text-sm text-muted-foreground">
                  {t('polish.data_protection', 'Data Protection')}
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">ZŁ</div>
                <p className="text-sm text-muted-foreground">
                  {t('polish.local_currency', 'Local Currency')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('polish.overview', 'Overview')}</TabsTrigger>
            <TabsTrigger value="regulations">{t('polish.regulations', 'Regulations')}</TabsTrigger>
            <TabsTrigger value="beauty">{t('polish.beauty_services', 'Beauty')}</TabsTrigger>
            <TabsTrigger value="fitness">{t('polish.fitness_services', 'Fitness')}</TabsTrigger>
            <TabsTrigger value="documents">{t('polish.documents', 'Documents')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    {t('polish.business_registration', 'Business Registration')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {[
                      { label: t('polish.company_name', 'Company Name'), value: 'Mariia Hub Sp. z o.o.' },
                      { label: t('polish.nip', 'NIP (Tax ID)'), value: '1234567890' },
                      { label: t('polish.regon', 'REGON'), value: '123456789' },
                      { label: t('polish.krs', 'KRS'), value: '0000123456' },
                      { label: t('polish.ceidg', 'CEIDG'), value: 'Active Registration' },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}:</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t('polish.operational_address', 'Operational Address')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {[
                      { label: t('polish.address', 'Address'), value: 'ul. Jana Pawła II 43/15' },
                      { label: t('polish.city', 'City'), value: '00-001 Warszawa' },
                      { label: t('polish.voivodeship', 'Voivodeship'), value: 'Mazowieckie' },
                      { label: t('polish.county', 'County'), value: 'm.st. Warszawa' },
                      { label: t('polish.district', 'District'), value: 'Śródmieście' },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}:</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('polish.compliance_status', 'Compliance Status')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceAreas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(area.status)}
                        <div>
                          <h3 className="font-medium">{area.title}</h3>
                          <p className="text-sm text-muted-foreground max-w-lg">
                            {area.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{t('polish.last_updated', 'Updated')}: {area.lastUpdated}</span>
                            <span>{t('polish.next_review', 'Next review')}: {area.nextReview}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(area.status)}>
                          {t(`polish.status.${area.status}`, area.status)}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regulations" className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              {t('polish.applicable_regulations', 'Applicable Polish Regulations')}
            </h2>

            <div className="grid gap-4">
              {polishRegulations.map((regulation) => (
                <Card key={regulation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getCategoryIcon(regulation.category)}
                          <h3 className="font-semibold text-lg">{regulation.name}</h3>
                          <Badge variant="outline">{regulation.acronym}</Badge>
                          <Badge className={getStatusColor(regulation.status)}>
                            {t(`polish.status.${regulation.status}`, regulation.status)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{regulation.description}</p>
                        <div className="grid gap-4 md:grid-cols-3 text-sm">
                          <div>
                            <strong>{t('polish.effective_date', 'Effective Date')}:</strong>
                            <div>{new Date(regulation.effectiveDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <strong>{t('polish.last_audit', 'Last Audit')}:</strong>
                            <div>{new Date(regulation.lastAudit).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <strong>{t('polish.category', 'Category')}:</strong>
                            <div>{t(`polish.category.${regulation.category}`, regulation.category)}</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h4 className="font-medium mb-2">{t('polish.key_requirements', 'Key Requirements')}:</h4>
                          <div className="flex flex-wrap gap-1">
                            {regulation.requirements.map((req, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="beauty" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-pink-500" />
              <h2 className="text-2xl font-semibold">
                {t('polish.beauty_industry_compliance', 'Beauty Industry Compliance')}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    {t('polish.professional_certifications', 'Professional Certifications')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('polish.cert_cosmetologist', 'Licensed Cosmetologist'),
                    t('polish.cert_aesthetic_medicine', 'Aesthetic Medicine Technician'),
                    t('polish.cert_permanent_makeup', 'Permanent Makeup Specialist'),
                    t('polish.cert_lash_extensions', 'Eyelash Extensions Technician'),
                    t('polish.cert_nail_technician', 'Nail Technician'),
                  ].map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t('polish.safety_standards', 'Safety Standards')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('polish.safety_sanitary_approval', 'Sanitary Inspection Approval'),
                    t('polish.safety_product_safety', 'Product Safety Documentation'),
                    t('polish.safety_allergy_testing', 'Allergy Testing Protocols'),
                    t('polish.safety_sterilization', 'Sterilization Procedures'),
                    t('polish.safety_waste_management', 'Medical Waste Management'),
                  ].map((standard, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{standard}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('polish.service_specific_requirements', 'Service-Specific Requirements')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3">{t('polish.lip_enhancements', 'Lip Enhancements')}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• {t('polish.lip_req1', 'Medical consultation for permanent procedures')}</li>
                      <li>• {t('polish.lip_req2', 'Patch test 48 hours before treatment')}</li>
                      <li>• {t('polish.lip_req3', 'Anesthesia documentation and consent')}</li>
                      <li>• {t('polish.lip_req4', 'Aftercare instructions in Polish')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">{t('polish.brow_treatments', 'Brow Treatments')}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• {t('polish.brow_req1', 'Shape consultation with documentation')}</li>
                      <li>• {t('polish.brow_req2', 'Allergy testing for tinting procedures')}</li>
                      <li>• {t('polish.brow_req3', 'Sterile tool usage requirements')}</li>
                      <li>• {t('polish.brow_req4', 'Treatment area disinfection protocols')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fitness" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-semibold">
                {t('polish.fitness_industry_compliance', 'Fitness Industry Compliance')}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Certificate className="w-5 h-5" />
                    {t('polish.trainer_certifications', 'Trainer Certifications')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('polish.fitness_pzfit', 'PZFit Certified Fitness Instructor'),
                    t('polish.fitness_personal_trainer', 'Personal Trainer License'),
                    t('polish.fitness_nutrition', 'Nutrition Specialist Certification'),
                    t('polish.fitness_first_aid', 'First Aid and CPR Certification'),
                    t('polish.fitness_insurance', 'Professional Liability Insurance'),
                  ].map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    {t('polish.health_safety', 'Health & Safety')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('polish.health_screening', 'Health screening questionnaires'),
                    t('polish.emergency_procedures', 'Emergency response procedures'),
                    t('polish.equipment_maintenance', 'Equipment maintenance logs'),
                    t('polish.fitness_insurance', 'Facility liability insurance'),
                    t('polish.accessibility', 'Accessibility compliance'),
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t('polish.program_requirements', 'Fitness Program Requirements')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-3">{t('polish.personal_training', 'Personal Training')}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• {t('polish.training_req1', 'Initial fitness assessment documentation')}</li>
                      <li>• {t('polish.training_req2', 'Medical clearance for high-intensity programs')}</li>
                      <li>• {t('polish.training_req3', 'Progress tracking and records')}</li>
                      <li>• {t('polish.training_req4', 'Nutritional guidance disclaimer')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">{t('polish.group_classes', 'Group Classes')}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• {t('polish.class_req1', 'Participant limits based on space')}</li>
                      <li>• {t('polish.class_req2', 'Intensity level clearly marked')}</li>
                      <li>• {t('polish.class_req3', 'Modification options provided')}</li>
                      <li>• {t('polish.class_req4', 'Emergency evacuation procedures')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">
                {t('polish.compliance_documents', 'Compliance Documents')}
              </h2>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                {t('polish.generate_reports', 'Generate Reports')}
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    {t('polish.legal_documents', 'Legal Documents')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('polish.doc_company_statute', 'Company Statute (KRS)'),
                    t('polish.doc_regulations', 'Internal Regulations'),
                    t('polish.doc_terms_polish', 'Terms of Service (Polish)'),
                    t('polish.doc_privacy_polish', 'Privacy Policy (Polish)'),
                    t('polish.doc_rodo_clauses', 'RODO Consent Clauses'),
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{doc}</span>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    {t('polish.business_documents', 'Business Documents')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('polish.doc_nip_certificate', 'NIP Certificate'),
                    t('polish.doc_vat_registration', 'VAT Registration'),
                    t('polish.doc_bank_account', 'Bank Account Verification'),
                    t('polish.doc_insurance_policies', 'Insurance Policies'),
                    t('polish.doc_lease_agreements', 'Lease Agreements'),
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{doc}</span>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t('polish.safety_documents', 'Safety Documents')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    t('polish.doc_sanitary_approval', 'Sanitary Approval'),
                    t('polish.doc_fire_safety', 'Fire Safety Certificate'),
                    t('polish.doc_risk_assessment', 'Risk Assessment'),
                    t('polish.doc_first_aid', 'First Aid Protocols'),
                    t('polish.doc_incident_reports', 'Incident Report Forms'),
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{doc}</span>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t('polish.document_note',
                  'All compliance documents must be maintained in Polish language and made available ' +
                  'to relevant authorities upon request. Regular audits ensure document currency and compliance.')}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}