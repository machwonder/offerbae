
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  if (!text) {
    return ""
  }
  return text
    .toString()
    .normalize("NFD") // split an accented letter into the base letter and the accent
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/[^\w-]+/g, "") // remove all non-word chars
    .replace(/--+/g, "-") // replace multiple - with single -
}

export const getLogoUrl = (advertiserUrl: string | undefined): string | null => {
    if (!advertiserUrl) return null;
    try {
      const fullUrl = advertiserUrl.startsWith('http') ? advertiserUrl : `https://${advertiserUrl}`;
      const url = new URL(fullUrl);
      let hostname = url.hostname;
      hostname = hostname.replace(/^www\./, '');
      if (hostname) {
        return `https://img.logo.dev/${hostname}?token=pk_c-0vMnb4Q7-kr6zNd5ttBA`;
      }
      return null;
    } catch (error) {
      console.error("Invalid URL for logo generation:", advertiserUrl, error);
      return null;
    }
  };

export const getDomainFromName = (name: string): string | null => {
    if (!name) return null;
    // A simple heuristic to guess a domain from a brand name
    // e.g., "Saks Fifth Avenue" -> "saksfifthavenue.com"
    // e.g., "J.Crew" -> "jcrew.com"
    const domain = name
        .replace(/&/g, 'and')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    
    if (domain) {
        return `${domain}.com`;
    }
    return null;
}

export const getCurrencySymbol = (currencyCode: string | undefined): string => {
    if (!currencyCode) return "$";
    const symbols: { [key:string]: string } = { USD: "$", CAD: "C$", EUR: "€", GBP: "£", JPY: "¥" };
    return symbols[currencyCode] || currencyCode + " ";
};

export const getCouponTitle = (offerText: string): string => {
    if (!offerText) return "";

    const lowerOfferText = offerText.toLowerCase();

    if (
      lowerOfferText.includes("free shipping") ||
      lowerOfferText.includes("free delivery") ||
      lowerOfferText.includes("freeship") ||
      lowerOfferText.includes("free ship") ||
      lowerOfferText.includes("free worldwide delivery") ||
      /\bfree\s+\w+\s+shipping\b/i.test(offerText)
    ) {
      return "Free Shipping";
    }

    const percentageMatches = [...offerText.matchAll(/(\d+(\.\d+)?)\s*%\s*off/gi)];
    if (percentageMatches.length > 0) {
      const percentages = percentageMatches.map(match => parseFloat(match[1]));
      const maxPercentage = Math.max(...percentages);
      return `${maxPercentage}% Off`;
    }
    
    const currencyMatches = [
      ...offerText.matchAll(/([$£€])(\d+(\.\d+)?)\s*off/gi),
      ...offerText.matchAll(/save\s+([$£€])(\d+(\.\d+)?)/gi)
    ];
    if (currencyMatches.length > 0) {
      let maxAmount = 0;
      let currencySymbol = '';
      currencyMatches.forEach(match => {
        const amount = parseFloat(match[2]);
        if (amount > maxAmount) {
          maxAmount = amount;
          currencySymbol = match[1];
        }
      });
      if (maxAmount > 0) {
        return `${currencySymbol}${maxAmount} Off`;
      }
    }

    const currencyRangeMatch = offerText.match(/([$£€]\d+(?:\.\d+)?\s*-\s*[$£€]\d+(?:\.\d+)?)/i);
    if (currencyRangeMatch) {
      return `${currencyRangeMatch[1]} Off`;
    }

    const comboDealMatch = offerText.match(/\d+\s+for\s+\$?(\d+)/i);
    const itemForPriceMatch = offerText.match(/\d+\s+.+?\s+for/i);
    const wordComboDealMatch = offerText.match(/\b(two|three)\s+\w+/i);
    const buyNumberMatch = offerText.match(/\bbuy\s+\d+\s+\w+/i);

    if (comboDealMatch || itemForPriceMatch || wordComboDealMatch || buyNumberMatch) {
      return "Combo Deal";
    }

    return "Shop Now";
  };
