'use client';

import { useState } from 'react';

interface Product {
  product_id: string;
  style_number: string;
  description: string;
  price: string;
  images: Array<{ img: string }>;
  category: string;
}

interface SKU {
  sku_id: string;
  product_id: string;
  style_number: string;
  attr_2: string;
  size: string;
  price: string;
  qty_avail_sell: string;
}

interface OrderItem {
  sku: SKU;
  product: Product;
  quantity: number;
  deliveryDate: string;
  notes: string;
}

export default function CreatePortal() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tradeShowName, setTradeShowName] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSKUs, setProductSKUs] = useState<SKU[]>([]);
  const [loadingSKUs, setLoadingSKUs] = useState(false);
  
  // Matrix state
  const [matrixQuantities, setMatrixQuantities] = useState<Record<string, number>>({});
  const [matrixDeliveryDate, setMatrixDeliveryDate] = useState('');
  const [matrixNotes, setMatrixNotes] = useState('');
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [creating, setCreating] = useState(false);
  
  const [portalCreated, setPortalCreated] = useState(false);
  const [portalLink, setPortalLink] = useState('');
  
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.products);
        setTotalResults(data.total || data.products.length);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }
  
  async function browseAll() {
    setSearching(true);
    setSearchQuery('');
    try {
      const response = await fetch('/api/products/search?all=true');
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.products);
        setTotalResults(data.total || data.products.length);
      }
    } catch (error) {
      console.error('Browse error:', error);
    } finally {
      setSearching(false);
    }
  }
  
  async function selectProduct(product: Product) {
    setSelectedProduct(product);
    setLoadingSKUs(true);
    setMatrixQuantities({});
    setMatrixDeliveryDate('');
    setMatrixNotes('');
    
    try {
      const response = await fetch(`/api/products/skus?product_id=${product.product_id}`);
      const data = await response.json();
      if (data.success) {
        setProductSKUs(data.skus);
      }
    } catch (error) {
      console.error('Error loading SKUs:', error);
    } finally {
      setLoadingSKUs(false);
    }
    
    setSearchResults([]);
    setSearchQuery('');
  }
  
  function updateMatrixQuantity(key: string, value: string) {
    const qty = parseInt(value) || 0;
    setMatrixQuantities({
      ...matrixQuantities,
      [key]: qty
    });
  }
  
  function addMatrixToPortal() {
    if (!selectedProduct) return;
    
    const newItems: OrderItem[] = [];
    
    Object.keys(matrixQuantities).forEach(key => {
      const qty = matrixQuantities[key];
      if (qty > 0) {
        const sku = productSKUs.find(s => `${s.attr_2}|${s.size}` === key);
        if (sku) {
          newItems.push({
            sku,
            product: selectedProduct,
            quantity: qty,
            deliveryDate: matrixDeliveryDate,
            notes: matrixNotes
          });
        }
      }
    });
    
    if (newItems.length > 0) {
      setOrderItems([...orderItems, ...newItems]);
      closeVariantSelector();
    } else {
      alert('Please enter at least one quantity');
    }
  }
  
  function closeVariantSelector() {
    setSelectedProduct(null);
    setProductSKUs([]);
    setMatrixQuantities({});
    setMatrixDeliveryDate('');
    setMatrixNotes('');
  }
  
  function removeItem(index: number) {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }
  
  function updateItem(index: number, field: keyof OrderItem, value: any) {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  }
  
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  }
  
  function removeFile(index: number) {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  }
  
  async function createPortal() {
    if (!customerName || orderItems.length === 0) {
      alert('Please enter customer name and add at least one product variant');
      return;
    }
    
    setCreating(true);
    
    try {
      const itemsToSend = orderItems.map(item => {
        const imageUrl = item.product.images?.[0]?.img || null;
        
        return {
          product_id: item.product.product_id,
          style_number: item.product.style_number,
          attr_2: item.sku.attr_2,
          size: item.sku.size,
          price: item.sku.price,
          quantity: item.quantity,
          deliveryDate: item.deliveryDate,
          notes: item.notes,
          image_url: imageUrl
        };
      });
      
      const portalData = {
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        tradeShowName,
        items: itemsToSend,
        fileCount: uploadedFiles.length
      };
      
      const response = await fetch('/api/portals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portalData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (uploadedFiles.length > 0) {
          await uploadFiles(data.portal.id);
        }
        
        setPortalCreated(true);
        setPortalLink(data.portal.url);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create portal');
    } finally {
      setCreating(false);
    }
  }
  
  async function uploadFiles(portalId: string) {
    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('portalId', portalId);
      
      try {
        await fetch('/api/portals/upload', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  }
  
  function copyLink() {
    navigator.clipboard.writeText(portalLink);
    alert('✓ Link copied to clipboard!');
  }
  
  // Generate matrix data
  const colors = [...new Set(productSKUs.map(sku => sku.attr_2))];
  const sizes = [...new Set(productSKUs.map(sku => sku.size))];
  
  if (portalCreated) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <div style={{ background: 'white', padding: '48px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎉</div>
            <h1 style={{ fontSize: '36px', marginBottom: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700' }}>
              Portal Created!
            </h1>
            <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
              Your customer portal is ready to share
            </p>
            
            <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '32px', wordBreak: 'break-all', border: '2px dashed #e5e7eb' }}>
              <code style={{ fontSize: '15px', color: '#667eea', fontWeight: '600' }}>{portalLink}</code>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={copyLink} style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
                📋 Copy Link
              </button>
              <a href={portalLink} target="_blank" style={{ padding: '16px', background: '#10b981', color: 'white', borderRadius: '10px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', display: 'block', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
                👁️ View Portal
              </a>
              <a href="/admin" style={{ padding: '16px', background: '#6b7280', color: 'white', borderRadius: '10px', fontSize: '16px', fontWeight: '600', textDecoration: 'none', display: 'block' }}>
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <a href="/admin" style={{ color: '#667eea', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>← Back to Dashboard</a>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '8px 0 0 0', color: '#111827' }}>Create New Portal</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {orderItems.length > 0 && (
              <div style={{ background: '#667eea', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                {orderItems.length} Item{orderItems.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>
        
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>👤</span> Customer Information
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Customer Name *</label>
            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', color: '#111827', transition: 'border-color 0.2s' }} onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'} onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Email</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@email.com" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', color: '#111827' }} onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'} onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Phone</label>
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="555-555-5555" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', color: '#111827' }} onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'} onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'} />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>Trade Show Name</label>
            <input type="text" value={tradeShowName} onChange={(e) => setTradeShowName(e.target.value)} placeholder="e.g., Atlanta Apparel Market - January 2026" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', color: '#111827' }} onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'} onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'} />
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📦</span> Add Products
          </h2>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
              placeholder="Search by style number (e.g., 3160)" 
              style={{ flex: 1, minWidth: '250px', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', color: '#111827' }} 
            />
            <button 
              onClick={handleSearch} 
              disabled={searching} 
              style={{ padding: '12px 24px', background: searching ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: searching ? 'not-allowed' : 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}
            >
              {searching ? '🔍 Searching...' : '🔍 Search'}
            </button>
            <button 
              onClick={browseAll} 
              disabled={searching}
              style={{ padding: '12px 24px', background: searching ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: searching ? 'not-allowed' : 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
            >
              📋 Browse All
            </button>
          </div>

          {searchResults.length > 0 && (
            <div>
              <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>
                Showing {searchResults.length} products
              </div>
              <div style={{ border: '2px solid #e5e7eb', borderRadius: '12px', maxHeight: '500px', overflowY: 'auto', marginBottom: '24px' }}>
                {searchResults.map((product) => (
                  <div key={product.product_id} style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '16px', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => selectProduct(product)} onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'} onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                    {product.images && product.images[0] ? (
                      <img src={product.images[0].img} alt={product.style_number} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }} />
                    ) : (
                      <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        📦
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>{product.style_number}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{product.description || product.category || 'No description'}</div>
                      <div style={{ fontSize: '16px', color: '#667eea', marginTop: '6px', fontWeight: '600' }}>${product.price}</div>
                    </div>
                    <button style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', height: 'fit-content', alignSelf: 'center' }}>
                      Select →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {orderItems.length > 0 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>Order Items ({orderItems.length})</h3>
              {orderItems.map((item, index) => (
                <div key={index} style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '16px', border: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    {item.product.images && item.product.images[0] ? (
                      <img src={item.product.images[0].img} alt={item.product.style_number} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                        📦
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>{item.product.style_number}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                        {item.sku.attr_2} • {item.sku.size} • Qty: {item.quantity}
                      </div>
                      <div style={{ color: '#667eea', marginTop: '6px', fontWeight: '600' }}>${item.sku.price}/unit</div>
                    </div>
                    <button onClick={() => removeItem(index)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', height: 'fit-content', cursor: 'pointer', fontWeight: '600' }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📎</span> Upload Files
          </h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
            Upload photos of paper orders, business cards, booth photos, etc.
          </p>
          
          <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileSelect} style={{ display: 'block', marginBottom: '16px', padding: '12px', border: '2px dashed #e5e7eb', borderRadius: '10px', width: '100%', cursor: 'pointer' }} />
          
          {uploadedFiles.length > 0 && (
            <div>
              <h4 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: '700', color: '#111827' }}>Files Ready ({uploadedFiles.length})</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{file.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={() => removeFile(index)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={createPortal} disabled={!customerName || orderItems.length === 0 || creating} style={{ width: '100%', padding: '20px', background: (customerName && orderItems.length > 0 && !creating) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', cursor: (customerName && orderItems.length > 0 && !creating) ? 'pointer' : 'not-allowed', boxShadow: (customerName && orderItems.length > 0 && !creating) ? '0 8px 20px rgba(102, 126, 234, 0.4)' : 'none', transition: 'all 0.2s' }}>
          {creating ? '⏳ Creating Portal...' : `✨ Create Portal with ${orderItems.length} Item${orderItems.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* MATRIX VARIANT SELECTOR MODAL */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', margin: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '26px', marginBottom: '6px', fontWeight: '700', color: '#111827' }}>Select Quantities</h3>
                <p style={{ color: '#6b7280', fontSize: '15px' }}>Style: {selectedProduct.style_number} • ${productSKUs[0]?.price || selectedProduct.price}/unit</p>
              </div>
              <button onClick={closeVariantSelector} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                ✕ Close
              </button>
            </div>

            {loadingSKUs ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div>Loading variants...</div>
              </div>
            ) : productSKUs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>No variants found</div>
            ) : (
              <>
                {/* MATRIX GRID */}
                <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', background: '#f9fafb', border: '2px solid #e5e7eb', borderRight: '3px solid #667eea', fontWeight: '700', fontSize: '14px', color: '#111827', textAlign: 'left', position: 'sticky', left: 0, zIndex: 2 }}>
                          Size / Color
                        </th>
                        {colors.map((color, idx) => (
                          <th key={idx} style={{ padding: '12px', background: '#667eea', color: 'white', border: '2px solid #667eea', fontWeight: '700', fontSize: '14px', textAlign: 'center', minWidth: '100px' }}>
                            {color}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((size, sizeIdx) => (
                        <tr key={sizeIdx}>
                          <td style={{ padding: '12px', background: '#f9fafb', border: '2px solid #e5e7eb', borderRight: '3px solid #667eea', fontWeight: '700', fontSize: '14px', color: '#111827', position: 'sticky', left: 0, zIndex: 1 }}>
                            {size}
                          </td>
                          {colors.map((color, colorIdx) => {
                            const key = `${color}|${size}`;
                            const sku = productSKUs.find(s => s.attr_2 === color && s.size === size);
                            
                            if (sku) {
                              return (
                                <td key={colorIdx} style={{ padding: '8px', border: '2px solid #e5e7eb', textAlign: 'center' }}>
                                  <input 
                                    type="number"
                                    min="0"
                                    value={matrixQuantities[key] || 0}
                                    onChange={(e) => updateMatrixQuantity(key, e.target.value)}
                                    style={{ 
                                      width: '80px', 
                                      padding: '8px', 
                                      border: '2px solid #e5e7eb', 
                                      borderRadius: '6px', 
                                      fontSize: '16px', 
                                      textAlign: 'center',
                                      color: '#111827',
                                      fontWeight: '600'
                                    }}
                                    onFocus={(e) => {
                                      e.currentTarget.style.borderColor = '#667eea';
                                      e.currentTarget.style.background = '#f0f4ff';
                                    }}
                                    onBlur={(e) => {
                                      e.currentTarget.style.borderColor = '#e5e7eb';
                                      e.currentTarget.style.background = 'white';
                                    }}
                                  />
                                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                    {sku.qty_avail_sell} avail
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={colorIdx} style={{ padding: '8px', border: '2px solid #e5e7eb', background: '#f3f4f6', textAlign: 'center' }}>
                                  <div style={{ color: '#9ca3af', fontSize: '20px' }}>—</div>
                                </td>
                              );
                            }
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* DELIVERY DATE AND NOTES */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#374151', fontSize: '14px' }}>Expected Delivery Date (applies to all variants)</label>
                    <input 
                      type="date" 
                      value={matrixDeliveryDate} 
                      onChange={(e) => setMatrixDeliveryDate(e.target.value)} 
                      style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', color: '#111827' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#374151', fontSize: '14px' }}>Notes (optional)</label>
                    <textarea 
                      value={matrixNotes} 
                      onChange={(e) => setMatrixNotes(e.target.value)} 
                      placeholder="Add any notes for these variants..."
                      rows={3}
                      style={{ width: '100%', padding: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', color: '#111827', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* ADD BUTTON */}
                <button 
                  onClick={addMatrixToPortal}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  ✓ Add to Portal
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
