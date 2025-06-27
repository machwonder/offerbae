
'use server';

import type { RakutenApiResponse, SearchResult, SingleAdvertiserApiResponse, AdvertiserDetails, Coupon, CouponSearchResult, CouponApiResponse, ProductSearchResult, ProductSearchApiResponse, LinkSearchResult, LinkApiResponse, LinkItem, Partnership, MerchInfoResult, MerchDetails, MerchByCategoryResult, Product, BrandPageData, BrandPageResult, ProductInsightResult, MoreProductsResult, ProductSearchResponseData } from "@/lib/types";
import { parseStringPromise } from 'xml2js';
import type { ParserOptions } from 'xml2js';

// Common parser options for xml2js to mimic fast-xml-parser's behavior where useful
const xmlParserOptions: ParserOptions = {
  explicitArray: false, // We will handle array normalization manually for robustness
  mergeAttrs: false,
  attrkey: '@_',
  charkey: '#text',
  tagNameProcessors: [name => name.replace(/^.+?:/, '')] // Strip namespaces
};


// Helper function to get a new access token
async function getAccessToken(): Promise<{ access_token?: string; error?: string }> {
  const clientId = process.env.RAKUTEN_CLIENT_ID;
  const clientSecret = process.env.RAKUTEN_CLIENT_SECRET;
  const refreshToken = process.env.RAKUTEN_REFRESH_TOKEN;
  const accountId = process.env.RAKUTEN_ACCOUNT_ID;

  const missingVars = [];
  if (!clientId || clientId === "YOUR_CLIENT_ID_HERE") missingVars.push("RAKUTEN_CLIENT_ID");
  if (!clientSecret || clientSecret === "YOUR_CLIENT_SECRET_HERE") missingVars.push("RAKUTEN_CLIENT_SECRET");
  if (!refreshToken || refreshToken === "YOUR_REFRESH_TOKEN_HERE") missingVars.push("RAKUTEN_REFRESH_TOKEN");
  if (!accountId || accountId === "YOUR_ACCOUNT_ID_HERE") missingVars.push("RAKUTEN_ACCOUNT_ID");

  if (missingVars.length > 0) {
    return { error: `The following Rakuten credentials are not configured on the server: ${missingVars.join(', ')}. Please add them to your .env.local file or App Hosting secrets.` };
  }

  // Base64 encode the client_id:client_secret to create the token-key
  const tokenKey = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const tokenResponse = await fetch('https://api.linksynergy.com/token', {
      method: 'POST',
      headers: { 
        'Authorization': `Basic ${tokenKey}`,
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken!,
        scope: accountId!,
      }),
      cache: 'no-store'
    });

    const responseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
        const fullErrorLog = `Rakuten token refresh failed. Status: ${tokenResponse.status}. Response: ${responseText}`;
        console.error(fullErrorLog); // Log the full error on the server for debugging.
        
        let userFacingError;
        try {
            const errorData = JSON.parse(responseText);
            userFacingError = errorData.error_description || errorData.error || errorData.message || 'Invalid client authentication';
        } catch (e) {
            userFacingError = `API returned a non-JSON error response. Status: ${tokenResponse.status}`;
        }
        return { error: `Failed to refresh access token: ${userFacingError}` };
    }

    try {
        const tokenData = JSON.parse(responseText);
        if (tokenData.error) {
            const errorDesc = tokenData.error_description || tokenData.error;
            return { error: `Rakuten token API returned an error: ${errorDesc}` };
        }
        if (!tokenData.access_token) {
            return { error: `Failed to retrieve access token from Rakuten API. The response did not contain an access_token. Response: ${responseText}` };
        }
        return { access_token: tokenData.access_token };
    } catch (e) {
        return { error: `Failed to parse a successful token response. Response was: ${responseText}` };
    }
  } catch (err: any) {
    console.error(`An unexpected network error occurred during token refresh:`, err);
    return { error: `An unexpected network error occurred during token refresh: ${err.message}` };
  }
}

