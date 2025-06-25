import React from "react";
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useBelgiumAdSpendData, useAdvertiserDomains } from "../hooks/useBigQueryData";
import { BelgiumDataBanner } from "./BelgiumDataBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface TopAdvertisersTableProps {
  selectedPeriod: string;
}

type SortField = 'name' | 'category' | 'spend' | 'domain';
type SortDirection = 'asc' | 'desc';

export const TopAdvertisersTable = ({ selectedPeriod }: TopAdvertisersTableProps) => {
  console.log('TopAdvertisersTable: Rendering with period:', selectedPeriod);
  
  const { data: adSpendData, isLoading, error } = useBelgiumAdSpendData(selectedPeriod);
  const { data: domainsData } = useAdvertiserDomains();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('spend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [itemsPerPage, setItemsPerPage] = useState(50);

  console.log('TopAdvertisersTable: Hook data received:', { 
    hasAdSpendData: !!adSpendData, 
    adSpendDataLength: adSpendData?.length,
    hasDomainsData: !!domainsData,
    isLoading, 
    hasError: !!error 
  });

  // Check if we have no Belgium data
  const noBelgiumData = adSpendData && adSpendData.length > 0 && adSpendData[0]._noBelgiumData;
  
  console.log('TopAdvertisersTable: Belgium data check:', { noBelgiumData, adSpendData });

  // Mock data as fallback with proper structure
  const mockAdvertisers = [
    {
      name: "Proximus",
      advertiserId: "mock-1",
      spend: 45230,
      ads: 2100,
      firstAdDate: "2025-05-01",
      lastAdDate: "2025-06-01",
      region: "BE",
    },
    {
      name: "Delhaize",
      advertiserId: "mock-2",
      spend: 38940,
      ads: 1800,
      firstAdDate: "2025-05-03",
      lastAdDate: "2025-06-02",
      region: "BE",
    },
    {
      name: "Liberal Party Belgium",
      advertiserId: "mock-3",
      spend: 15430,
      ads: 760,
      firstAdDate: "2025-05-05",
      lastAdDate: "2025-06-03",
      region: "BE",
    },
    {
      name: "Red Cross Belgium",
      advertiserId: "mock-4",
      spend: 8210,
      ads: 450,
      firstAdDate: "2025-05-07",
      lastAdDate: "2025-06-04",
      region: "BE",
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
  const allAdvertisers = useMemo(() => {
    if (adSpendData && adSpendData.length > 0 && !adSpendData[0]._noBelgiumData) {
      return adSpendData.map((item: any) => ({
        name: item.advertiser_name || "Unknown",
        advertiserId: item.advertiser_id || "N/A",
        spend: item.total_spend || 0,
        ads: item.total_ads || 0,
        firstAdDate: item.first_ad_date || "N/A",
        lastAdDate: item.last_ad_date || "N/A",
        region: "BE",
      }));
    }
    return mockAdvertisers;
  }, [adSpendData, domainMap]);

  console.log('TopAdvertisersTable: All advertisers data:', {
    count: allAdvertisers.length,
    categories: allAdvertisers.reduce((acc: any, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {})
  });

  // Filter by category if not 'all'
  const filteredAdvertisers = allAdvertisers;

  // Sorting logic
  const sortedAdvertisers = useMemo(() => {
    return [...filteredAdvertisers].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'spend') {
        aValue = typeof a.spend === 'number' ? a.spend : parseFloat(a.spend.replace(/[€,K]/g, '')) * (a.spend.includes('K') ? 1000 : 1);
        bValue = typeof b.spend === 'number' ? b.spend : parseFloat(b.spend.replace(/[€,K]/g, '')) * (b.spend.includes('K') ? 1000 : 1);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredAdvertisers, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedAdvertisers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdvertisers = sortedAdvertisers.slice(startIndex, startIndex + itemsPerPage);

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
      "Telecommunications": "bg-blue-100 text-blue-800",
      "Retail": "bg-green-100 text-green-800", 
      "Financial": "bg-purple-100 text-purple-800",
      "Political": "bg-red-100 text-red-800",
      "Travel": "bg-orange-100 text-orange-800",
      "E-commerce": "bg-indigo-100 text-indigo-800",
      "Commercial": "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
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
    console.error('TopAdvertisersTable: Error fetching advertiser data:', error);
  }

  console.log('TopAdvertisersTable: About to render, noBelgiumData:', noBelgiumData);

  // Always use conditional rendering in JSX, never early return after hooks
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
        <div className="p-4 text-center text-slate-500">Loading real data from BigQuery...</div>
      )}
      
      {noBelgiumData ? (
        <BelgiumDataBanner />
      ) : (
        <>
          <div className="rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">
                    <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-semibold">
                      Advertiser {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-semibold">Advertiser ID</TableHead>
                  <TableHead className="font-semibold text-right">Total Spend</TableHead>
                  <TableHead className="font-semibold text-right">Total Ads</TableHead>
                  <TableHead className="font-semibold">First Ad Date</TableHead>
                  <TableHead className="font-semibold">Last Ad Date</TableHead>
                  <TableHead className="font-semibold">Region</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAdvertisers.map((advertiser, index) => (
                  <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium">
                      {domainMap.get(advertiser.name) ? (
                        <a href={`https://${domainMap.get(advertiser.name)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          {advertiser.name}
                        </a>
                      ) : (
                        advertiser.name
                      )}
                    </TableCell>
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
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAdvertisers.length)} of {sortedAdvertisers.length} advertisers
          </div>
        </>
      )}
    </div>
  );
};
