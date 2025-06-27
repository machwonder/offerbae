
import { Suspense } from 'react';
import ProductInsights from '@/components/product-insights';
import InsightsLoader from '@/components/insights-loader';

function InsightsContent() {
  return (
    <div className="p-4 md:p-8">
      <header className="text-left mb-8">
        <h1 className="text-xl font-bold font-headline text-primary">Product Search Insights</h1>
        <p className="text-base text-muted-foreground mt-2">
          Visualize aggregated data from your full product search results.
        </p>
      </header>
      <ProductInsights />
    </div>
  );
}

export default function InsightsPage() {
    return (
        <Suspense fallback={<InsightsLoader />}>
            <InsightsContent />
        </Suspense>
    )
}