async function getMerchByID(advertiserId: number, accessToken: string): Promise<{ data?: any, error?: string }> {
    try {
        const merchResponse = await fetch(`https://api.linksynergy.com/linklocator/1.0/getMerchByID/${advertiserId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/xml' },
            cache: 'no-store'
        });

        const merchXml = await merchResponse.text();
        if (!merchResponse.ok) {
            console.error(`Failed to fetch merch info for advertiser ${advertiserId}: ${merchXml}`);
            return { error: `Failed to fetch merch info for advertiser ${advertiserId}` };
        }

        const parsed = await parseStringPromise(merchXml, {
            ...xmlParserOptions,
            explicitArray: true, // Force arrays for predictable structure
            charkey: "_",
            attrkey: "$",
            tagNameProcessors: [name => name.replace(/^ns\d+:/, '')]
        });
        
        const returnData = parsed?.getMerchByIDResponse?.return;
        
        if (!returnData || returnData.length === 0) {
             console.error(`Could not parse merch info for advertiser ${advertiserId}. Raw XML:`, merchXml);
            return { error: `Could not parse merch info for ${advertiserId}. Check server logs for details.` };
        }

        // Since explicitArray is true, returnData is always an array
        const merchDataRaw = returnData[0];
        
        // Manual normalization to the structure our app expects
        const merchData: any = {
            mid: merchDataRaw.mid?.[0]?._,
            name: merchDataRaw.name?.[0]?._,
            applicationStatus: merchDataRaw.applicationStatus?.[0]?._,
            categories: merchDataRaw.categories?.[0]?._,
        };

        if (merchDataRaw.offer && merchDataRaw.offer.length > 0) {
            merchData.offer = merchDataRaw.offer.map((o: any) => ({
                alsoName: o.alsoName?.[0]?._,
                commissionTerms: o.commissionTerms?.[0]?._,
                offerId: o.offerId?.[0]?._,
                offerName: o.offerName?.[0]?._,
            }));
        } else {
            merchData.offer = [];
        }

        return { data: merchData };
    } catch (err: any) {
        console.error(`Exception fetching merch info for ${advertiserId}:`, err);
        return { error: `Exception fetching merch info for ${advertiserId}: ${err.message}` };
    }
}


export async function searchPartnerships(values: Record<string, any>): Promise<SearchResult> {

  const tokenResult = await getAccessToken();
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }
  const accessToken = tokenResult.access_token;


  try {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.append(key, String(value));
      }
    });

    const partnershipResponse = await fetch(`https://api.linksynergy.com/v1/partnerships?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!partnershipResponse.ok) {
      const errorData = await partnershipResponse.json().catch(() => ({ message: `API request failed with status ${partnershipResponse.status}` }));
      const errorMessage = errorData.error?.message || errorData.message || `An unknown API error occurred. Status: ${partnershipResponse.status}`;
      return { error: `Partnership search failed: ${errorMessage}` };
    }

    const partnershipData: { _metadata: any, partnerships: Partnership[] } = await partnershipResponse.json();
    
    if (partnershipData.partnerships.length === 0) {
      return { ...partnershipData, advertisers: [] };
    }

    const advertiserIds = partnershipData.partnerships.map(p => p.advertiser.id);
    const uniqueAdvertiserIds = [...new Set(advertiserIds)];
    const firstMerchRequestUrl = uniqueAdvertiserIds.length > 0 ? `https://api.linksynergy.com/linklocator/1.0/getMerchByID/${uniqueAdvertiserIds[0]}` : undefined;
    
    const advertiserPromises = uniqueAdvertiserIds.map(id =>
      fetch(`https://api.linksynergy.com/v2/advertisers/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        cache: 'no-store'
      }).then(res => {
        if (!res.ok) {
          console.error(`Failed to fetch advertiser ${id}: ${res.status}`);
          return null;
        }
        return res.json();
      }).catch(err => {
        console.error(`Error fetching advertiser ${id}:`, err);
        return null;
      })
    );

    const merchPromises = uniqueAdvertiserIds.map(id => getMerchByID(id, accessToken!));
      
    const advertiserResults = await Promise.all(advertiserPromises);
    const merchResults = await Promise.all(merchPromises);

    const merchDetailsMap = new Map<number, any>();
    merchResults.forEach(result => {
        if (result && result.data && result.data.mid) {
            merchDetailsMap.set(result.data.mid, result.data);
        }
    });

    partnershipData.partnerships.forEach((p: Partnership) => {
        const merchInfo = merchDetailsMap.get(p.advertiser.id);
        if (merchInfo && merchInfo.offer) {
          const offerArray = Array.isArray(merchInfo.offer) ? merchInfo.offer : [merchInfo.offer];
          if (offerArray.length > 0) {
              const offer = offerArray[0];
              if (offer) {
                  p.offerDetails = {
                      commissionTerms: offer.commissionTerms,
                      offerId: offer.offerId,
                      offerName: offer.offerName,
                  };
              }
          }
        }
    });

    const categoriesMap = new Map<number, Set<string>>();
    partnershipData.partnerships.forEach(p => {
        if (!categoriesMap.has(p.advertiser.id)) {
            categoriesMap.set(p.advertiser.id, new Set());
        }
        const cats = categoriesMap.get(p.advertiser.id)!;
        p.advertiser.categories.forEach(cat => cats.add(cat));
    });

    const advertisers: AdvertiserDetails[] = advertiserResults
      .filter((result): result is SingleAdvertiserApiResponse => result !== null && !!result.advertiser)
      .map(result => {
        const advertiser = result.advertiser;
        const categories = categoriesMap.has(advertiser.id) ? Array.from(categoriesMap.get(advertiser.id)!) : [];
        return {
          ...advertiser,
          categories,
        };
      });

    const data: RakutenApiResponse = {
      ...partnershipData,
      advertisers: advertisers,
      merchRequestUrl: firstMerchRequestUrl,
    };

    return data;

  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred during the API call." };
  }
}

export async function searchCoupons(values: Record<string, any>): Promise<CouponSearchResult> {
  const tokenResult = await getAccessToken();
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }
  const accessToken = tokenResult.access_token;

  try {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.append(key, String(value));
      }
    });

    const couponApiUrl = new URL('https://api.linksynergy.com/coupon/1.0');
    couponApiUrl.search = params.toString();

    const couponResponse = await fetch(couponApiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/xml'
      },
      cache: 'no-store'
    });

    const couponXml = await couponResponse.text();

    if (!couponResponse.ok) {
      console.error(`Coupon API request failed with status ${couponResponse.status}: ${couponXml}`);
      return { error: `Coupon search failed with status ${couponResponse.status}. Check server logs for response.` };
    }
    
    if (!couponXml) {
      return { error: "Coupon search returned an empty response from the API." };
    }

    let couponData;

    try {
        couponData = await parseStringPromise(couponXml, xmlParserOptions);
    } catch (parseError) {
      console.error("Failed to parse coupon data. Response was:", couponXml);
      return { error: "Failed to parse coupon data. The API returned an invalid response that was not valid XML." };
    }

    if (couponData && couponData.couponfeed) {
        const links = couponData.couponfeed.link;
        const linkArray = links ? (Array.isArray(links) ? links : [links]) : [];

        couponData.couponfeed.TotalMatches = parseInt(couponData.couponfeed.TotalMatches);
        couponData.couponfeed.TotalPages = parseInt(couponData.couponfeed.TotalPages);
        couponData.couponfeed.PageNumberRequested = parseInt(couponData.couponfeed.PageNumberRequested);

        couponData.couponfeed.link = linkArray.map((c: any) => ({
          ...c,
          advertiserid: parseInt(c.advertiserid)
        }));

        return couponData as CouponApiResponse;
    } else {
        console.error("Unexpected coupon response structure. Raw XML:", couponXml, "Parsed object:", couponData);

        const errorDetails = couponData?.result?.error || couponData?.error;
        let errorMessage;
        if (typeof errorDetails === 'string') {
            errorMessage = errorDetails;
        } else if (errorDetails && typeof errorDetails.message === 'string') {
            errorMessage = errorDetails.message;
        } else if (couponData?.faultstring) { 
            errorMessage = couponData.faultstring;
        }
        else {
           errorMessage = "The API response was missing the expected 'couponfeed' object.";
        }

        return { error: `Coupon search failed: ${errorMessage}` };
    }

  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred during the coupon search." };
  }
}

async function fetchCouponsForMids(mids: string[], accessToken: string): Promise<Map<number, Coupon[]>> {
    const couponMap = new Map<number, Coupon[]>();
    if (mids.length === 0) return couponMap;

    try {
        const params = new URLSearchParams({ mid: mids.join('|') });
        const couponApiUrl = new URL('https://api.linksynergy.com/coupon/1.0');
        couponApiUrl.search = params.toString();

        const couponResponse = await fetch(couponApiUrl.toString(), {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/xml' },
            cache: 'no-store'
        });

        const couponXml = await couponResponse.text();
        if (!couponResponse.ok || !couponXml) {
            console.error(`Failed to fetch coupons for MIDs: ${mids.join(',')}`);
            return couponMap;
        }
        
        const couponData = await parseStringPromise(couponXml, xmlParserOptions);

        if (couponData?.couponfeed?.link) {
            const links = Array.isArray(couponData.couponfeed.link) ? couponData.couponfeed.link : [couponData.couponfeed.link];
            links.forEach((coupon: any) => {
                const mid = parseInt(coupon.advertiserid);
                if (!couponMap.has(mid)) {
                    couponMap.set(mid, []);
                }
                couponMap.get(mid)!.push(coupon as Coupon);
            });
        }
    } catch (err) {
        console.error("Error fetching coupons for MIDs:", err);
    }

    return couponMap;
}


async function fetchAdvertiserDetailsForMids(mids: string[], accessToken: string): Promise<Map<number, AdvertiserDetails>> {
    const advertiserMap = new Map<number, AdvertiserDetails>();
    if (mids.length === 0) return advertiserMap;

    const advertiserPromises = mids.map(id =>
        fetch(`https://api.linksynergy.com/v2/advertisers/${id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
            cache: 'no-store'
        }).then(res => {
            if (!res.ok) {
                console.error(`Failed to fetch advertiser ${id}: ${res.status}`);
                return null;
            }
            return res.json();
        }).catch(err => {
            console.error(`Error fetching advertiser ${id}:`, err);
            return null;
        })
    );
    
    const advertiserResults = await Promise.all(advertiserPromises);

    advertiserResults
        .filter((result): result is SingleAdvertiserApiResponse => result !== null && !!result.advertiser)
        .forEach(result => {
            advertiserMap.set(result.advertiser.id, result.advertiser);
        });

    return advertiserMap;
}

