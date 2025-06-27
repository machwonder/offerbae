


export interface Advertiser {
  id: number;
  network: number;
  name: string;
  status: string;
  categories: string[];
  details: string;
}

export interface AdvertiserOffer {
  commissionTerms?: string;
  offerId?: number;
  offerName?: string;
}

export interface Partnership {
  advertiser: Advertiser;
  status: string;
  status_update_datetime: string;
  approve_datetime: string;
  apply_datetime: string;
  offers: string;
  offerDetails?: AdvertiserOffer;
}

export interface Links {
  next: string | null;
  self: string;
}

export interface Metadata {
  api_name_version: string;
  page: number;
  limit: number;
  total: number;
  _links: Links;
}

export interface Coupon {
  advertiserid: number;
  advertisername: string;
  couponcode: string;
  couponrestriction: string;
  offerdescription: string;
  offerstartdate: string;
  offerenddate: string;
  clickurl: string;
  impressionpixel: string;
}

export interface AdvertiserDetails {
  id: number;
  name: string;
  url: string;
  description: string;
  categories?: string[];
  policies?: {
    international_capabilities?: {
      ships_to: string[];
    };
    software?: {
      dsa: boolean;
      dsa_specs: string;
    };
  };
  features?: {
    premium_advertiser: boolean;
    product_feed: boolean;
    media_opt_report: boolean;
    cross_device_tracking: boolean;
    deep_links: boolean;
    itp_compliant: boolean;
  };
  contact?: {
    name: string;
    job_title: string;
    email: string;
    phone: string;
    country: string;
  };
}

export interface SingleAdvertiserApiResponse {
  advertiser: AdvertiserDetails;
  _metadata: {
    api_name_version: string;
  };
}

export interface RakutenApiResponse {
  _metadata: Metadata;
  partnerships: Partnership[];
  advertisers: AdvertiserDetails[];
  merchRequestUrl?: string;
}

interface SearchResultSuccess extends RakutenApiResponse {}
interface SearchResultError { error: string }
export type SearchResult = SearchResultSuccess | SearchResultError;

// Types for Coupon Search
export interface CouponFeedData {
  TotalMatches: number;
  TotalPages: number;
  PageNumberRequested: number;
  link?: Coupon[];
}

export interface CouponApiResponse {
  couponfeed: CouponFeedData;
}

interface CouponSearchResultSuccess extends CouponApiResponse {}
interface CouponSearchResultError { error: string }
export type CouponSearchResult = CouponSearchResultSuccess | CouponSearchResultError;

// Types for Product Search
export interface Product {
  mid: number;
  merchantname: string;
  linkid: string;
  createdon: string;
  sku: string | number;
  productname: string;
  category: {
    primary: string;
    secondary: string;
  };
  price: {
    '@_currency': string;
    '#text'?: number;
  };
  saleprice: {
    '@_currency': string;
    '#text'?: number;
  };
  upccode: string | number;
  description: {
    short: string;
    long: string;
  };
  keywords: string;
  linkurl: string;
  imageurl: string;
  availableCoupons?: Coupon[];
  advertiserUrl?: string;
}

export interface ProductSearchResponseData {
  TotalMatches: number;
  TotalPages: number;
  PageNumber: number;
  item?: Product[];
  error?: string;
}

export interface ProductSearchApiResponse {
  productSearchResponse: ProductSearchResponseData;
}

interface ProductSearchResultSuccess extends ProductSearchApiResponse {}
interface ProductSearchResultError { error: string }
export type ProductSearchResult = ProductSearchResultSuccess | ProductSearchResultError;


// Types for Links Search
export interface LinkItem {
  campaignID?: number;
  categoryID?: number;
  categoryName?: string;
  linkID: number;
  linkName: string;
  mid: number;
  nid?: number;
  code?: string; // HTML code for banner/rich media
  clickURL?: string; // for text links
  textDisplay?: string; // for text links
  endDate?: string;
  height?: number;
  width?: number;
  serverType?: number;
  showURL?: string; // Pixel URL or sometimes image URL
  imgURL?: string; // Specific banner image URL
  size?: string; // Banner size, e.g. "468x60"
  startDate?: string;
}

export interface LinkApiResponse {
  links: LinkItem[];
  requestUrl?: string;
}

interface LinkSearchResultSuccess extends LinkApiResponse {}
interface LinkSearchResultError { error: string; requestUrl?: string; }
export type LinkSearchResult = LinkSearchResultSuccess | LinkSearchResultError;

// Types for Merch Info API Test
export interface MerchOfferDetails {
  alsoName: string;
  commissionTerms: string;
  offerId: number;
  offerName: string;
}

export interface MerchDetails {
  applicationStatus: string;
  categories: string;
  mid: number;
  name: string;
  offer: MerchOfferDetails | MerchOfferDetails[]; // Can be single or array
}

export interface MerchByCategoryResult {
  error?: string;
  merchants?: MerchDetails[];
}

export interface MerchApiResponse {
  getMerchByIDResponse: {
    return: MerchDetails;
  };
}

export interface MerchInfoResult {
  error?: string;
  data?: MerchDetails;
}

// Types for Brand Page
export interface BrandPageData {
  advertiserDetails: AdvertiserDetails | null;
  productData: ProductSearchResponseData;
  coupons: Coupon[];
}

export type BrandPageResult = BrandPageData | { error: string };

export interface ProductInsightResult {
  products: Product[];
  totalMatches: number;
  error?: string;
}

export interface MoreProductsResult {
  products?: Product[];
  error?: string;
}
