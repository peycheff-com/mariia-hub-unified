import { useState } from "react";
import { Calendar, Download, Filter, X } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";


interface BookingFiltersProps {
  onFilterChange: (filters: BookingFilters) => void;
  onExport: () => void;
}

export interface BookingFilters {
  status?: string;
  serviceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

const BookingFilters = ({ onFilterChange, onExport }: BookingFiltersProps) => {
  const [filters, setFilters] = useState<BookingFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof BookingFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search by name or email..."
          value={filters.searchTerm || ''}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          className="max-w-xs"
        />
        
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="gap-2 ml-auto"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {showFilters && (
        <div className="glass-card p-4 rounded-lg grid md:grid-cols-4 gap-4 animate-fade-in">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Service Type</Label>
            <Select
              value={filters.serviceType || ''}
              onValueChange={(value) => handleFilterChange('serviceType', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "PP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => handleFilterChange('dateFrom', date)}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Date To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "PP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => handleFilterChange('dateTo', date)}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFilters;