export async function searchProducts(values: Record<string, any>): Promise<ProductSearchResult> {
  const tokenResult = await getAccessToken();
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }
  const accessToken = tokenResult.access_token;

  try {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        const finalKey = key === 'sort' ? 'sortby' : key;
        params.append(finalKey, String(value));
      }
    });

    const productApiUrl = new URL('https://api.linksynergy.com/productsearch/1.0');
    productApiUrl.search = params.toString();

    const productResponse = await fetch(productApiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/xml'
      },
      cache: 'no-store'
    });

    const productXml = await productResponse.text();

    if (!productResponse.ok) {
      console.error(`Product API request failed with status ${productResponse.status}: ${productXml}`);
      return { error: `Product search failed with status ${productResponse.status}. Check server logs for response.` };
    }
    
    if (!productXml) {
      return { error: "Product search returned an empty response from the API." };
    }

    let productData;

    try {
      productData = await parseStringPromise(productXml, xmlParserOptions);
    } catch (parseError: any) {
      console.error("Failed to parse product data. Response was:", productXml);
      return { error: `Failed to parse product data. The API returned an invalid response that was not valid XML. ${parseError.message}` };
    }

    const responseRoot = productData?.productSearchResponse || productData?.result;

    if (responseRoot) {
        const items = responseRoot.item;
        const itemArray: Product[] = items ? (Array.isArray(items) ? items : [items]) : [];
        
        const transformedItems = itemArray.map((p: any) => ({
          ...p,
          mid: parseInt(p.mid),
          price: {
            '@_currency': p.price?.['@_']?.currency,
            '#text': p.price?.['#text'] ? parseFloat(p.price['#text']) : undefined
          },
          saleprice: {
            '@_currency': p.saleprice?.['@_']?.currency,
            '#text': p.saleprice?.['#text'] ? parseFloat(p.saleprice['#text']) : undefined
          },
        }));

        if (transformedItems.length > 0) {
            const uniqueMids = [...new Set(transformedItems.map(p => p.mid.toString()))];
            
            const [couponMap, advertiserDetailsMap] = await Promise.all([
                fetchCouponsForMids(uniqueMids, accessToken!),
                fetchAdvertiserDetailsForMids(uniqueMids, accessToken!)
            ]);

            transformedItems.forEach(p => {
                if (couponMap.has(p.mid)) {
                    p.availableCoupons = couponMap.get(p.mid);
                }
                const details = advertiserDetailsMap.get(p.mid);
                if (details) {
                    p.advertiserUrl = details.url;
                }
            });
        }

        const normalizedResponse: ProductSearchApiResponse = {
          productSearchResponse: {
            TotalMatches: parseInt(responseRoot.TotalMatches),
            TotalPages: parseInt(responseRoot.TotalPages),
            PageNumber: parseInt(responseRoot.PageNumber),
            item: transformedItems,
            error: responseRoot.error
          }
        };

        if (normalizedResponse.productSearchResponse.error) {
           return { error: `Product search failed: ${normalizedResponse.productSearchResponse.error}` };
        }
        
        return normalizedResponse;
    } else {
        console.error("Unexpected product response structure. Raw XML:", productXml, "Parsed object:", productData);

        const errorDetails = productData?.result?.error || productData?.error || productData?.fault?.faultstring;
        let errorMessage;
        if (typeof errorDetails === 'string') {
            errorMessage = errorDetails;
        } else if (errorDetails && typeof errorDetails.message === 'string') {
            errorMessage = errorDetails.message;
        } else if (productData?.faultstring) { 
            errorMessage = productData.faultstring;
        } else {
           errorMessage = "The API response was missing the expected 'productSearchResponse' or 'result' object.";
        }
        return { error: `Product search failed: ${errorMessage}` };
    }

  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred during the product search." };
  }
}

