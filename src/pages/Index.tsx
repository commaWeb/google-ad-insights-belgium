import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, Users, DollarSign, Sparkles } from "lucide-react";
import { AdSpendChart } from "@/components/AdSpendChart";
import { AdFormatChart } from "@/components/AdFormatChart";
import { TopAdvertisersTable } from "@/components/TopAdvertisersTable";
import { NewAdvertisersTable } from "@/components/NewAdvertisersTable";
import { StatsCards } from "@/components/StatsCards";
import { MockDataAlert } from "@/components/MockDataAlert";
import { GoogleSignIn, AuthenticatedLabel } from "@/components/GoogleSignIn";
import { useBelgiumAdSpendData, useBelgiumAdvertiserStats, useBelgiumNewAdvertisers } from "@/hooks/useBigQueryData";
import { isAuthenticated } from "@/services/googleAuthService";
import { AllAdvertisersTable } from "@/components/AllAdvertisersTable";
import { CompetitorAdScraper } from "../components/CompetitorAdScraper";

const Index = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedView, setSelectedView] = useState("top-advertisers");
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'dashboard' | 'scraper'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Initialize authentication state on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      console.log('Index: Initial auth check:', authStatus);
      setIsAuthenticatedState(authStatus);
    };
    
    checkAuth();
    
    // Also listen for storage changes to update auth state
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'google_access_token') {
        const authStatus = isAuthenticated();
        console.log('Index: Auth state changed via storage:', authStatus);
        setIsAuthenticatedState(authStatus);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleAuthChange = (authStatus: boolean) => {
    console.log('Index: Auth change callback:', authStatus);
    setIsAuthenticatedState(authStatus);
  };

  // Get query results and errors
  const { data: adSpendData, error: adSpendError } = useBelgiumAdSpendData(selectedPeriod, selectedCategory);
  const { data: statsData, error: statsError } = useBelgiumAdvertiserStats(selectedCategory);
  const { data: newAdvertisersData, error: newAdvertisersError } = useBelgiumNewAdvertisers(selectedPeriod, selectedCategory);
  
  // Check if we're using mock data - this happens when:
  // 1. User is not authenticated, OR
  // 2. There are BigQuery API errors, OR  
  // 3. The data returned looks like mock data
  const isMockAdSpendData = adSpendData && adSpendData.some((item: any) => 
    item.advertiser_name && item.advertiser_name.startsWith('Advertiser ')
  );
  const isMockNewAdvertisersData = newAdvertisersData && newAdvertisersData.some((item: any) => 
    item.advertiser_name && item.advertiser_name.startsWith('New Advertiser ')
  );
  
  const hasErrors = !!(adSpendError || statsError || newAdvertisersError);
  const isUsingMockData = !isAuthenticatedState || hasErrors || isMockAdSpendData || isMockNewAdvertisersData;
  
  // Get the most relevant error message
  const errorMessage = adSpendError?.message || statsError?.message || newAdvertisersError?.message ||
    (!isAuthenticatedState ? 'NOT_AUTHENTICATED: Please sign in to access real data' : '');

  console.log('Index: Auth state:', isAuthenticatedState, 'Using mock data:', isUsingMockData, 'Has errors:', hasErrors, 'Error:', errorMessage);

  // Compute unique categories from real data
  const uniqueCategories = useMemo(() => {
    if (!adSpendData || adSpendData.length === 0) return [];
    const cats = new Set<string>();
    adSpendData.forEach((item: any) => {
      if (item.category) cats.add(item.category.toLowerCase());
      else if (item.topic) cats.add(item.topic.toLowerCase());
    });
    return Array.from(cats);
  }, [adSpendData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-yellow-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl md:text-4xl">📊</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">Google Ad Insights</h1>
                <div className="text-slate-500 text-lg font-medium">Belgium</div>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-2">
              <div className="flex items-center gap-2 bg-white/80 border border-slate-200 rounded-full px-4 py-1 shadow-sm">
                <Badge variant="secondary" className={isAuthenticatedState && !isUsingMockData ? "bg-green-100 text-green-800 border-green-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}>
                  {isAuthenticatedState && !isUsingMockData ? "Live Data" : "Mock Data"}
                </Badge>
                <div className="flex items-center text-sm text-slate-500">
                  <CalendarDays className="w-4 h-4 mr-1" />
                  Last updated: Today
                </div>
              </div>
              <p className="text-slate-600 text-base mt-1 text-center sm:text-right">Transparency data from Google's advertising platform</p>
            </div>
          </div>
          {/* Authenticated label under the header, only if authenticated */}
          {isAuthenticatedState && (
            <AuthenticatedLabel onSignOut={() => window.location.reload()} />
          )}
        </div>
      </div>

      {/* Sub-navigation bar */}
      <div className="border-b border-slate-200 bg-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-2">
          <a
            href="/"
            className="px-4 py-2 rounded-md font-medium bg-blue-600 text-white shadow"
          >
            Dashboard
          </a>
          <a
            href="/competitor-ad-scraper"
            className="px-4 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-100"
          >
            Competitor Ad Scraper
          </a>
        </nav>
      </div>

      {/* Main Dashboard */}
      {selectedTool === 'dashboard' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Google Sign-In */}
          {!isAuthenticatedState && (
            <GoogleSignIn onAuthChange={handleAuthChange} />
          )}

          {/* Mock Data Alert - Always show when using mock data */}
          <MockDataAlert isUsingMockData={isUsingMockData} errorMessage={errorMessage} />

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="ytd">Year to Date 2025</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Advertiser view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-advertisers">Top Advertisers</SelectItem>
                <SelectItem value="new-advertisers">New Advertisers</SelectItem>
                <SelectItem value="all-advertisers">All Advertisers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <StatsCards selectedPeriod={selectedPeriod} />

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedView === "top-advertisers" ? (
                  <>
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    Top Advertisers
                  </>
                ) : selectedView === "new-advertisers" ? (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    New Advertisers
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 text-blue-600" />
                    All Advertisers
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {selectedView === "top-advertisers" 
                  ? "Highest spending advertisers in the selected period"
                  : selectedView === "new-advertisers"
                    ? "Advertisers that started advertising in the selected period"
                    : "All advertisers in the selected period"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedView === "top-advertisers" && (
                <TopAdvertisersTable selectedPeriod={selectedPeriod} selectedCategory={selectedCategory} />
              )}
              {selectedView === "new-advertisers" && (
                <NewAdvertisersTable selectedPeriod={selectedPeriod} selectedCategory={selectedCategory} />
              )}
              {selectedView === "all-advertisers" && (
                <AllAdvertisersTable selectedPeriod={selectedPeriod} selectedCategory={selectedCategory} />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <CompetitorAdScraper />
      )}
    </div>
  );
};

export default Index;
