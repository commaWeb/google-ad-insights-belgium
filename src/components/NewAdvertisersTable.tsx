import React from "react";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useBelgiumNewAdvertisers, useAdvertiserDomains } from "../hooks/useBigQueryData";
import { BelgiumDataBanner } from "./BelgiumDataBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface NewAdvertisersTableProps {
  selectedPeriod: string;
}

type SortField = 'name' | 'advertiserId' | 'spend' | 'ads' | 'firstAdDate' | 'lastAdDate' | 'region';
type SortDirection = 'asc' | 'desc';

export const NewAdvertisersTable = ({ selectedPeriod }: NewAdvertisersTableProps) => {
  const { data: newAdvertisersData, isLoading, error } = useBelgiumNewAdvertisers(selectedPeriod, undefined, 50);
  const { data: domainsData } = useAdvertiserDomains();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('firstAdDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Mock data as fallback - updated to use 2025 dates
  const mockNewAdvertisers = [
    {
      name: "TechStart Belgium",
      firstAdDate: "2025-06-01",
      totalAds: 125,
      maxSpend: 2340,
      category: "Technology",
      domain: "techstart.be",
    },
    {
      name: "Green Energy Solutions",
      firstAdDate: "2025-05-28",
      totalAds: 89,
      maxSpend: 1890,
      category: "Energy",
      domain: "greenenergy.be",
    },
    {
      name: "Local Brewery Co",
      firstAdDate: "2025-05-25",
      totalAds: 67,
      maxSpend: 1450,
      category: "Food & Beverage",
      domain: "localbrewery.be",
    },
    {
      name: "Digital Marketing Pro",
      firstAdDate: "2025-05-22",
      totalAds: 156,
      maxSpend: 3200,
      category: "Marketing",
      domain: "digitalmarketingpro.be",
    },
    {
      name: "Belgian Startup Hub",
      firstAdDate: "2025-04-15",
      totalAds: 98,
      maxSpend: 2800,
      category: "Technology",
      domain: "startups.be",
    },
    {
      name: "Eco Fashion Brand",
      firstAdDate: "2025-03-20",
      totalAds: 76,
      maxSpend: 1750,
      category: "Fashion",
      domain: "ecofashion.be",
    },
    {
      name: "Smart Home Solutions",
      firstAdDate: "2025-02-14",
      totalAds: 134,
      maxSpend: 3500,
      category: "Technology",
      domain: "smarthome.be",
    },
    {
      name: "Artisan Chocolates",
      firstAdDate: "2025-01-30",
      totalAds: 45,
      maxSpend: 980,
      category: "Food & Beverage",
      domain: "chocolates.be",
    },
  ];

  // Create domain lookup map
  const domainMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(domainsData)) {
      domainsData.forEach((item: any) => {
        map.set(item.advertiser_name, item.advertiser_url);
      });
    }
    return map;
  }, [domainsData]);

  // Transform real data or use mock data
  const allNewAdvertisers = useMemo(() => {
    if (newAdvertisersData && newAdvertisersData.length > 0) {
      return newAdvertisersData.map((item: any) => ({
        name: item.advertiser_name || "Unknown",
        advertiserId: item.advertiser_id || "N/A",
        spend: item.total_spend || 0,
        ads: item.total_ads || 0,
        firstAdDate: item.first_ad_date || "N/A",
        lastAdDate: item.last_ad_date || "N/A",
        region: "BE",
      }));
    }
    // fallback to mock data in the same structure
    return mockNewAdvertisers.map((item: any) => ({
      name: item.name,
      advertiserId: "mock-id",
      spend: item.maxSpend,
      ads: item.totalAds,
      firstAdDate: item.firstAdDate,
      lastAdDate: item.firstAdDate,
      region: "BE",
    }));
  }, [newAdvertisersData]);

  // Check if we have no Belgium data
  const noBelgiumData = newAdvertisersData && newAdvertisersData.length > 0 && newAdvertisersData[0]._noBelgiumData;

  if (noBelgiumData) {
    return <BelgiumDataBanner />;
  }

  // Sorting logic
  const sortedNewAdvertisers = useMemo(() => {
    return [...allNewAdvertisers].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      if (sortField === 'spend' || sortField === 'ads') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === 'firstAdDate' || sortField === 'lastAdDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [allNewAdvertisers, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedNewAdvertisers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNewAdvertisers = sortedNewAdvertisers.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "Technology": "bg-blue-100 text-blue-800",
      "Energy": "bg-green-100 text-green-800",
      "Food & Beverage": "bg-orange-100 text-orange-800",
      "Marketing": "bg-purple-100 text-purple-800",
      "Commercial": "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    if (dateString === "Unknown") return dateString;
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatSpend = (spend: number | string) => {
    if (typeof spend === 'number') {
      if (spend < 1000) {
        return `€${spend.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
      }
      return `€${(spend / 1000).toFixed(1)}K`;
    }
    return spend;
  };

  if (error) {
    console.error('Error fetching new advertisers data:', error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-2">
        <span className="mr-2 text-sm text-slate-600">Rows per page:</span>
        <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
          <SelectTrigger className="w-20 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {isLoading && (
        <div className="p-4 text-center text-slate-500">Loading new advertisers from BigQuery...</div>
      )}
      
      <div className="rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">
                <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-semibold">
                  Advertiser {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold">
                <Button variant="ghost" onClick={() => handleSort('advertiserId')} className="h-auto p-0 font-semibold">
                  Advertiser ID {getSortIcon('advertiserId')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-right">
                <Button variant="ghost" onClick={() => handleSort('spend')} className="h-auto p-0 font-semibold">
                  Total Spend {getSortIcon('spend')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-right">
                <Button variant="ghost" onClick={() => handleSort('ads')} className="h-auto p-0 font-semibold">
                  Total Ads {getSortIcon('ads')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold">
                <Button variant="ghost" onClick={() => handleSort('firstAdDate')} className="h-auto p-0 font-semibold">
                  First Ad Date {getSortIcon('firstAdDate')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold">
                <Button variant="ghost" onClick={() => handleSort('lastAdDate')} className="h-auto p-0 font-semibold">
                  Last Ad Date {getSortIcon('lastAdDate')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold">
                <Button variant="ghost" onClick={() => handleSort('region')} className="h-auto p-0 font-semibold">
                  Region {getSortIcon('region')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNewAdvertisers.map((advertiser, index) => (
              <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                <TableCell className="font-medium">{advertiser.name}</TableCell>
                <TableCell className="text-sm text-slate-600">
                  <span title={advertiser.advertiserId}>{advertiser.advertiserId}</span>
                </TableCell>
                <TableCell className="text-right font-semibold">{formatSpend(advertiser.spend)}</TableCell>
                <TableCell className="text-right">{advertiser.ads}</TableCell>
                <TableCell className="text-sm text-slate-600">{advertiser.firstAdDate}</TableCell>
                <TableCell className="text-sm text-slate-600">{advertiser.lastAdDate}</TableCell>
                <TableCell className="text-sm text-slate-600">{advertiser.region}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                size="default"
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    onClick={() => setCurrentPage(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                    size="icon"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                size="default"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      <div className="text-sm text-slate-500 text-center">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedNewAdvertisers.length)} of {sortedNewAdvertisers.length} new advertisers
      </div>
    </div>
  );
};
