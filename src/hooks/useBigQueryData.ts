import { useQuery } from '@tanstack/react-query';
import { getBelgiumAdSpendData, getBelgiumAdvertiserStats, getBelgiumNewAdvertisers, getAdvertiserDomains, getAllBelgiumAdvertisers } from '@/services/bigQueryService';
import { isAuthenticated } from '@/services/googleAuthService';

export const useBelgiumAdSpendData = (selectedPeriod: string, selectedCategory: string = "all") => {
  const isYTD = selectedPeriod === "ytd";
  const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : selectedPeriod === "90d" ? 90 : 365;
  const authStatus = isAuthenticated();
  
  return useQuery({
    queryKey: ['belgium-ad-spend', selectedPeriod, selectedCategory, authStatus],
    queryFn: () => getBelgiumAdSpendData(days, isYTD, selectedCategory),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: 1, // Only retry once to fail faster
    enabled: true, // Always try to fetch, even if not authenticated (will use mock data)
    meta: {
      errorInfo: null, // Will store detailed error info
    },
  });
};

export const useBelgiumAdvertiserStats = (selectedCategory: string = "all", days?: number, isYTD?: boolean) => {
  const authStatus = isAuthenticated();
  
  return useQuery({
    queryKey: ['belgium-advertiser-stats', selectedCategory, days, isYTD, authStatus],
    queryFn: () => getBelgiumAdvertiserStats(selectedCategory, days, isYTD),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: 1, // Only retry once to fail faster
    enabled: true, // Always try to fetch, even if not authenticated (will use mock data)
    meta: {
      errorInfo: null, // Will store detailed error info
    },
  });
};

export const useBelgiumNewAdvertisers = (selectedPeriod: string, selectedCategory: string = "all", limit: number = 30) => {
  const isYTD = selectedPeriod === "ytd";
  const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : selectedPeriod === "90d" ? 90 : 365;
  const authStatus = isAuthenticated();
  
  return useQuery({
    queryKey: ['belgium-new-advertisers', selectedPeriod, selectedCategory, limit, authStatus],
    queryFn: () => getBelgiumNewAdvertisers(days, isYTD, selectedCategory, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: 1, // Only retry once to fail faster
    enabled: true, // Always try to fetch, even if not authenticated (will use mock data)
    meta: {
      errorInfo: null, // Will store detailed error info
    },
  });
};

export const useAdvertiserDomains = () => {
  const authStatus = isAuthenticated();
  
  return useQuery({
    queryKey: ['advertiser-domains', authStatus],
    queryFn: getAdvertiserDomains,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1, // Only retry once to fail faster
    enabled: true, // Always try to fetch, even if not authenticated (will use mock data)
    meta: {
      errorInfo: null, // Will store detailed error info
    },
  });
};

export const useAllBelgiumAdvertisers = (selectedPeriod: string, selectedCategory: string = "all", limit: number = 50) => {
  const isYTD = selectedPeriod === "ytd";
  const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : selectedPeriod === "90d" ? 90 : 365;
  const authStatus = isAuthenticated();
  return useQuery({
    queryKey: ['all-belgium-advertisers', selectedPeriod, selectedCategory, limit, authStatus],
    queryFn: () => getAllBelgiumAdvertisers(days, isYTD, selectedCategory, limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: true,
    meta: { errorInfo: null },
  });
};
