import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useAllBelgiumAdvertisers } from "@/hooks/useBigQueryData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AllAdvertisersTableProps {
  selectedPeriod: string;
}

type SortField = 'name' | 'advertiserId' | 'spend' | 'ads' | 'firstAdDate' | 'lastAdDate' | 'region';
type SortDirection = 'asc' | 'desc';

export const AllAdvertisersTable = ({ selectedPeriod }: AllAdvertisersTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const { data: allAdvertisersData, isLoading, error } = useAllBelgiumAdvertisers(selectedPeriod, undefined, itemsPerPage);

  const allAdvertisers = useMemo(() => {
    if (allAdvertisersData && allAdvertisersData.length > 0 && !allAdvertisersData[0]._noBelgiumData) {
      return allAdvertisersData.map((item: any) => ({
        name: item.advertiser_name || "Unknown",
        advertiserId: item.advertiser_id || "N/A",
        spend: item.total_spend || 0,
        ads: item.total_ads || 0,
        firstAdDate: item.first_ad_date || "N/A",
        lastAdDate: item.last_ad_date || "N/A",
        region: "BE",
      }));
    }
    return [];
  }, [allAdvertisersData]);

  // Sorting logic
  const sortedAdvertisers = useMemo(() => {
    return [...allAdvertisers].sort((a, b) => {
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
  }, [allAdvertisers, sortField, sortDirection]);

  // Pagination logic
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(sortedAdvertisers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdvertisers = itemsPerPage === -1 ? sortedAdvertisers : sortedAdvertisers.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
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
            <SelectItem value="-1">All</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading && (
        <div className="p-4 text-center text-slate-500">Loading all advertisers from BigQuery...</div>
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
            {paginatedAdvertisers.map((advertiser, index) => (
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
      {totalPages > 1 && itemsPerPage !== -1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <div className="text-sm text-slate-500 text-center">
        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAdvertisers.length)} of {sortedAdvertisers.length} advertisers
      </div>
    </div>
  );
}; 