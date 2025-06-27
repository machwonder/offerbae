"use client";

import * as React from "react";
import type { Coupon } from "@/lib/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Calendar, Barcode, ExternalLink } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { getCouponTitle } from "@/lib/utils";

interface HomepageCouponCardProps {
    coupon: Coupon;
}

export default function HomepageCouponCard({ coupon }: HomepageCouponCardProps) {
    const { onOpen } = useModal();
    const title = getCouponTitle(coupon.offerdescription);
    const [formattedDate, setFormattedDate] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (coupon.offerenddate) {
            try {
                setFormattedDate(format(new Date(coupon.offerenddate), 'PP'));
            } catch (e) {
                console.error("Invalid date for coupon", coupon);
                setFormattedDate(coupon.offerenddate);
            }
        }
    }, [coupon.offerenddate]);

    const handleCouponClick = () => {
        onOpen('coupon', { coupon });
    };

    return (
        <Card className="transition-all hover:shadow-lg">
            <CardContent className="p-4 space-y-3">
                <div className="flex gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg mt-1 h-fit">
                        <Ticket className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="font-bold text-destructive uppercase">{title}</p>
                        <p className="text-sm text-muted-foreground">with {coupon.advertisername}</p>
                        <p className="text-sm pt-2">{coupon.offerdescription}</p>
                        
                        {coupon.couponrestriction && (
                            <p className="text-xs text-muted-foreground pt-1">{coupon.couponrestriction}</p>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Expires: {coupon.offerenddate ? (formattedDate || '...') : 'Ongoing'}</span>
                        </div>
                    </div>
                </div>
                
                <Button
                    onClick={handleCouponClick}
                    variant="secondary"
                    className="w-full mt-2"
                >
                    {coupon.couponcode ? (
                        <>
                            <span>Get Code</span>
                            <Barcode className="ml-auto h-5 w-5" />
                        </>
                    ) : (
                        <>
                            <span>Get Deal</span>
                            <ExternalLink className="ml-auto h-4 w-4" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
