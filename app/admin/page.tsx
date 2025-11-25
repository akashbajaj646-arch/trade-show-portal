'use client';

import { useState, useEffect } from 'react';

interface Portal {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trade_show_name: string;
  created_at: string;
  status: string;
  url: string;
  unique_link: string;
}

export default function AdminDashboard() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingCustomers, setSyncingCustomers] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchPortals();
  }, []);

  async function fetchPortals() {
    try {
      const response = await fetch('/api/portals/list');
      const data = await response.json();
      if (data.success) {
        setPortals(data.portals);
      }
    } catch (error) {
      console.error('Error fetching portals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function syncProducts() {
    if (!confirm('This will sync all products from ApparelMagic. This may take 5-10 minutes. Continue?')) {
      return;
    }

    setSyncingProducts(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/sync-products', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: `✅ Product sync complete! Products: ${data.stats.products}, Images: ${data.stats.images}, SKUs: ${data.stats.skus}, Duration: ${data.stats.duration}`
        });
      } else {
        setSyncResult({
          success: false,
          message: `❌ Product sync failed: ${data.error}`
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: `❌ Product sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSyncingProducts(false);
    }
  }

  async function syncCustomers() {
    if (!confirm('This will sync all customers from ApparelMagic. Continue?')) {
      return;
    }

    setSyncingCustomers(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/sync-customers', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          success: true,
          message: `✅ Customer sync complete! Customers: ${data.stats.customers.upserted}, Locations: ${data.stats.locations.upserted}, Duration: ${data.stats.duration}`
        });
      } else {
        setSyncResult({
          success: false,
          message: `❌ Customer sync failed: ${data.error}`
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: `❌ Customer sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSyncingCustomers(false);
    }
  }

  async function updateStatus(portalId: string, newStatus: string) {
    try {
      const response = await fetch('/api/admin/portals/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalId, status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPortals(portals.map(p => 
          p.id === portalId ? { ...p, status: newStatus } : p
        ));
        alert('✓ Status updated successfully');
      } else {
        alert('Failed to update status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  }

  async function deletePortal(portalId: string) {
    if (!confirm('Are you sure you want to delete this portal? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/portals/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portalId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPortals(portals.filter(p => p.id !== portalId));
        alert('✓ Portal deleted successfully');
      } else {
        alert('Failed to delete portal: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting portal:', error);
      alert('Error deleting portal');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '20px' }}>Loading portals...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>Trade Show Portal Manager</h1>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={syncCustomers}
              disabled={syncingCustomers || syncingProducts}
              style={{
                padding: '12px 24px',
                background: syncingCustomers ? '#9ca3af' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: syncingCustomers || syncingProducts ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                boxShadow: syncingCustomers ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}
            >
              {syncingCustomers ? '🔄 Syncing Customers...' : '👥 Sync Customers'}
            </button>
            <button
              onClick={syncProducts}
              disabled={syncingProducts || syncingCustomers}
              style={{
                padding: '12px 24px',
                background: syncingProducts ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: syncingProducts || syncingCustomers ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                boxShadow: syncingProducts ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.4)'
              }}
            >
              {syncingProducts ? '🔄 Syncing Products...' : '📦 Sync Products'}
            </button>
            <a href="/admin/create" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}>
              ✨ Create New Portal
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px' }}>
        
        {/* Sync Result */}
        {syncResult && (
          <div style={{ 
            background: syncResult.success ? '#d1fae5' : '#fee2e2', 
            border: `2px solid ${syncResult.success ? '#059669' : '#dc2626'}`,
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ color: syncResult.success ? '#065f46' : '#991b1b', fontSize: '16px', fontWeight: '600' }}>
              {syncResult.message}
            </div>
            <button
              onClick={() => setSyncResult(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: syncResult.success ? '#065f46' : '#991b1b',
                fontSize: '20px',
                cursor: 'pointer',
                fontWeight: '700'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {portals.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📋</div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#111827', fontWeight: '700' }}>No Portals Yet</h2>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '16px' }}>Get started by syncing your customers and creating your first portal</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={syncCustomers}
                disabled={syncingCustomers}
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '16px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                }}
              >
                👥 Sync Customers First
              </button>
              <a href="/admin/create" style={{ display: 'inline-block', padding: '16px 32px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '16px', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
                Create Your First Portal
              </a>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '2px solid #f3f4f6' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>All Portals ({portals.length})</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trade Show</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portals.map((portal) => (
                    <tr key={portal.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>{portal.customer_name}</div>
                        {portal.customer_email && (
                          <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>{portal.customer_email}</div>
                        )}
                        {portal.customer_phone && (
                          <div style={{ color: '#6b7280', fontSize: '13px' }}>{portal.customer_phone}</div>
                        )}
                      </td>
                      <td style={{ padding: '20px 24px', color: '#374151', fontSize: '14px' }}>
                        {portal.trade_show_name || '-'}
                      </td>
                      <td style={{ padding: '20px 24px', color: '#6b7280', fontSize: '14px' }}>
                        {new Date(portal.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <select 
                          value={portal.status}
                          onChange={(e) => updateStatus(portal.id, e.target.value)}
                          style={{ 
                            padding: '6px 12px', 
                            background: portal.status === 'pending' ? '#fef3c7' : portal.status === 'confirmed' ? '#d1fae5' : '#fee2e2',
                            color: portal.status === 'pending' ? '#92400e' : portal.status === 'confirmed' ? '#065f46' : '#991b1b',
                            border: 'none',
                            borderRadius: '6px', 
                            fontSize: '13px', 
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="confirmed">✓ Confirmed</option>
                          <option value="cancelled">✕ Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a 
                            href={portal.url} 
                            target="_blank" 
                            style={{ 
                              padding: '8px 16px', 
                              background: '#667eea', 
                              color: 'white', 
                              borderRadius: '6px', 
                              textDecoration: 'none', 
                              fontSize: '14px', 
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            👁️ View
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(portal.url);
                              alert('✓ Link copied!');
                            }}
                            style={{
                              padding: '8px 16px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => deletePortal(portal.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
