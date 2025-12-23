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

export interface Customer {
  customer_id: string;
  customer_name: string;
  account_number?: string;
  email?: string;
  phone?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  credit_limit?: string;
  status?: string;
  category?: string;
  terms_id?: string;
  division_id?: string;
  price_group?: string;
  notes?: string;
  is_active?: string;
}

export interface Location {
  ship_to_id: string;
  customer_id: string;
  vendor_id?: string;
  name: string;  // Location name/label
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  store_number?: string;
  dc_reference?: string;
  department_number?: string;
  tax_rate?: string;
  is_main_location?: string;
  edi_reference?: string;
}

function getAuthParams() {
  const time = Math.floor(Date.now() / 1000).toString();
  return {
    time,
    token: APPARELMAGIC_API_TOKEN
  };
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

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

// ============================================
// CUSTOMER FUNCTIONS
// ============================================

export async function getCustomers(): Promise<Customer[]> {
  try {
    let allCustomers: Customer[] = [];
    let lastId: string | null = null;
    let pageCount = 0;
    const maxPages = 20; // Safety limit - 20 pages x 1000 = up to 20,000 customers
    
    console.log('Starting to fetch ALL customers from ApparelMagic...');
    
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
      
      const url = `${BASE_URL}/customers?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'TradeShowPortal/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response && Array.isArray(data.response) && data.response.length > 0) {
        allCustomers = allCustomers.concat(data.response);
        console.log(`  Page ${pageCount + 1}: Fetched ${data.response.length} customers (Total so far: ${allCustomers.length})`);
      } else {
        console.log('No more customers found');
        break;
      }
      
      // Check for next page using last_id
      if (data.meta?.pagination?.last_id) {
        lastId = String(data.meta.pagination.last_id);
        pageCount++;
      } else {
        console.log(`Finished! No more pages. Total customers: ${allCustomers.length}`);
        break;
      }
    }
    
    if (pageCount >= maxPages) {
      console.log(`Stopped at ${maxPages} pages. Total customers: ${allCustomers.length}`);
    }
    
    return allCustomers;
    
  } catch (error) {
    console.error('Error fetching customers from ApparelMagic:', error);
    throw error;
  }
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const auth = getAuthParams();
    const params = new URLSearchParams(auth);
    
    const response = await fetch(`${BASE_URL}/customers/${customerId}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'TradeShowPortal/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.response && Array.isArray(data.response) && data.response.length > 0) {
      return data.response[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching customer ${customerId}:`, error);
    return null;
  }
}

export async function createCustomer(customerData: Partial<Customer>): Promise<Customer | null> {
  try {
    const auth = getAuthParams();
    
    const requestBody = {
      time: auth.time,
      token: auth.token,
      customer_name: customerData.customer_name,
      email: customerData.email || '',
      phone: customerData.phone || '',
      address_1: customerData.address_1 || '',
      address_2: customerData.address_2 || '',
      city: customerData.city || '',
      state: customerData.state || '',
      postal_code: customerData.postal_code || '',
      country: customerData.country || 'USA'
    };
    
    const response = await fetch(`${BASE_URL}/customers/`, {
      method: 'POST',
      headers: {
        'User-Agent': 'TradeShowPortal/1.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create customer error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Customer created in ApparelMagic:', data);
    
    if (data.response && Array.isArray(data.response) && data.response.length > 0) {
      return data.response[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error creating customer in ApparelMagic:', error);
    throw error;
  }
}

// ============================================
// LOCATION FUNCTIONS
// ============================================

export async function getLocations(): Promise<Location[]> {
  try {
    let allLocations: Location[] = [];
    let lastId: string | null = null;
    let pageCount = 0;
    const maxPages = 30; // Safety limit - locations can be numerous
    
    console.log('Starting to fetch ALL locations from ApparelMagic...');
    
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
      
      const url = `${BASE_URL}/locations?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'TradeShowPortal/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.response && Array.isArray(data.response) && data.response.length > 0) {
        allLocations = allLocations.concat(data.response);
        console.log(`  Page ${pageCount + 1}: Fetched ${data.response.length} locations (Total so far: ${allLocations.length})`);
      } else {
        console.log('No more locations found');
        break;
      }
      
      // Check for next page using last_id
      if (data.meta?.pagination?.last_id) {
        lastId = String(data.meta.pagination.last_id);
        pageCount++;
      } else {
        console.log(`Finished! No more pages. Total locations: ${allLocations.length}`);
        break;
      }
    }
    
    if (pageCount >= maxPages) {
      console.log(`Stopped at ${maxPages} pages. Total locations: ${allLocations.length}`);
    }
    
    return allLocations;
    
  } catch (error) {
    console.error('Error fetching locations from ApparelMagic:', error);
    throw error;
  }
}

export async function getLocationsByCustomerId(customerId: string): Promise<Location[]> {
  try {
    const auth = getAuthParams();
    const params = new URLSearchParams({
      time: auth.time,
      token: auth.token
    });
    
    // Filter by customer_id
    params.append('parameters[0][field]', 'customer_id');
    params.append('parameters[0][operator]', '=');
    params.append('parameters[0][value]', customerId);
    
    const url = `${BASE_URL}/locations?${params.toString()}`;
    
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
      console.log(`Fetched ${data.response.length} locations for customer ${customerId}`);
      return data.response;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching locations for customer ${customerId}:`, error);
    return [];
  }
}
