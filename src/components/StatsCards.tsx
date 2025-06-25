import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, DollarSign } from "lucide-react";
import { useBelgiumAdvertiserStats } from "@/hooks/useBigQueryData";
import { BelgiumDataBanner } from "./BelgiumDataBanner";

interface StatsCardsProps {
  selectedPeriod: string;
}

const formatK = (value: number, prefix = '') => {
  if (value < 1000) {
    return `${prefix}${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
  }
  return `${prefix}${(value / 1000).toFixed(1)}K`;
};

export const StatsCards = ({ selectedPeriod }: StatsCardsProps) => {
  // Map period to days
  const periodToDays = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
    "ytd": new Date().getFullYear() === 2025 ? (new Date().getTime() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24) : 365
  };
  const days = periodToDays[selectedPeriod] || 30;
  const isYTD = selectedPeriod === "ytd";

  const { data: statsData, isLoading, error } = useBelgiumAdvertiserStats("all", days, isYTD);

  const noBelgiumData = statsData && Array.isArray(statsData) && statsData.length > 0 && statsData[0]?._noBelgiumData;

  const stats = statsData && Array.isArray(statsData) && statsData.length > 0 && !statsData[0]?._noBelgiumData ? {
    spend: formatK(statsData[0].total_spend || 0, '€'),
    advertisers: statsData[0].total_advertisers,
    impressions: formatK(statsData[0].total_ads || 0),
  } : null;

  const cards = [
    {
      title: "Total Ad Spend",
      value: stats ? stats.spend : "-",
      description: isLoading ? "Loading..." : "Total advertising expenditure",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Active Advertisers",
      value: stats ? stats.advertisers?.toString() : "-",
      description: isLoading ? "Loading..." : "Unique advertisers running campaigns",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Ads",
      value: stats ? stats.impressions : "-",
      description: isLoading ? "Loading..." : "Total ads published",
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  if (error) {
    console.error('StatsCards: Error fetching BigQuery data:', error);
  }

  return (
    <>
      {noBelgiumData ? (
        <BelgiumDataBanner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {cards.map((card, index) => (
            <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <CardDescription className="mt-1">{card.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};
