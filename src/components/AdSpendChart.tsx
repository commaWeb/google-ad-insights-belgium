import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useBelgiumAdSpendData } from "@/hooks/useBigQueryData";

interface AdSpendChartProps {
  selectedPeriod: string;
}

export const AdSpendChart = ({ selectedPeriod }: AdSpendChartProps) => {
  const { data: adSpendData, isLoading } = useBelgiumAdSpendData(selectedPeriod, "all");

  // Transform data for chart
  const chartData = (adSpendData || []).map((item: any) => ({
    date: item.date_range_start,
    spend: Number(item.total_spend) || 0,
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip 
            formatter={(value: number) => [`€${value.toLocaleString()}`, 'Ad Spend']}
            labelStyle={{ color: '#1e293b' }}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="spend" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            name="Ad Spend"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
