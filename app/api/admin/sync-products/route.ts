import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const APPARELMAGIC_API_TOKEN = process.env.APPARELMAGIC_API_KEY || '';
const BASE_URL = 'https://advanceapparels.app.apparelmagic.com/api/json';

function getAuthParams() {
  const time = Math.floor(Date.now() / 1000).toString();
  return { time, token: APPARELMAGIC_API_TOKEN };
}

async function fetchAllProducts() {
  let allProducts: any[] = [];
  let lastId: string | null = null;
  let pageCount = 0;
  const maxPages = 10;

  console.log('Starting to fetch ALL products from ApparelMagic...');

  while (pageCount < maxPages) {
    const auth = getAuthParams();
    const params = new URLSearchParams({
      time: auth.time,
      token: auth.token
    });

    params.append('pagination[page_size]', '1000');
    if (lastId) {
      params.append('pagination[last_id]', lastId);
    }

    const url = `${BASE_URL}/products?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'TradeShowPortal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response && Array.isArray(data.response)) {
      allProducts = allProducts.concat(data.response);
      console.log(`  Page ${pageCount + 1}: Fetched ${data.response.length} products (Total so far: ${allProducts.length})`);
    }

    if (data.meta?.pagination?.last_id) {
      lastId = String(data.meta.pagination.last_id);
      pageCount++;
    } else {
      console.log(`Finished! No more pages. Total products: ${allProducts.length}`);
      break;
    }
  }

  if (pageCount >= maxPages) {
    console.log(`Stopped at ${maxPages} pages. Total products: ${allProducts.length}`);
  }

  return allProducts;
}

async function fetchProductSKUs(productId: string) {
  const auth = getAuthParams();
  const url = `${BASE_URL}/products/${productId}/skus?time=${auth.time}&token=${auth.token}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'TradeShowPortal/1.0'
    }
  });

  if (!response.ok) {
    console.error(`Failed to fetch SKUs for product ${productId}`);
    return [];
  }

  const data = await response.json();
  return data.response || [];
}

// NEW: Fetch colorway-level images from product_attributes endpoint
async function fetchColorwayImages(productId: string): Promise<{ img: string }[]> {
  const auth = getAuthParams();
  const url = `${BASE_URL}/product_attributes?product_id=${productId}&time=${auth.time}&token=${auth.token}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'TradeShowPortal/1.0'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch colorway images for product ${productId}`);
      return [];
    }

    const data = await response.json();
    const colorways = data.response || [];
    
    // Collect all images from all colorways
    const allImages: { img: string }[] = [];
    
    for (const colorway of colorways) {
      if (colorway.images && Array.isArray(colorway.images)) {
        for (const image of colorway.images) {
          if (image.img) {
            allImages.push({ img: image.img });
          }
        }
      }
    }
    
    return allImages;
  } catch (error) {
    console.error(`Error fetching colorway images for product ${productId}:`, error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting product sync...');

    const startTime = Date.now();

    // Fetch all products from ApparelMagic
    console.log('📥 Fetching products from ApparelMagic...');
    const products = await fetchAllProducts();
    console.log(`✅ Fetched ${products.length} products`);

    let syncedProducts = 0;
    let syncedImages = 0;
    let syncedSKUs = 0;
    let errors = 0;

    // Process products one by one
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // Insert/update product
        const { error: productError } = await supabase
          .from('products')
          .upsert({
            product_id: product.product_id,
            style_number: product.style_number,
            description: product.description || null,
            category: product.category || null,
            price: parseFloat(product.price) || 0,
            content: product.content || null,
            origin: product.origin || null,
            last_synced_at: new Date().toISOString()
          });

        if (productError) {
          console.error(`Error syncing product ${product.product_id}:`, productError);
          errors++;
          continue;
        }

        syncedProducts++;

        // Delete old images for this product
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', product.product_id);

        // Collect all images: product-level + colorway-level
        const allImages: { img: string }[] = [];
        
        // 1. Add product-level images
        if (product.images && product.images.length > 0) {
          for (const img of product.images) {
            if (img.img) {
              allImages.push({ img: img.img });
            }
          }
        }
        
        // 2. Fetch and add colorway-level images
        const colorwayImages = await fetchColorwayImages(product.product_id);
        for (const img of colorwayImages) {
          // Avoid duplicates
          if (!allImages.some(existing => existing.img === img.img)) {
            allImages.push(img);
          }
        }

        // Insert all images (up to 25)
        if (allImages.length > 0) {
          const imagesToInsert = allImages
            .slice(0, 25)
            .map((img, index) => ({
              product_id: product.product_id,
              image_url: img.img,
              sort_order: index
            }));

          const { error: imagesError } = await supabase
            .from('product_images')
            .insert(imagesToInsert);

          if (!imagesError) {
            syncedImages += imagesToInsert.length;
          } else {
            console.error(`Error inserting images for ${product.product_id}:`, imagesError);
          }
        }

        // Fetch and insert SKUs
        const skus = await fetchProductSKUs(product.product_id);

        if (skus.length > 0) {
          // Delete old SKUs
          await supabase
            .from('product_skus')
            .delete()
            .eq('product_id', product.product_id);

          // Insert new SKUs
          const skusToInsert = skus.map((sku: any) => ({
            sku_id: sku.sku_id,
            product_id: product.product_id,
            style_number: product.style_number,
            attr_2: sku.attr_2 || null,
            size: sku.size || null,
            price: parseFloat(sku.price) || 0,
            qty_avail_sell: parseInt(sku.qty_avail_sell) || 0,
            last_synced_at: new Date().toISOString()
          }));

          const { error: skusError } = await supabase
            .from('product_skus')
            .insert(skusToInsert);

          if (!skusError) {
            syncedSKUs += skusToInsert.length;
          } else {
            console.error(`Error inserting SKUs for ${product.product_id}:`, skusError);
          }
        }

        // Log progress every 100 products
        if ((i + 1) % 100 === 0) {
          const progress = Math.round(((i + 1) / products.length) * 100);
          console.log(`Progress: ${i + 1}/${products.length} (${progress}%) - Products: ${syncedProducts}, Images: ${syncedImages}, SKUs: ${syncedSKUs}`);
        }

      } catch (error) {
        console.error(`Error processing product ${product.product_id}:`, error);
        errors++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Sync complete!');
    console.log(`Products: ${syncedProducts}`);
    console.log(`Images: ${syncedImages}`);
    console.log(`SKUs: ${syncedSKUs}`);
    console.log(`Errors: ${errors}`);
    console.log(`Duration: ${duration}s`);

    return NextResponse.json({
      success: true,
      stats: {
        products: syncedProducts,
        images: syncedImages,
        skus: syncedSKUs,
        errors: errors,
        duration: `${duration}s`
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}