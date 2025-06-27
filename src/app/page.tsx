
"use client";

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { searchProducts, searchCoupons } from '@/app/actions';
import HomepageProductCard from '@/components/homepage-product-card';
import BrandCouponCard from '@/components/brand-coupon-card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Search, MousePointerClick, Loader2 } from "lucide-react";
import type { Product, Coupon } from '@/lib/types';
import Link from 'next/link';
import HomepageSearch from '@/components/homepage-search';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = React.useState<Product[]>([]);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [loadingCoupons, setLoadingCoupons] = React.useState(true);
  const isFirstLoad = React.useRef(true);


  const performSearch = (newQuery: string) => {
    const url = newQuery ? `/?q=${encodeURIComponent(newQuery)}` : '/';
    router.push(url, { scroll: false });
  };
  
  React.useEffect(() => {
    setLoadingProducts(true);
    setError(null);

    // Fetch products based on query from URL
    searchProducts({ keyword: query || undefined, max: 100 })
      .then(result => {
        if (!('error' in result) && result.productSearchResponse?.item) {
          setProducts(result.productSearchResponse.item);
           if (query && result.productSearchResponse.item.length === 0) {
            toast({
                title: "No products found",
                description: "Try a different search term."
            });
          }
        } else if ('error' in result) {
          setError(prev => prev ? `${prev}\n${result.error}` : result.error);
        }
      })
      .catch(e => setError(e.message || "An unexpected error occurred."))
      .finally(() => setLoadingProducts(false));

    // Fetch coupons only on the first load, not every time the search query changes.
    if (isFirstLoad.current) {
        setLoadingCoupons(true);
        searchCoupons({ resultsperpage: 20 })
            .then(result => {
                if (!('error' in result) && result.couponfeed?.link) {
                    setCoupons(result.couponfeed.link);
                } else if ('error' in result) {
                    setError(prev => prev ? `${prev}\n${result.error}` : result.error);
                }
            })
            .catch(e => setError(e.message || "An unexpected error occurred."))
            .finally(() => {
                setLoadingCoupons(false);
                isFirstLoad.current = false;
            });
    }
  }, [query, toast]);

  if (error && products.length === 0 && coupons.length === 0 && !loadingProducts && !loadingCoupons) {
     return (
        <div className="p-4 md:p-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Homepage</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] gap-8 px-8 py-0">
      <main className="w-full lg:w-3/4 lg:overflow-y-auto lg:h-full pr-4 space-y-4 pt-8 pb-8 mb-8 lg:mb-0">
        <header className="text-left mb-4">
          <h1 className="text-2xl font-bold font-headline text-primary">Newest Products from Top Brands</h1>
          <p className="text-lg text-muted-foreground mt-2 flex items-center gap-1.5">
            Click <MousePointerClick className="inline-block h-5 w-5 text-primary" /> on an item to see product details...
          </p>
        </header>
        <HomepageSearch onSearch={performSearch} isLoading={loadingProducts} initialQuery={query} />
        {loadingProducts ? (
            <div className="flex justify-center items-center p-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.length > 0 ? products.map(product => (
              <HomepageProductCard key={product.linkid} product={product} />
            )) : (
              <p className="col-span-full text-center text-muted-foreground py-16">No products found. Try a different search term.</p>
            )}
          </div>
        )}
      </main>
      <aside className="lg:w-1/4 w-full space-y-6 lg:overflow-y-auto lg:h-full pt-8 pb-8 mb-8 lg:mb-0">
        <div>
          <h2 className="text-xl font-bold">Newest Coupons</h2>
          <Link href="/admin/coupons" className="text-sm text-primary hover:underline flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            <span>Search for Coupons</span>
          </Link>
        </div>
        {loadingCoupons ? (
          <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            {coupons.length > 0 ? (
                coupons.map((coupon, index) => (
                    <BrandCouponCard key={`${coupon.advertiserid}-${index}`} coupon={coupon} />
                ))
            ) : (
                <p className="text-muted-foreground">No coupons found.</p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
