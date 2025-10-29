import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Star, MapPin, Clock, DollarSign, Check, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Service, ServiceComparison } from '@/types/user';

interface ServiceComparisonProps {
  services: Service[];
  onCompare: (services: Service[]) => void;
  maxServices?: number;
}

const ServiceComparisonComponent: React.FC<ServiceComparisonProps> = ({
  services,
  onCompare,
  maxServices = 3,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [comparisonCriteria, setComparisonCriteria] = useState({
    price: true,
    duration: true,
    location: true,
    rating: true,
    features: true,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === 'pl' ? 'pl-PL' : 'en-US', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else if (selectedServices.length < maxServices) {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const clearComparison = () => {
    setSelectedServices([]);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'
            )}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const renderFeatureCheck = (hasFeature: boolean) => {
    return (
      <div className="flex justify-center">
        {hasFeature ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-gray-300" />
        )}
      </div>
    );
  };

  const getFeatureValue = (service: Service, feature: string) => {
    switch (feature) {
      case 'price':
        return formatCurrency(service.price);
      case 'duration':
        return `${service.duration} ${t('common.minutes')}`;
      case 'location':
        return service.location_id;
      case 'rating':
        return renderStars(4.5); // Placeholder rating
      case 'features':
        return service.features.length;
      default:
        return '-';
    }
  };

  if (selectedServices.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('comparison.empty.title')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('comparison.empty.description')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {services.slice(0, 4).map((service) => (
                <Button
                  key={service.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleService(service)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {service.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selected Services Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {t('comparison.comparing')} ({selectedServices.length}/{maxServices}):
              </span>
              <div className="flex gap-2">
                {selectedServices.map((service) => (
                  <Badge key={service.id} variant="secondary" className="flex items-center gap-1">
                    {service.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeService(service.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearComparison}>
                {t('comparison.clear')}
              </Button>
              <Button size="sm" onClick={() => onCompare(selectedServices)}>
                {t('comparison.compare')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium text-gray-900">
                {t('comparison.criteria')}
              </th>
              {selectedServices.map((service) => (
                <th key={service.id} className="p-4 min-w-[250px]">
                  <div className="text-center">
                    <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg mb-3 overflow-hidden">
                      {service.image_url && (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.category}</p>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => window.location.href = `/booking?service=${service.id}`}
                    >
                      {t('common.book')}
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price */}
            {comparisonCriteria.price && (
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{t('comparison.price')}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">{t('comparison.priceTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </td>
                {selectedServices.map((service) => {
                  const maxPrice = Math.max(...selectedServices.map(s => s.price));
                  const percentage = (service.price / maxPrice) * 100;
                  return (
                    <td key={service.id} className="p-4 text-center">
                      <div>
                        <p className="font-semibold text-lg">{formatCurrency(service.price)}</p>
                        <Progress value={percentage} className="mt-2 h-2" />
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Duration */}
            {comparisonCriteria.duration && (
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{t('comparison.duration')}</span>
                  </div>
                </td>
                {selectedServices.map((service) => (
                  <td key={service.id} className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">{service.duration} {t('common.minutes')}</span>
                      <Badge variant="outline" className="mt-1">
                        {service.duration < 60 ? t('comparison.short') :
                         service.duration < 120 ? t('comparison.medium') : t('comparison.long')}
                      </Badge>
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Location */}
            {comparisonCriteria.location && (
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{t('comparison.location')}</span>
                  </div>
                </td>
                {selectedServices.map((service) => (
                  <td key={service.id} className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {/* Placeholder location - would come from service data */}
                        {t('comparison.warsawCenter')}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Rating */}
            {comparisonCriteria.rating && (
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{t('comparison.rating')}</span>
                  </div>
                </td>
                {selectedServices.map((service) => (
                  <td key={service.id} className="p-4 text-center">
                    {renderStars(4.5)} {/* Placeholder rating */}
                    <p className="text-xs text-gray-500 mt-1">127 {t('comparison.reviews')}</p>
                  </td>
                ))}
              </tr>
            )}

            {/* Features */}
            {comparisonCriteria.features && (
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{t('comparison.features')}</span>
                  </div>
                </td>
                {selectedServices.map((service) => (
                  <td key={service.id} className="p-4">
                    <div className="space-y-2">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      {service.features.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{service.features.length - 3} {t('comparison.more')}
                        </p>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            )}

            {/* Availability */}
            <tr className="hover:bg-gray-50">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{t('comparison.availability')}</span>
                </div>
              </td>
              {selectedServices.map((service) => (
                <td key={service.id} className="p-4 text-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {t('comparison.availableToday')}
                  </Badge>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comparison Summary */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Info className="h-5 w-5" />
            {t('comparison.summary.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-amber-700 mb-1">{t('comparison.bestValue')}</p>
              <p className="font-semibold text-amber-900">
                {selectedServices.reduce((min, service) =>
                  service.price < min.price ? service : min
                ).name}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-amber-700 mb-1">{t('comparison.shortest')}</p>
              <p className="font-semibold text-amber-900">
                {selectedServices.reduce((min, service) =>
                  service.duration < min.duration ? service : min
                ).name}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-amber-700 mb-1">{t('comparison.mostPopular')}</p>
              <p className="font-semibold text-amber-900">
                {selectedServices[0].name} {/* Placeholder for most popular */}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceComparisonComponent;