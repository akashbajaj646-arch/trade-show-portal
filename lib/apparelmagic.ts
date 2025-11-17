const APPARELMAGIC_API_TOKEN = process.env.APPARELMAGIC_API_KEY || '';
const BASE_URL = 'https://advanceapparels.app.apparelmagic.com/api/json';

interface ApparelMagicImage {
  img: string;
}

export interface Product {
  product_id: string;
  style_number: string;
  description: string;
  price: string;
  images: ApparelMagicImage[];
  category: string;
  content?: string;
  origin?: string;
}

export interface SKU {
  sku_id: string;
  product_id: string;
  style_number: string;
  attr_2: string;
  size: string;
  price: string;
  qty_avail_sell: string;
}

function getAuthParams() {
  const time = Math.floor(Date.now() / 1000).toString();
  return {
    time,
    token: APPARELMAGIC_API_TOKEN
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    let allProducts: Product[] = [];
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
    
  } catch (error) {
    console.error('Error fetching products from ApparelMagic:', error);
    throw error;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const allProducts = await getProducts();
    const searchTerm = query.toLowerCase().trim();
    
    console.log(`Searching through ${allProducts.length} products for: "${query}"`);
    
    if (!searchTerm) {
      return allProducts;
    }
    
    const safeToLower = (str: string | null | undefined): string => {
      return (str || '').toLowerCase();
    };
    
    const exactMatches = allProducts.filter(product => 
      safeToLower(product.style_number) === searchTerm
    );
    
    const startsWithMatches = allProducts.filter(product => {
      const styleNum = safeToLower(product.style_number);
      return styleNum.startsWith(searchTerm) && styleNum !== searchTerm;
    });
    
    const containsMatches = allProducts.filter(product => {
      const styleNum = safeToLower(product.style_number);
      return styleNum.includes(searchTerm) && 
             styleNum !== searchTerm && 
             !styleNum.startsWith(searchTerm);
    });
    
    const otherMatches = allProducts.filter(product => {
      const styleNum = safeToLower(product.style_number);
      const alreadyMatched = styleNum.includes(searchTerm);
      if (alreadyMatched) return false;
      
      return (
        safeToLower(product.description).includes(searchTerm) ||
        safeToLower(product.category).includes(searchTerm)
      );
    });
    
    const results = [...exactMatches, ...startsWithMatches, ...containsMatches, ...otherMatches];
    console.log(`Found ${results.length} matches for "${query}"`);
    
    return results;
    
  } catch (error) {
    console.error('Error in searchProducts:', error);
    throw error;
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const auth = getAuthParams();
    const params = new URLSearchParams(auth);
    
    const response = await fetch(`${BASE_URL}/products/${productId}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'TradeShowPortal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.product || null;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
}

export async function getProductSKUs(productId: string): Promise<SKU[]> {
  try {
    const auth = getAuthParams();
    const params = new URLSearchParams({
      ...auth,
      product_id: productId
    });
    
    // The correct endpoint is /inventory with product_id filter
    const response = await fetch(`${BASE_URL}/inventory?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'TradeShowPortal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const skus = data.response || [];
    
    console.log(`Fetched ${skus.length} SKUs for product ${productId}`);
    
    return skus;
  } catch (error) {
    console.error(`Error fetching SKUs for product ${productId}:`, error);
    return [];
  }
}