export async function searchLinks(
  values: Record<string, any>,
  linkType: 'text' | 'banner' | 'rich-media'
): Promise<LinkSearchResult> {
  const tokenResult = await getAccessToken();
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }
  const accessToken = tokenResult.access_token;

  try {
    const { advertiser_id, category_id, link_start_date, link_end_date, campaign_id, page, banner_size_code } = values;

    const final_advertiser_id = advertiser_id || '-1';
    const final_category_id = category_id || '-1';
    const final_campaign_id = campaign_id || '-1';
    const final_page = String(page) || '1';
    
    let command: string;
    let params: string[];
    
    switch (linkType) {
      case 'text':
        command = 'getTextLinks';
        params = [
            final_advertiser_id,
            final_category_id,
            link_start_date || '',
            link_end_date || '',
            final_campaign_id,
            final_page
        ];
        break;
      case 'banner':
         const final_banner_size_code = banner_size_code || '-1';
        command = 'getBannerLinks';
        params = [
            final_advertiser_id,
            final_category_id,
            link_start_date || '',
            link_end_date || '',
            final_banner_size_code,
            final_campaign_id,
            final_page
        ];
        break;
      case 'rich-media':
        command = 'getDRMLinks';
        params = [
            final_advertiser_id,
            final_category_id,
            link_start_date || '',
            link_end_date || '',
            final_campaign_id,
            final_page
        ];
        break;
    }
    
    const params_string = params.join('/');
    const linkApiUrl = `https://api.linksynergy.com/linklocator/1.0/${command}/${params_string}`;
    
    const linkResponse = await fetch(linkApiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/xml',
      },
      cache: 'no-store',
    });

    const linkXml = await linkResponse.text();
    
    if (!linkResponse.ok) {
        if (linkXml.includes('<faultstring>')) {
          const faultRegex = /<faultstring>(.*?)<\/faultstring>/;
          const faultMatch = linkXml.match(faultRegex);
          if (faultMatch && faultMatch[1]) {
            return { error: faultMatch[1], requestUrl: linkApiUrl };
          }
        }
        return { error: `Link search failed with status ${linkResponse.status}. Check server logs for raw response.`, requestUrl: linkApiUrl };
    }
    
    if (!linkXml) {
      return { links: [], requestUrl: linkApiUrl };
    }

    try {
        const parsed = await parseStringPromise(linkXml, xmlParserOptions);

        if (parsed?.fault?.faultstring) {
            return { error: `API Error: ${parsed.fault.faultstring}`, requestUrl: linkApiUrl };
        }

        let responseBody;
        switch (linkType) {
            case 'text': responseBody = parsed.getTextLinksResponse; break;
            case 'banner': responseBody = parsed.getBannerLinksResponse; break;
            case 'rich-media': responseBody = parsed.getDRMLinksResponse; break;
        }

        if (!responseBody || !responseBody.return) {
            return { links: [], requestUrl: linkApiUrl };
        }
        
        const linksArray = Array.isArray(responseBody.return) ? responseBody.return : [responseBody.return];

        const links: LinkItem[] = linksArray.map((item: any) => ({
            campaignID: item.campaignID ? parseInt(item.campaignID) : undefined,
            categoryID: item.categoryID ? parseInt(item.categoryID) : undefined,
            categoryName: item.categoryName,
            linkID: parseInt(item.linkID),
            linkName: item.linkName,
            mid: parseInt(item.mid),
            nid: item.nid ? parseInt(item.nid) : undefined,
            code: item.code,
            clickURL: item.clickURL,
            textDisplay: item.textDisplay,
            endDate: item.endDate,
            height: item.height ? parseInt(item.height) : undefined,
            width: item.width ? parseInt(item.width) : undefined,
            serverType: item.serverType ? parseInt(item.serverType) : undefined,
            showURL: item.showURL,
            imgURL: item.imgURL,
            size: item.size,
            startDate: item.startDate,
        }));
        
        return { links, requestUrl: linkApiUrl };

    } catch (err: any) {
        console.error("Link parsing failed with an exception using xml2js:", err);
        return { error: err.message || "An unexpected error occurred during link parsing.", requestUrl: linkApiUrl };
    }

  } catch (err: any) {
    console.error("Link search failed with an exception:", err);
    return { error: err.message || "An unexpected error occurred during the link search." };
  }
}

