'use client';

import { useModal } from '@/hooks/use-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export const PrivacyPolicyModal = () => {
  const { isOpen, onClose, type } = useModal();
  const isModalOpen = isOpen && type === 'privacyPolicy';

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>
            <div>Effective Date: June 27, 2024</div>
            <div>Website: www.offerbae.com</div>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-4 text-sm text-muted-foreground">
             <p>
                OfferBae ("we", "our", or "us") values your privacy. This Privacy Policy outlines how we handle user information and data when you visit our website.
            </p>

            <h3 className="font-semibold text-foreground">
              1. Information We Do Not Collect
            </h3>
            <p>
             We do not collect personal information such as names, email addresses, phone numbers, or payment details from visitors. We do not offer user registration, newsletters, or account creation.
            </p>

            <h3 className="font-semibold text-foreground">
              2. Cookies and Tracking Technologies
            </h3>
            <p>
             While we do not personally collect or store data, third-party affiliate partners such as Rakuten, CJ Affiliate, Amazon Associates, and AWIN may use cookies or tracking technologies to identify referral traffic.
            </p>
             <p>These cookies may track:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pages visited</li>
              <li>Time spent on site</li>
              <li>Purchases made after clicking affiliate links</li>
            </ul>
             <p>Please refer to each affiliate network’s privacy policy for details on how they handle this information.</p>

            <h3 className="font-semibold text-foreground">
              3. Third-Party Links
            </h3>
            <p>
             Our website contains links to third-party merchants and platforms. Once you leave our site, your interactions are governed by the privacy policies of those third-party websites. We are not responsible for the content or privacy practices of external sites.
            </p>

            <h3 className="font-semibold text-foreground">
              4. Children’s Privacy
            </h3>
            <p>
              Our website is not specifically directed to children under the age of 13. We do not knowingly collect personal information from minors.
            </p>

             <h3 className="font-semibold text-foreground">
              5. Data Security
            </h3>
            <p>
              Since we do not collect or store any personal data, we do not maintain databases of user information. However, we do maintain standard security protocols for general site operations.
            </p>
            
            <h3 className="font-semibold text-foreground">
              6. Changes to This Policy
            </h3>
            <p>
             We may update this Privacy Policy from time to time. Changes will be reflected with a new “Effective Date” at the top of this page.
            </p>
            
            <h3 className="font-semibold text-foreground">
              7. Contact Us
            </h3>
            <p>
              If you have questions or concerns regarding this policy, contact us at: 📧 Email: info@offerbae.com
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
