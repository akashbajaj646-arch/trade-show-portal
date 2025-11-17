'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CustomerPortal() {
  const params = useParams();
  const link = params.link;
  
  const [portal, setPortal] = useState(null);
  const [items, setItems] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!link) return;
    
    fetch(`/api/portals/${link}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPortal(data.portal);
          setItems(data.items);
          setAttachments(data.attachments || []);
        }
        setLoading(false);
      });
  }, [link]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>Loading your order...</div>
        </div>
      </div>
    );
  }

  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '30px 20px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '700', margin: '0 0 12px 0', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Advance Apparels
          </h1>
          <div style={{ fontSize: '20px', color: '#374151', marginBottom: '8px' }}>
            Order for: <strong style={{ color: '#111827' }}>{portal?.customer_name}</strong>
          </div>
          {portal?.trade_show_name && (
            <div style={{ fontSize: '15px', color: '#6b7280', background: 'rgba(102, 126, 234, 0.1)', padding: '6px 16px', borderRadius: '20px', display: 'inline-block' }}>
              📍 {portal.trade_show_name}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Order Items */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            📦 Order Details
          </h2>
          
          {items.map((item, index) => (
            <div key={index} style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', gap: '28px', marginBottom: '24px', flexWrap: 'wrap' }}>
                
                {item.product_images && item.product_images.length > 0 ? (
                  <div 
                    onClick={() => setSelectedImage(item.product_images[0].img)}
                    style={{ 
                      flexShrink: 0,
                      cursor: 'pointer',
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img 
                      src={item.product_images[0].img} 
                      alt={item.style_number}
                      style={{ 
                        width: '180px', 
                        height: '180px', 
                        objectFit: 'cover',
                        transition: 'transform 0.3s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '0', 
                      left: '0',
                      right: '0',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', 
                      color: 'white', 
                      padding: '8px 12px', 
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      🔍 Click to zoom
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    width: '180px', 
                    height: '180px', 
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '14px',
                    color: '#9ca3af',
                    fontWeight: '600'
                  }}>
                    No Image
                  </div>
                )}

                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>
                        Product
                      </div>
                      <h3 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>
                        Style {item.style_number}
                      </h3>
                      <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
                        {item.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase' }}>
                        Unit Price
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#667eea' }}>
                        ${parseFloat(item.price).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ 
                paddingTop: '24px', 
                borderTop: '2px solid #f3f4f6',
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '24px' 
              }}>
                <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', padding: '20px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#78350f', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>
                    Quantity
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#92400e' }}>
                    {item.quantity} units
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', padding: '20px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>
                    Subtotal
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#047857' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', padding: '20px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#1e3a8a', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>
                    Expected Delivery
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af' }}>
                    {item.expected_delivery_date ? new Date(item.expected_delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '32px', 
          marginBottom: '30px',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          border: '3px solid #667eea'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>
                Total Order Value
              </div>
              <div style={{ fontSize: '48px', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ${totalValue.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '4px' }}>
                {items.length} Product{items.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                {items.reduce((sum, item) => sum + item.quantity, 0)} Total Units
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '32px', 
            marginBottom: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📎 Attachments
              <span style={{ 
                fontSize: '14px', 
                background: '#667eea', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '12px',
                fontWeight: '600'
              }}>
                {attachments.length}
              </span>
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '15px' }}>
              Photos and documents from the trade show
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {attachments.map((attachment) => (
                <div key={attachment.id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  {attachment.file_type === 'photo' || attachment.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div style={{ cursor: 'pointer' }} onClick={() => setSelectedImage(attachment.file_url)}>
                      <img 
                        src={attachment.file_url} 
                        alt={attachment.file_name}
                        style={{ 
                          width: '100%', 
                          height: '180px', 
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ padding: '16px', background: 'white' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>
                          {attachment.file_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {(attachment.file_size / 1024).toFixed(1)} KB • Click to enlarge
                        </div>
                      </div>
                    </div>
                  ) : (
                    <a href={attachment.file_url} target="_blank" style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: 'white' }}>
                      <div style={{ padding: '32px', textAlign: 'center', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
                        <div style={{ fontSize: '56px', marginBottom: '12px' }}>📄</div>
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>
                          {attachment.file_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '600' }}>
                          Click to download →
                        </div>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '32px', 
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <h3 style={{ fontSize: '22px', marginBottom: '16px', color: '#111827', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>📋</span> Next Steps
          </h3>
          <p style={{ color: '#4b5563', lineHeight: '1.8', margin: 0, fontSize: '16px' }}>
            Please review your order details above carefully. If you need to make any changes or have questions, 
            contact us at your earliest convenience. We will reach out to arrange payment and finalize delivery details.
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '14px', padding: '30px 0' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Advance Apparels</div>
          <div style={{ opacity: 0.8 }}>Trade Show Order Portal</div>
          <div style={{ marginTop: '12px', opacity: 0.7 }}>Questions? Contact us for assistance.</div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.95)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            padding: '40px',
            animation: 'fadeIn 0.2s'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '95%', maxHeight: '95%' }}>
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                fontSize: '28px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ×
            </button>
            <img 
              src={selectedImage} 
              alt="Full size"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '90vh', 
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '15px',
              background: 'rgba(0,0,0,0.8)',
              padding: '10px 20px',
              borderRadius: '24px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}>
              Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