export async function getMerchantsByCategory(
  categoryId: string
): Promise<MerchByCategoryResult> {
  const tokenResult = await getAccessToken();
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }
  const accessToken = tokenResult.access_token;

  if (!categoryId) {
    return { error: "Category ID is required." };
  }

  try {
    const apiUrl = `https://api.linksynergy.com/linklocator/1.0/getMerchByCategory/${categoryId}`;
    
    const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/xml' },
        cache: 'no-store'
    });

    const xmlText = await response.text();

    if (!response.ok) {
        if (xmlText.includes('<faultstring>')) {
          const faultRegex = /<faultstring>(.*?)<\/faultstring>/;
          const faultMatch = xmlText.match(faultRegex);
          if (faultMatch && faultMatch[1]) {
            return { error: faultMatch[1] };
          }
        }
        return { error: `API request failed with status ${response.status}. Response: ${xmlText}` };
    }
    
    if (!xmlText) {
        return { merchants: [] };
    }

    const parsed = await parseStringPromise(xmlText, xmlParserOptions);
    
    if (parsed?.fault?.faultstring) {
        return { error: `API Error: ${parsed.fault.faultstring}` };
    }

    let responseBody = parsed.getMerchByCategoryResponse;

    if (!responseBody || !responseBody.return) {
        return { merchants: [] };
    }
    
    const merchantsArray = Array.isArray(responseBody.return) ? responseBody.return : [responseBody.return];

    const merchants: MerchDetails[] = merchantsArray.map((item: any) => {
        // Ensure 'offer' is always an array
        if (item.offer && !Array.isArray(item.offer)) {
            item.offer = [item.offer];
        }
        return item;
    });
    
    return { merchants };

  } catch (err: any) {
      return { error: `An unexpected error occurred: ${err.message}` };
  }
}

