
"use client";

import Image from "next/image";
import { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import { slugify, cn, getCurrencySymbol } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

export default function BrandProductCard({ product }: { product: Product }) {
    const router = useRouter();

    const handleNavigation = () => {
        sessionStorage.setItem(`product-${product.linkid}`, JSON.stringify(product));
        const brandSlug = slugify(product.merchantname);
        const productSlug = slugify(product.productname);
        router.push(`/item/${brandSlug}/${productSlug}-${product.linkid}`);
    };

    const regularPrice = product.price?.['#text'];
    const salePrice = product.saleprice?.['#text'];
    const currency = getCurrencySymbol(product.price?.['@_currency']);
    const savingsPercentage = regularPrice && salePrice && salePrice < regularPrice
        ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
        : null;
    
    const isOnSale = !!(savingsPercentage && savingsPercentage > 0);

    return (
        <Card
            onClick={handleNavigation}
            className={cn(
                "cursor-pointer group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col on-sale-card",
                isOnSale ? "on-sale" : "not-on-sale"
            )}
        >
            <div className="aspect-square relative">
                {product.imageurl ? (
                    <Image
                        src={product.imageurl}
                        alt={product.productname}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                         <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
                {savingsPercentage && (
                    <Badge variant="destructive" className="absolute top-2 left-2 bg-transparent text-destructive font-bold hover:bg-transparent">
                        {savingsPercentage}% OFF
                    </Badge>
                )}
            </div>
            <div className="p-4 space-y-2 flex flex-col flex-grow">
                <p className="font-semibold text-foreground text-sm">{product.productname}</p>
                <div className="flex flex-col mt-auto">
                    {isOnSale && salePrice && regularPrice ? (
                        <>
                            <span className="text-lg font-bold text-destructive">{currency}{salePrice.toFixed(2)}</span>
                            <span className="text-sm font-medium text-muted-foreground line-through">{currency}{regularPrice.toFixed(2)}</span>
                        </>
                    ) : (
                    regularPrice && <span className="text-lg font-bold text-foreground">{currency}{regularPrice.toFixed(2)}</span>
                    )}
                </div>
            </div>
        </Card>
    );
}
