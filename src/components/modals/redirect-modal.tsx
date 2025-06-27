"use client";

import { useModal } from "@/hooks/use-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink, Loader2 } from "lucide-react";

export const RedirectModal = () => {
    const { isOpen, type } = useModal();
    
    const isModalOpen = isOpen && type === 'redirect';

    return (
        <Dialog open={isModalOpen}>
            <DialogContent className="flex flex-col items-center justify-center text-center p-8" hideCloseButton>
                <ExternalLink className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-lg font-medium mt-4">Opening Store Website...</p>
                <p className="text-sm text-muted-foreground">Please wait while we redirect you.</p>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-4" />
            </DialogContent>
        </Dialog>
    );
};