export async function getMerchInfoForTest(advertiserId: string): Promise<MerchInfoResult> {
  const tokenResult = await getAccessToken();
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }
  const accessToken = tokenResult.access_token;

  if (!advertiserId) {
    return { error: "Advertiser ID is required." };
  }

  try {
    const apiUrl = `https://api.linksynergy.com/linklocator/1.0/getMerchByID/${advertiserId}`;
    
    const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/xml' },
        cache: 'no-store'
    });

    const xmlText = await response.text();

    if (!response.ok) {
        if (xmlText.includes('<faultstring>')) {
          const faultRegex = /<faultstring>(.*?)<\/faultstring>/;
          const faultMatch = xmlText.match(faultRegex);
          if (faultMatch && faultMatch[1]) {
            return { error: faultMatch[1] };
          }
        }
        return { error: `API request failed with status ${response.status}. Response: ${xmlText}` };
    }
    
    if (!xmlText) {
        return { error: "API returned an empty response." };
    }

    const parsed = await parseStringPromise(xmlText, xmlParserOptions);
    
    if (parsed?.fault?.faultstring) {
        return { error: `API Error: ${parsed.fault.faultstring}` };
    }
    
    const returnData = parsed?.getMerchByIDResponse?.return;
    if (!returnData) {
      return { error: "Could not find 'return' object in the response." };
    }

    const returnArray = Array.isArray(returnData) ? returnData : [returnData];

    if (returnArray.length === 0) {
        return { error: "Could not find 'return' object in the response." };
    }
    const merchData = returnArray[0];

    // Ensure 'offer' is always an array for consistent processing
    if (merchData.offer && !Array.isArray(merchData.offer)) {
        merchData.offer = [merchData.offer];
    }
    
    if (!merchData) {
      return { error: "Could not parse merch info from the response." };
    }

    return { data: merchData };
  } catch (err: any) {
      return { error: `An unexpected error occurred: ${err.message}` };
  }
}

