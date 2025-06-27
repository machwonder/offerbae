
"use client";

import * as React from "react";
import type { Coupon } from "@/lib/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Calendar, Eye, Handshake } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { getCouponTitle, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function BrandCouponCard({ coupon }: { coupon: Coupon }) {
    const { onOpen } = useModal();
    const { toast } = useToast();
    const title = getCouponTitle(coupon.offerdescription);
    const [formattedDate, setFormattedDate] = React.useState<string | null>(null);
    const hasCode = !!coupon.couponcode;

    React.useEffect(() => {
        if (coupon.offerenddate) {
            try {
                setFormattedDate(format(new Date(coupon.offerenddate), 'PP'));
            } catch (e) {
                console.error("Invalid date for coupon", coupon);
                setFormattedDate(coupon.offerenddate);
            }
        }
    }, [coupon.offerenddate, coupon]);


    const handleCouponClick = () => {
        if (coupon.couponcode) {
            navigator.clipboard.writeText(coupon.couponcode);
            toast({
                title: "Code Copied!",
                description: `Copied ${coupon.couponcode} to your clipboard.`,
            });
        }
        
        onOpen('redirect', {
            url: coupon.clickurl,
            coupon: coupon,
        });
    };

    const renderDescription = () => {
        if (!coupon.offerdescription) return null;
        return (
            <p className={cn("font-medium text-sm pr-8", hasCode ? "text-purple-700" : "text-primary")}>
                {coupon.offerdescription}
            </p>
        );
    };

    return (
        <Card className={cn("overflow-hidden flex flex-col h-full bg-card border", 
            hasCode 
            ? "border-purple-200 border-r-purple-200" 
            : "border-primary/20"
        )}>
            <CardContent className="p-2 relative flex flex-col flex-grow">
                <div className="flex-grow">
                    <div className={cn("absolute top-0 right-0 h-10 w-10 rounded-bl-full flex items-start justify-end p-1", hasCode ? "bg-purple-600/20" : "bg-primary/20")}>
                        <Ticket className={cn("h-5 w-5", hasCode ? "text-purple-600" : "text-primary")} />
                    </div>
                    
                    <p className="font-bold text-lg text-destructive uppercase">{title}</p>
                    
                    <div className={cn("my-2 border-b-2 border-dashed", hasCode ? "border-purple-600/20" : "border-primary/20")} />

                    {renderDescription()}
                    
                    {coupon.couponrestriction && (
                        <p className="text-xs text-muted-foreground">{coupon.couponrestriction}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-[5px]">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Expires: {coupon.offerenddate ? (formattedDate || '...') : 'Ongoing'}</span>
                    </div>
                </div>
                
                <div className="mt-auto pt-2">
                    {coupon.couponcode ? (
                        <button
                            onClick={handleCouponClick}
                            className="group relative mt-2 h-10 w-full overflow-hidden rounded-md border border-purple-300 bg-purple-100/50 text-left focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <div className="flex h-full w-full items-center justify-start px-4">
                                <span className="font-mono text-xl font-bold uppercase tracking-[1px] text-purple-700">
                                    {coupon.couponcode}
                                </span>
                            </div>
                            <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-[linear-gradient(0.3turn,transparent_20%,rgb(139,92,246)_20%)] transition-all group-hover:bg-[linear-gradient(0.3turn,transparent_25%,rgb(167,139,250)_25%)]">
                                <Eye className="mr-2 h-4 w-4 text-white" />
                                <span className="text-sm font-semibold text-white">See Code</span>
                            </div>
                        </button>
                    ) : (
                        <Button
                            onClick={handleCouponClick}
                            variant="ghost"
                            className="w-full mt-2 bg-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                        >
                            <Handshake className="mr-2 h-4 w-4" />
                            Get Deal
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground text-center mt-1.5">
                        for {coupon.advertisername}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
