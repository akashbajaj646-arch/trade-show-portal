import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProducts, getProductSKUs } from '@/lib/apparelmagic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting product sync...');
    
    const startTime = Date.now();
    
    // Fetch all products using the existing working library
    console.log('📥 Fetching products from ApparelMagic...');
    const products = await getProducts();
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
        
        // Insert new images (up to 25)
        if (product.images && product.images.length > 0) {
          const imagesToInsert = product.images
            .slice(0, 25)
            .map((img: any, index: number) => ({
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
        
        // Fetch and insert SKUs using the existing working library
        const skus = await getProductSKUs(product.product_id);
        
        if (skus.length > 0) {
          // Delete old SKUs for this product
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
        
        // Log progress every 50 products
        if ((i + 1) % 50 === 0) {
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