export async function getBrandPageData(advertiserId: number, page: number = 1): Promise<BrandPageResult> {
  const tokenResult = await getAccessToken();
  if (tokenResult.error) {
    return { error: tokenResult.error };
  }
  const accessToken = tokenResult.access_token;

  if (!advertiserId) {
    return { error: "Advertiser ID is required." };
  }

  try {
    const [advertiserResult, productsResult, couponsResult] = await Promise.all([
      fetch(`https://api.linksynergy.com/v2/advertisers/${advertiserId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
        cache: 'no-store'
      }),
      searchProducts({ mid: advertiserId.toString(), max: 100, pagenumber: page }),
      searchCoupons({ mid: advertiserId.toString() }),
    ]);

    // Process Advertiser Details
    let advertiserDetails: AdvertiserDetails | null = null;
    if (advertiserResult.ok) {
        const advertiserData: SingleAdvertiserApiResponse = await advertiserResult.json();
        advertiserDetails = advertiserData.advertiser;
    } else {
        console.error(`Failed to fetch advertiser details for ${advertiserId}`);
    }

    // Process Products
    const productData: ProductSearchResponseData = (!('error' in productsResult) && productsResult.productSearchResponse)
        ? productsResult.productSearchResponse
        : { TotalMatches: 0, TotalPages: 0, PageNumber: 1, item: [] };
    if ('error' in productsResult) {
        console.error(`Error fetching products for ${advertiserId}: ${productsResult.error}`);
    }


    // Process Coupons
    const coupons: Coupon[] = (!('error' in couponsResult) && couponsResult.couponfeed?.link)
        ? couponsResult.couponfeed.link
        : [];
     if ('error' in couponsResult) {
        console.error(`Error fetching coupons for ${advertiserId}: ${couponsResult.error}`);
    }

    return {
      advertiserDetails,
      productData,
      coupons,
    };

  } catch (err: any) {
    console.error(`An unexpected error occurred in getBrandPageData for MID ${advertiserId}:`, err);
    return { error: err.message || "An unexpected error occurred while fetching brand data." };
  }
}

export async function searchAllProducts(values: Record<string, any>): Promise<ProductInsightResult> {
  const allProducts: Product[] = [];
  let currentPage = 1;
  const maxPages = 10; // To avoid infinite loops and high costs
  let totalMatches = 0;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    const pageValues = { ...values, pagenumber: currentPage, max: 100 };
    const result: ProductSearchResult = await searchProducts(pageValues);

    if ('error' in result) {
      if (currentPage > 1) {
        // If we already have some results, return them. The error might be for a later page.
        break;
      }
      return { error: result.error, products: [], totalMatches: 0 };
    }

    const response = result.productSearchResponse;
    if (response?.item) {
      allProducts.push(...response.item);
    }
    
    if (currentPage === 1 && response.TotalMatches) {
        totalMatches = response.TotalMatches;
    }

    if (!response.TotalPages || response.PageNumber >= response.TotalPages) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  return { products: allProducts, totalMatches };
}

export async function getProductByLinkId(linkid: string): Promise<{ product?: Product, error?: string }> {
    // Product Search API does not have a direct linkid lookup.
    // We use 'keyword' search, which can be fuzzy. We fetch a few results and find the exact match.
    const result = await searchProducts({ keyword: linkid, max: 10 });
    
    if ('error' in result) {
        return { error: `API error while searching for product with linkid ${linkid}: ${result.error}` };
    }
    
    const product = result.productSearchResponse?.item?.find(p => p.linkid === linkid);
    
    if (product) {
        return { product };
    }
    
    return { error: `Product with linkid ${linkid} not found after searching.` };
}

export async function getMoreProductsFromMerchant(
  mid: number,
  currentProductId: string
): Promise<MoreProductsResult> {
  const result = await searchProducts({ mid: mid.toString(), max: 5 });

  if ('error' in result) {
    console.error(`Error fetching more products for merchant ${mid}: ${result.error}`);
    return { error: result.error };
  }

  const allProducts = result.productSearchResponse?.item || [];
  const moreProducts = allProducts.filter(p => p.linkid !== currentProductId).slice(0, 4);

  return { products: moreProducts };
}
