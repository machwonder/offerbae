"use client";

import { useModal } from "@/hooks/use-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getCouponTitle } from "@/lib/utils";
import { Copy, Share2, Calendar, Ticket, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Coupon } from "@/lib/types";
import * as React from "react";

export const CouponModal = () => {
    const { isOpen, onClose, type, data, onOpen } = useModal();
    const { toast } = useToast();
    const { coupon } = data as { coupon?: Coupon };
    const [formattedDate, setFormattedDate] = React.useState<string | null>(null);
    
    const isModalOpen = isOpen && type === 'coupon' && !!coupon;

    React.useEffect(() => {
        if (isModalOpen && coupon?.offerenddate) {
            setFormattedDate(format(new Date(coupon.offerenddate), 'PP'));
        }
    }, [isModalOpen, coupon?.offerenddate]);


    if (!isModalOpen) {
        return null;
    }

    const title = getCouponTitle(coupon.offerdescription);

    const handleCopyCode = () => {
        if (!coupon.couponcode) return;
        navigator.clipboard.writeText(coupon.couponcode);
        toast({
            title: "Code Copied!",
            description: `Copied ${coupon.couponcode} to your clipboard.`,
        });
    };

    const handleShare = () => {
        const couponData = encodeURIComponent(JSON.stringify(coupon));
        const url = `${window.location.origin}/coupons?couponData=${couponData}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Link Copied!",
            description: "A shareable link has been copied to your clipboard.",
        });
    };

    const handleGetDeal = () => {
        if (coupon.couponcode) {
            handleCopyCode();
        }
        onClose(); // Close the modal before starting the redirect flow
        setTimeout(() => {
             onOpen('redirect', {
                url: coupon.clickurl,
                coupon: coupon,
            });
        }, 150);
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                         <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-lg">
                            <Ticket className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl text-destructive uppercase">{title}</DialogTitle>
                            <p className="text-sm text-muted-foreground">with {coupon.advertisername}</p>
                        </div>
                    </div>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-base font-medium">{coupon.offerdescription}</p>
                     {coupon.couponrestriction && (
                        <p className="text-sm text-muted-foreground">{coupon.couponrestriction}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Calendar className="h-4 w-4" />
                        <span>Expires: {coupon.offerenddate ? (formattedDate || '...') : 'Ongoing'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button variant="outline" onClick={handleShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                     {coupon.couponcode ? (
                        <Button onClick={handleGetDeal} className="font-mono tracking-wider">
                            {coupon.couponcode}
                            <Copy className="ml-auto h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleGetDeal}>
                            Get Deal
                           <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
                 {coupon.couponcode && (
                    <Button onClick={handleGetDeal} className="w-full mt-2">
                        Go to Site & Activate Deal
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </DialogContent>
        </Dialog>
    );
};
