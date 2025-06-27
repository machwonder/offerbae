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

export const TermsModal = () => {
  const { isOpen, onClose, type } = useModal();
  const isModalOpen = isOpen && type === 'termsOfService';

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Effective Date: June 27, 2024</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Welcome to OfferBae (www.offerbae.com) (“we,” “our,” or “us”). By
              accessing or using our website, you agree to be bound by these
              Terms of Service (“Terms”). If you do not agree to these Terms,
              you should not use our website.
            </p>

            <h3 className="font-semibold text-foreground">
              1. Use of the Website
            </h3>
            <p>
              OfferBae provides visitors with access to a curated collection of
              brand promotions, discounted items, and affiliate-linked shopping
              opportunities. By using this site, you acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are using the site for lawful purposes only.</li>
              <li>
                You will not attempt to interfere with the operation or security
                of the website.
              </li>
              <li>
                You understand that OfferBae may update, change, or remove
                content at any time without notice.
              </li>
            </ul>

            <h3 className="font-semibold text-foreground">
              2. Affiliate Disclosure
            </h3>
            <p>
              OfferBae participates in several affiliate marketing programs,
              including but not limited to Rakuten, CJ Affiliate, Amazon
              Associates, and AWIN. This means we may earn a commission if you
              click on a link and make a purchase through a third-party
              website. This comes at no extra cost to you.
            </p>
            <p>
              We do our best to ensure that promotions are current and accurate,
              but we cannot guarantee pricing, availability, or product
              descriptions on third-party sites.
            </p>

            <h3 className="font-semibold text-foreground">
              3. Intellectual Property
            </h3>
            <p>
              All content on this website, including text, images, graphics,
              logos, and design, is the property of OfferBae or its content
              suppliers and is protected by copyright, trademark, and other
              applicable laws.
            </p>
            <p>
              You may not reproduce, distribute, or exploit any content without
              prior written permission.
            </p>

            <h3 className="font-semibold text-foreground">
              4. Limitation of Liability
            </h3>
            <p>
              OfferBae provides content on an “as-is” and “as-available” basis.
              We make no warranties or representations regarding the accuracy or
              reliability of the content or any linked third-party services.
            </p>
            <p>
              We are not liable for any damages arising from the use of our
              website or the purchase of products or services from third-party
              merchants.
            </p>

            <h3 className="font-semibold text-foreground">
              5. Third-Party Links
            </h3>
            <p>
              This site contains links to external websites operated by third
              parties. OfferBae has no control over these websites and is not
              responsible for their content, privacy practices, or terms of
              service. You access third-party websites at your own risk.
            </p>

            <h3 className="font-semibold text-foreground">
              6. Privacy Policy
            </h3>
            <p>
              OfferBae does not collect personal information from its users. We
              do not run user accounts, email subscriptions, or store visitor
              data. Please note, however, that third-party affiliate partners
              may use cookies or tracking technologies to facilitate referral
              tracking. You are encouraged to review the privacy policies of
              those third-party websites.
            </p>

            <h3 className="font-semibold text-foreground">
              7. Governing Law
            </h3>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the State of Texas, specifically Bastrop County,
              without regard to its conflict of law principles.
            </p>

            <h3 className="font-semibold text-foreground">
              8. Changes to the Terms
            </h3>
            <p>
              We reserve the right to update or modify these Terms at any time
              without prior notice. Continued use of the website after any
              changes are made constitutes your acceptance of the new Terms.
            </p>

            <h3 className="font-semibold text-foreground">9. Contact Us</h3>
            <p>
              If you have any questions or concerns about these Terms, please
              contact us at: 📧 Email: info@offerbae.com
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
