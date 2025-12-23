'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface PortalItem {
  id: string;
  style_number: string;
  attr_2: string;
  size: string;
  quantity: number;
  price: string;
  delivery_date: string;
  notes: string;
  image_url: string;
}

interface Portal {
  id: string;
  customer_name: string;
  trade_show_name: string;
  status: string;
  items: PortalItem[];
  files: Array<{ url: string; filename: string }>;
}

interface ProductGroup {
  style_number: string;
  image_url: string;
  price: string;
  delivery_date: string;
  notes: string;
  items: PortalItem[];
  colors: string[];
  sizes: string[];
  matrix: Record<string, PortalItem>;
  totalQuantity: number;
  totalAmount: number;
}

export default function PortalView() {
  const params = useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (params.link) {
      fetchPortal(params.link as string);
    }
  }, [params.link]);

  async function fetchPortal(uniqueLink: string) {
    try {
      const response = await fetch(`/api/portals/${uniqueLink}`);
      const data = await response.json();
      if (data.success) {
        setPortal(data.portal);
      }
    } catch (error) {
      console.error('Error fetching portal:', error);
    } finally {
      setLoading(false);
    }
  }

  async function confirmOrder() {
    if (!params.link) return;
    
    setConfirming(true);
    try {
      const response = await fetch(`/api/portals/${params.link}/confirm`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success && portal) {
        setPortal({ ...portal, status: 'confirmed' });
      }
    } catch (error) {
      console.error('Error confirming order:', error);
    } finally {
      setConfirming(false);
    }
  }

  function openImageModal(imageUrl: string) {
    setSelectedImage(imageUrl);
  }

  function closeImageModal() {
    setSelectedImage(null);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '20px' }}>Loading your portal...</div>
        </div>
      </div>
    );
  }

  if (!portal) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontSize: '20px' }}>Portal not found</div>
        </div>
      </div>
    );
  }

  const items = portal.items || [];
  
  // Group items by product (style_number)
  const productGroups: Record<string, ProductGroup> = {};
  
  items.forEach(item => {
    if (!productGroups[item.style_number]) {
      productGroups[item.style_number] = {
        style_number: item.style_number,
        image_url: item.image_url,
        price: item.price,
        delivery_date: item.delivery_date,
        notes: item.notes,
        items: [],
        colors: [],
        sizes: [],
        matrix: {},
        totalQuantity: 0,
        totalAmount: 0
      };
    }
    
    const group = productGroups[item.style_number];
    group.items.push(item);
    
    if (!group.colors.includes(item.attr_2)) {
      group.colors.push(item.attr_2);
    }
    if (!group.sizes.includes(item.size)) {
      group.sizes.push(item.size);
    }
    
    const key = `${item.attr_2}|${item.size}`;
    group.matrix[key] = item;
    
    group.totalQuantity += item.quantity;
    group.totalAmount += parseFloat(item.price) * item.quantity;
  });
  
  const products = Object.values(productGroups);
  const grandTotal = products.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>{portal.customer_name}</h1>
              {portal.trade_show_name && (
                <p style={{ fontSize: '16px', color: '#6b7280' }}>{portal.trade_show_name}</p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ padding: '8px 16px', background: portal.status === 'confirmed' ? '#d1fae5' : '#fef3c7', color: portal.status === 'confirmed' ? '#065f46' : '#92400e', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                {portal.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {items.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>No Items Yet</h2>
            <p style={{ color: '#6b7280' }}>This portal doesn't have any products added yet.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', color: '#111827' }}>Order Details</h2>
            
            {products.map((product, idx) => (
              <div key={idx} style={{ padding: '24px', background: '#f9fafb', borderRadius: '12px', marginBottom: '20px', border: '2px solid #e5e7eb' }}>
                
                {/* Product Header */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'start' }}>
                  {/* Product Image */}
                  {product.image_url ? (
                    <div 
                      onClick={() => openImageModal(product.image_url)}
                      style={{ 
                        width: '120px', 
                        height: '120px', 
                        flexShrink: 0,
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'transform 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <img 
                        src={product.image_url} 
                        alt={product.style_number}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb'
                        }} 
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        🔍 Click
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '48px',
                      flexShrink: 0
                    }}>
                      📦
                    </div>
                  )}

                  {/* Product Info */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>
                      Style: {product.style_number}
                    </h3>
                    <div style={{ fontSize: '16px', color: '#667eea', fontWeight: '700', marginBottom: '8px' }}>
                      ${product.price}/unit
                    </div>
                    {product.delivery_date && (
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>Expected Delivery:</span> {new Date(product.delivery_date).toLocaleDateString()}
                      </div>
                    )}
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      <span style={{ fontWeight: '600' }}>Total Units:</span> {product.totalQuantity}
                    </div>
                  </div>

                  {/* Product Total */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Product Total</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#667eea' }}>
                      ${product.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Matrix Grid */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px', background: 'white', border: '2px solid #e5e7eb', borderRight: '3px solid #667eea', fontWeight: '700', fontSize: '14px', color: '#111827', textAlign: 'left' }}>
                          Size / Color
                        </th>
                        {product.colors.map((color, cidx) => (
                          <th key={cidx} style={{ padding: '12px', background: '#667eea', color: 'white', border: '2px solid #667eea', fontWeight: '700', fontSize: '14px', textAlign: 'center', minWidth: '100px' }}>
                            {color}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizes.map((size, sidx) => (
                        <tr key={sidx}>
                          <td style={{ padding: '12px', background: 'white', border: '2px solid #e5e7eb', borderRight: '3px solid #667eea', fontWeight: '700', fontSize: '14px', color: '#111827' }}>
                            {size}
                          </td>
                          {product.colors.map((color, cidx) => {
                            const key = `${color}|${size}`;
                            const item = product.matrix[key];
                            
                            if (item) {
                              return (
                                <td key={cidx} style={{ padding: '12px', border: '2px solid #e5e7eb', textAlign: 'center', background: 'white' }}>
                                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                                    {item.quantity}
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td key={cidx} style={{ padding: '12px', border: '2px solid #e5e7eb', background: '#f3f4f6', textAlign: 'center' }}>
                                  <div style={{ color: '#9ca3af', fontSize: '18px' }}>—</div>
                                </td>
                              );
                            }
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notes */}
                {product.notes && (
                  <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '14px', color: '#92400e' }}>
                    <span style={{ fontWeight: '700' }}>📝 Notes:</span> {product.notes}
                  </div>
                )}
              </div>
            ))}

            {/* Grand Total */}
            <div style={{ marginTop: '24px', padding: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: '600' }}>Order Total</div>
              <div style={{ color: 'white', fontSize: '32px', fontWeight: '700' }}>${grandTotal.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {portal.files && portal.files.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>📎 Attached Files</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {portal.files.map((file, index) => (
                <a 
                  key={index} 
                  href={file.url} 
                  target="_blank" 
                  style={{ 
                    padding: '16px', 
                    background: '#f9fafb', 
                    borderRadius: '8px', 
                    border: '2px solid #e5e7eb',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                >
                  <div style={{ fontSize: '24px' }}>📄</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.filename}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {portal.status === 'pending' && items.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
              Please review your order details above and confirm when ready.
            </p>
            <button 
              onClick={confirmOrder}
              disabled={confirming}
              style={{ 
                padding: '16px 48px', 
                background: confirming ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                fontSize: '18px', 
                fontWeight: '700', 
                cursor: confirming ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              {confirming ? '⏳ Confirming...' : '✓ Confirm Order'}
            </button>
          </div>
        )}

        {portal.status === 'confirmed' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✓</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>Order Confirmed!</h3>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>Thank you for confirming your order. We'll be in touch soon!</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          onClick={closeImageModal}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.9)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            padding: '20px',
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={closeImageModal}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: '#111827'
              }}
            >
              ✕
            </button>
            <img 
              src={selectedImage} 
              alt="Product"
              style={{ 
                maxWidth: '100%', 
                maxHeight: '90vh', 
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
