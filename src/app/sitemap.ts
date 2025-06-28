// COMING SOON
// import { MetadataRoute } from 'next'
// import { searchPartnerships, searchProducts } from '@/app/actions';
// import { slugify } from '@/lib/utils';
 
// export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
//   const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://offerbae.com';

//   const staticRoutes = [
//     { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
//     { url: `${siteUrl}/brands`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
//   ];

//   // Fetch brands for sitemap
//   const brandRoutes: MetadataRoute.Sitemap = [];
//   try {
//     const brandsData = await searchPartnerships({ partner_status: 'active', limit: 100 });
//     if (!('error' in brandsData)) {
//       const uniqueAdvertisers = Array.from(new Map(brandsData.advertisers.map(item => [item.id, item])).values());
//       uniqueAdvertisers.forEach(brand => {
//         brandRoutes.push({
//           url: `${siteUrl}/brand/${brand.id}-${slugify(brand.name)}`,
//           lastModified: new Date(),
//           changeFrequency: 'weekly',
//           priority: 0.6
//         });
//       });
//     }
//   } catch (e) {
//     console.error("Failed to fetch brands for sitemap", e);
//   }
  
//   // Fetch recent products for sitemap
//   const productRoutes: MetadataRoute.Sitemap = [];
//   try {
//     const productResult = await searchProducts({ max: 100 });
//      if (!('error' in productResult) && productResult.productSearchResponse?.item) {
//         productResult.productSearchResponse.item.forEach(product => {
//             productRoutes.push({
//                 url: `${siteUrl}/item/${slugify(product.merchantname)}/${slugify(product.productname)}-${product.linkid}`,
//                 lastModified: new Date(product.createdon),
//                  changeFrequency: 'weekly',
//                  priority: 0.5
//             });
//         });
//      }
//   } catch (e) {
//       console.error("Failed to fetch products for sitemap", e);
//   }


//   return [...staticRoutes, ...brandRoutes, ...productRoutes];
// }
