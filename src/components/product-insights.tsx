
"use client";

import * as React from "react";
import { useSearchParams } from 'next/navigation';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";

import { searchAllProducts } from "@/app/actions";
import { Product, ProductInsightResult } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import InsightsLoader from "@/components/insights-loader";

const chartConfig = {
  avgPrice: {
    label: "Avg. Price",
    color: "hsl(var(--chart-1))",
  },
  avgSavings: {
    label: "Avg. Savings",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function ProductInsights() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [chartData, setChartData] = React.useState<{
    avgPriceByMerchant: { name: string; avgPrice: number }[];
    avgSavingsByMerchant: { name:string; avgSavings: number }[];
    totalProducts: number;
    totalMatches: number;
  }>({ avgPriceByMerchant: [], avgSavingsByMerchant: [], totalProducts: 0, totalMatches: 0 });

  React.useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      
      const values: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        values[key] = value;
      });

      if (Object.keys(values).length === 0) {
        setError("No search parameters provided. Please start a search on the Products page first.");
        setLoading(false);
        return;
      }

      try {
        toast({
          title: "Fetching Full Results...",
          description: "This may take a moment as we gather data from all pages.",
        });

        const result: ProductInsightResult = await searchAllProducts(values);

        if ('error' in result) {
          setError(result.error);
          toast({
            variant: "destructive",
            title: "Error fetching insights",
            description: result.error,
          });
        } else {
          const products = result.products;

          const merchantStats: { [key: string]: { totalPrice: number; totalSavings: number; productCount: number; savingsCount: number } } = {};

          products.forEach(p => {
            if (!merchantStats[p.merchantname]) {
              merchantStats[p.merchantname] = { totalPrice: 0, totalSavings: 0, productCount: 0, savingsCount: 0 };
            }
            const price = p.saleprice?.['#text'] || p.price?.['#text'];
            if (price) {
              merchantStats[p.merchantname].totalPrice += price;
              merchantStats[p.merchantname].productCount++;
            }

            const regularPrice = p.price?.['#text'];
            const salePrice = p.saleprice?.['#text'];
            if (regularPrice && salePrice && salePrice < regularPrice) {
              merchantStats[p.merchantname].totalSavings += (regularPrice - salePrice);
              merchantStats[p.merchantname].savingsCount++;
            }
          });

          const avgPriceByMerchant = Object.entries(merchantStats)
            .map(([name, stats]) => ({
              name: name.split(' ')[0],
              avgPrice: stats.productCount > 0 ? parseFloat((stats.totalPrice / stats.productCount).toFixed(2)) : 0,
            }))
            .filter(d => d.avgPrice > 0)
            .sort((a, b) => a.avgPrice - b.avgPrice)
            .slice(0, 15);

          const avgSavingsByMerchant = Object.entries(merchantStats)
            .map(([name, stats]) => ({
              name: name.split(' ')[0],
              avgSavings: stats.savingsCount > 0 ? parseFloat((stats.totalSavings / stats.savingsCount).toFixed(2)) : 0,
            }))
            .filter(d => d.avgSavings > 0)
            .sort((a, b) => b.avgSavings - a.avgSavings)
            .slice(0, 15);
          
          setChartData({ avgPriceByMerchant, avgSavingsByMerchant, totalProducts: products.length, totalMatches: result.totalMatches });
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [searchParams, toast]);

  if (loading) {
    return <InsightsLoader />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Insights Summary</CardTitle>
                <CardDescription>
                    Analyzed {chartData.totalProducts} products out of {new Intl.NumberFormat().format(chartData.totalMatches)} total matches found (up to 10 pages).
                </CardDescription>
            </CardHeader>
        </Card>
      
        {chartData.avgPriceByMerchant.length > 0 && (
            <Card>
            <CardHeader>
                <CardTitle>Average Product Price by Merchant</CardTitle>
                <CardDescription>Shows the average price for products found (top 15 cheapest).</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={chartData.avgPriceByMerchant} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    />
                    <YAxis
                    tickFormatter={(value) => `$${value}`}
                    tickLine={false}
                    axisLine={false}
                    />
                    <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        formatter={(value) => typeof value === 'number' ? `$${value.toFixed(2)}` : ''}
                        indicator="dot"
                    />}
                    />
                    <Bar dataKey="avgPrice" fill="var(--color-avgPrice)" radius={4} />
                </BarChart>
                </ChartContainer>
            </CardContent>
            </Card>
        )}
        {chartData.avgSavingsByMerchant.length > 0 && (
            <Card>
            <CardHeader>
                <CardTitle>Average Savings by Merchant</CardTitle>
                <CardDescription>Shows the average discount for products on sale (top 15 best deals).</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={chartData.avgSavingsByMerchant} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    />
                    <YAxis
                        tickFormatter={(value) => `$${value}`}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                        formatter={(value) => typeof value === 'number' ? `$${value.toFixed(2)}` : ''}
                        indicator="dot"
                        />}
                    />
                    <Bar dataKey="avgSavings" fill="var(--color-avgSavings)" radius={4} />
                </BarChart>
                </ChartContainer>
            </CardContent>
            </Card>
        )}
    </div>
  );
}
