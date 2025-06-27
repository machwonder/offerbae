"use client";

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLogoUrl, slugify } from '@/lib/utils';
import type { BrandPageData, Product, Coupon, AdvertiserDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Tag, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import BrandProductCard from './brand-product-card';
import BrandCouponCard from './brand-coupon-card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { searchProducts } from '@/app/actions';

interface BrandPageProps {
    data: BrandPageData;
    brandId: number;
    initialPage: number;
}

export default function BrandPage({ data: initialData, brandId, initialPage }: BrandPageProps) {
    const { toast } = useToast();
    
    const [advertiserDetails] = React.useState<AdvertiserDetails | null>(initialData.advertiserDetails);
    const [products, setProducts] = React.useState<Product[]>(initialData.productData.item || []);
    const [coupons] = React.useState<Coupon[]>(initialData.coupons);
    
    const [page, setPage] = React.useState<number>(initialPage);
    const [totalPages, setTotalPages] = React.useState<number>(initialData.productData.TotalPages || 1);
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    
    const isOnSale = (p: Product) => {
        const regularPrice = p.price?.['#text'];
        const salePrice = p.saleprice?.['#text'];
        return !!(regularPrice && salePrice && salePrice > 0 && salePrice < regularPrice);
    };
    
    const hasSaleItems = React.useMemo(() => products.some(isOnSale), [products]);

    // When true, sales items are hidden. Toggle is OFF.
    // When false, all items are shown. Toggle is ON.
    const [hideSales, setHideSales] = React.useState(false);
    
    React.useEffect(() => {
        // This effect directly manipulates the DOM to hide/show sale products based on the toggle state.
        const saleProducts = document.querySelectorAll<HTMLElement>('.on-sale');
        saleProducts.forEach(el => {
            el.style.display = hideSales ? 'none' : 'flex';
        });
    }, [hideSales, products]);
    
    const handleFetchProducts = React.useCallback(async (pageNum: number, term: string) => {
        setIsLoading(true);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('page', pageNum.toString());
        if (term) newUrl.searchParams.set('q', term);
        else newUrl.searchParams.delete('q');
        window.history.pushState({ path: newUrl.href }, '', newUrl.href);

        try {
            const searchPayload: Record<string, any> = {
                mid: brandId,
                keyword: term,
                max: 100,
                pagenumber: pageNum,
            };
            
            const result = await searchProducts(searchPayload);
            
            if ('error' in result) {
                toast({ variant: 'destructive', title: "Filter Error", description: result.error });
            } else {
                const response = result.productSearchResponse;
                setProducts(response?.item || []);
                setPage(response?.PageNumber || 1);
                setTotalPages(response?.TotalPages || 1);
                setHideSales(false);
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: "An unexpected error occurred", description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [brandId, toast]);
    
    React.useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm) {
                handleFetchProducts(1, searchTerm);
            }
        }, 500); 

        return () => clearTimeout(handler);
    }, [searchTerm, handleFetchProducts]);


    const sortedProducts = React.useMemo(() => {
        return [...products].sort((a, b) => {
          const getSavings = (p: Product) => {
            const regularPrice = p.price?.['#text'];
            const salePrice = p.saleprice?.['#text'];
            if (regularPrice && salePrice && salePrice < regularPrice && regularPrice > 0) {
              return ((regularPrice - salePrice) / regularPrice) * 100;
            }
            return -1;
          };

          const savingsA = getSavings(a);
          const savingsB = getSavings(b);

          return savingsB - savingsA;
        });
    }, [products]);


    const sortedCoupons = React.useMemo(() => {
        if (!coupons) return [];
        return [...coupons].sort((a, b) => {
            const aHasCode = !!a.couponcode;
            const bHasCode = !!b.couponcode;

            if (aHasCode && !bHasCode) return -1;
            if (!aHasCode && bHasCode) return 1;

            const dateA = a.offerenddate ? new Date(a.offerenddate).getTime() : Infinity;
            const dateB = b.offerenddate ? new Date(b.offerenddate).getTime() : Infinity;

            if (dateA !== dateB) {
                return dateA - dateB;
            }

            return a.offerdescription.localeCompare(b.offerdescription);
        });
    }, [coupons]);


    if (!advertiserDetails) {
        return <div>Brand details not found.</div>;
    }

    const logoUrl = getLogoUrl(advertiserDetails.url);

    return (
        <div className="flex-grow flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)] gap-8 px-8 py-0">
            <main className="w-full lg:w-3/4 lg:overflow-y-auto lg:h-full pr-4 space-y-6 pt-8 pb-8 mb-8 lg:mb-0">
                <header className="relative pb-4">
                    <div className="relative z-10 flex items-start gap-4">
                        {logoUrl && (
                            <div className="flex-shrink-0 h-16 w-16 rounded-lg flex items-center justify-center p-1">
                                <Image
                                    src={logoUrl}
                                    alt={`${advertiserDetails.name} Logo`}
                                    width={64}
                                    height={64}
                                    className="object-contain"
                                />
                            </div>
                        )}
                        <div className="flex-grow space-y-1">
                            <Link href={`/brand/${brandId}-${slugify(advertiserDetails.name)}`}>
                                <h1 className="text-lg font-bold text-foreground hover:text-primary">
                                    {advertiserDetails.name}
                                </h1>
                            </Link>
                             <p className="text-muted-foreground text-xs max-w-2xl">
                                {advertiserDetails.description}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Products from {advertiserDetails.name}</h2>
                    <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card border rounded-lg">
                        <div className="flex-grow w-full">
                            <Input
                                placeholder={`Search products from ${advertiserDetails.name}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="text-base"
                            />
                        </div>
                            <div className="flex items-center space-x-2 pr-2 flex-shrink-0">
                            <Switch
                                id="sale-filter"
                                checked={!hideSales}
                                onCheckedChange={(checked) => setHideSales(!checked)}
                                disabled={!hasSaleItems}
                            />
                            <Label htmlFor="sale-filter" className="font-semibold">
                                On Sale
                            </Label>
                        </div>
                        {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                    </div>
                </div>
                
                {sortedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {sortedProducts.map(product => (
                            <BrandProductCard key={product.linkid} product={product} />
                        ))}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center text-center p-12">
                        <h3 className="text-lg font-semibold">No Products Found</h3>
                        <p className="text-muted-foreground mt-2">No products matched your filter criteria.</p>
                    </Card>
                )}

                {totalPages > 1 && !searchTerm && (
                    <div className="flex items-center justify-center mt-8 gap-4">
                        <Button
                            variant="outline"
                            onClick={() => handleFetchProducts(page - 1, searchTerm)}
                            disabled={page <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => handleFetchProducts(page + 1, searchTerm)}
                            disabled={page >= totalPages || isLoading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                )}
            </main>
            <aside className="w-full lg:w-1/4 space-y-6 lg:overflow-y-auto lg:h-full pt-8 pb-8 mb-8 lg:mb-0">
                 <h2 className="text-xl font-bold">Active Deals</h2>
                    {sortedCoupons.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            {sortedCoupons.map((coupon, index) => (
                                <BrandCouponCard key={`${coupon.couponcode}-${index}`} coupon={coupon} />
                            ))}
                        </div>
                    ) : (
                        <Card className="flex flex-col items-center justify-center text-center p-12">
                            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Coupons Available</h3>
                            <p className="text-muted-foreground mt-2">Check back soon for new deals!</p>
                        </Card>
                    )}
            </aside>
        </div>
    );
}
