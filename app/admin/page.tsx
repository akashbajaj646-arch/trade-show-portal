'use client';

import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ART DECO THEME - Admin Dashboard with Filters
// ═══════════════════════════════════════════════════════════════════════════════

const theme = {
  navy: '#0d1b2a',
  navyLight: '#1b2838',
  gold: '#d4af37',
  goldDim: '#b8962e',
  cream: '#f8f4e8',
  creamDim: 'rgba(248, 244, 232, 0.6)',
  creamFaint: 'rgba(248, 244, 232, 0.15)',
  success: '#2dd4bf',
  error: '#f87171',
  purple: '#a78bfa',
  amber: '#fbbf24',
  blue: '#60a5fa',
};

interface Portal {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trade_show_name: string;
  ship_date: string | null;
  created_at: string;
  status: string;
  url: string;
  unique_link: string;
  is_new_customer: boolean;
}

export default function AdminDashboard() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [filteredPortals, setFilteredPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingCustomers, setSyncingCustomers] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Filter state
  const [tradeShows, setTradeShows] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTradeShow, setFilterTradeShow] = useState('all');
  const [filterCustomerType, setFilterCustomerType] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchPortals();
  }, []);

  // Apply filters and sorting locally
  useEffect(() => {
    let result = [...portals];
    
    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(p => p.status === filterStatus);
    }
    
    // Filter by trade show
    if (filterTradeShow !== 'all') {
      result = result.filter(p => p.trade_show_name === filterTradeShow);
    }
    
    // Filter by customer type
    if (filterCustomerType === 'new') {
      result = result.filter(p => p.is_new_customer === true);
    } else if (filterCustomerType === 'existing') {
      result = result.filter(p => p.is_new_customer === false);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'ship_date') {
        const dateA = a.ship_date ? new Date(a.ship_date).getTime() : 0;
        const dateB = b.ship_date ? new Date(b.ship_date).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'customer_name') {
        comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
      } else {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredPortals(result);
  }, [portals, filterStatus, filterTradeShow, filterCustomerType, sortBy, sortOrder]);

  async function fetchPortals() {
    try {
      const response = await fetch('/api/portals/list');
      const data = await response.json();
      if (data.success) {
        setPortals(data.portals);
        setTradeShows(data.filters?.tradeShows || []);
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
          message: `Product sync complete! Products: ${data.stats.products}, Images: ${data.stats.images}, SKUs: ${data.stats.skus}, Duration: ${data.stats.duration}`
        });
      } else {
        setSyncResult({
          success: false,
          message: `Product sync failed: ${data.error}`
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: `Product sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
          message: `Customer sync complete! Customers: ${data.stats.customers.upserted}, Locations: ${data.stats.locations.upserted}, Duration: ${data.stats.duration}`
        });
      } else {
        setSyncResult({
          success: false,
          message: `Customer sync failed: ${data.error}`
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: `Customer sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      } else {
        alert('Failed to delete portal: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting portal:', error);
      alert('Error deleting portal');
    }
  }

  function clearFilters() {
    setFilterStatus('all');
    setFilterTradeShow('all');
    setFilterCustomerType('all');
    setSortBy('created_at');
    setSortOrder('desc');
  }

  const buttonStyle: React.CSSProperties = {
    padding: '14px 28px',
    background: 'transparent',
    border: `1px solid ${theme.gold}`,
    color: theme.gold,
    fontSize: '11px',
    letterSpacing: '2px',
    cursor: 'pointer',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block',
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    ...buttonStyle,
    background: theme.gold,
    color: theme.navy,
  };

  const selectStyle: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: '12px',
    background: 'rgba(248, 244, 232, 0.08)',
    border: `1px solid ${theme.creamFaint}`,
    color: theme.cream,
    cursor: 'pointer',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    outline: 'none',
    minWidth: '140px',
  };

  const filterLabelStyle: React.CSSProperties = {
    fontSize: '9px',
    letterSpacing: '2px',
    color: theme.gold,
    marginBottom: '6px',
    textTransform: 'uppercase',
    display: 'block',
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.navy,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Playfair Display", Georgia, serif',
      }}>
        <div style={{ textAlign: 'center', color: theme.cream }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `2px solid ${theme.creamFaint}`,
            borderTop: `2px solid ${theme.gold}`,
            borderRadius: '50%',
            margin: '0 auto 24px',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '18px', fontStyle: 'italic', letterSpacing: '1px' }}>Loading portals...</div>
        </div>
      </div>
    );
  }

  const activeFiltersCount = [
    filterStatus !== 'all',
    filterTradeShow !== 'all',
    filterCustomerType !== 'all',
    sortBy !== 'created_at' || sortOrder !== 'desc',
  ].filter(Boolean).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.navy,
      fontFamily: '"Playfair Display", Georgia, serif',
      color: theme.cream,
      position: 'relative',
    }}>
      {/* ═══ GEOMETRIC BACKGROUND PATTERN ═══ */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(30deg, ${theme.navy} 12%, transparent 12.5%, transparent 87%, ${theme.navy} 87.5%),
          linear-gradient(150deg, ${theme.navy} 12%, transparent 12.5%, transparent 87%, ${theme.navy} 87.5%),
          linear-gradient(60deg, rgba(212,175,55,0.03) 25%, transparent 25.5%, transparent 75%, rgba(212,175,55,0.03) 75%)
        `,
        backgroundSize: '80px 140px',
        opacity: 0.6,
        pointerEvents: 'none',
      }} />

      {/* ═══ TOP ORNAMENTAL BORDER ═══ */}
      <div style={{
        height: '4px',
        background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
      }} />

      {/* ═══ HEADER ═══ */}
      <header style={{
        padding: '32px 48px',
        borderBottom: `1px solid ${theme.creamFaint}`,
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}>
          <div>
            <div style={{
              fontSize: '10px',
              letterSpacing: '5px',
              color: theme.gold,
              marginBottom: '8px',
            }}>
              ✦ ADVANCE APPARELS ✦
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
              fontStyle: 'italic',
              letterSpacing: '1px',
            }}>
              Portal Manager
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={syncCustomers}
              disabled={syncingCustomers || syncingProducts}
              style={{
                ...buttonStyle,
                borderColor: theme.purple,
                color: syncingCustomers ? theme.creamDim : theme.purple,
                opacity: syncingCustomers || syncingProducts ? 0.5 : 1,
                cursor: syncingCustomers || syncingProducts ? 'not-allowed' : 'pointer',
              }}
            >
              {syncingCustomers ? '◌ SYNCING...' : '◈ SYNC CUSTOMERS'}
            </button>

            <button
              onClick={syncProducts}
              disabled={syncingProducts || syncingCustomers}
              style={{
                ...buttonStyle,
                borderColor: theme.amber,
                color: syncingProducts ? theme.creamDim : theme.amber,
                opacity: syncingProducts || syncingCustomers ? 0.5 : 1,
                cursor: syncingProducts || syncingCustomers ? 'not-allowed' : 'pointer',
              }}
            >
              {syncingProducts ? '◌ SYNCING...' : '◈ SYNC PRODUCTS'}
            </button>

            <a href="/admin/create" style={buttonPrimaryStyle}>
              + NEW PORTAL
            </a>
          </div>
        </div>

        {/* Decorative divider */}
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '-1px',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          background: theme.navy,
          padding: '0 24px',
        }}>
          <div style={{ width: '40px', height: '1px', background: theme.gold }} />
          <div style={{
            width: '8px',
            height: '8px',
            border: `1px solid ${theme.gold}`,
            transform: 'rotate(45deg)',
            margin: '0 12px',
          }} />
          <div style={{ width: '40px', height: '1px', background: theme.gold }} />
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Sync Result */}
        {syncResult && (
          <div style={{
            background: syncResult.success ? 'rgba(45, 212, 191, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: `1px solid ${syncResult.success ? theme.success : theme.error}`,
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{
              color: syncResult.success ? theme.success : theme.error,
              fontSize: '14px',
              letterSpacing: '0.5px',
            }}>
              {syncResult.success ? '✓' : '✕'} {syncResult.message}
            </div>
            <button
              onClick={() => setSyncResult(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: syncResult.success ? theme.success : theme.error,
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Total', value: portals.length, icon: '◇' },
            { label: 'Active', value: portals.filter(p => p.status === 'active').length, icon: '◆', color: theme.success },
            { label: 'Pending', value: portals.filter(p => p.status === 'pending').length, icon: '○', color: theme.amber },
            { label: 'Shipped', value: portals.filter(p => p.status === 'shipped').length, icon: '▸', color: theme.blue },
            { label: 'New Customers', value: portals.filter(p => p.is_new_customer).length, icon: '★', color: theme.purple },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '20px',
              background: 'rgba(248, 244, 232, 0.03)',
              border: `1px solid ${theme.creamFaint}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '9px',
                letterSpacing: '2px',
                color: stat.color || theme.gold,
                marginBottom: '8px',
              }}>
                {stat.icon} {stat.label.toUpperCase()}
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '300',
                fontStyle: 'italic',
                color: stat.color || theme.cream,
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ FILTERS SECTION ═══ */}
        <div style={{
          padding: '24px',
          background: 'rgba(248, 244, 232, 0.03)',
          border: `1px solid ${theme.creamFaint}`,
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <div style={{
              fontSize: '10px',
              letterSpacing: '3px',
              color: theme.gold,
            }}>
              ◇ FILTERS {activeFiltersCount > 0 && `(${activeFiltersCount} active)`}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.creamDim,
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '1px',
                }}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '20px',
          }}>
            {/* Status Filter */}
            <div>
              <label style={filterLabelStyle}>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={selectStyle}
              >
                <option value="all" style={{ background: theme.navy }}>All Statuses</option>
                <option value="active" style={{ background: theme.navy }}>Active</option>
                <option value="pending" style={{ background: theme.navy }}>Pending</option>
                <option value="shipped" style={{ background: theme.navy }}>Shipped</option>
                <option value="completed" style={{ background: theme.navy }}>Completed</option>
                <option value="cancelled" style={{ background: theme.navy }}>Cancelled</option>
              </select>
            </div>

            {/* Trade Show Filter */}
            <div>
              <label style={filterLabelStyle}>Trade Show</label>
              <select
                value={filterTradeShow}
                onChange={(e) => setFilterTradeShow(e.target.value)}
                style={selectStyle}
              >
                <option value="all" style={{ background: theme.navy }}>All Trade Shows</option>
                {tradeShows.map((show) => (
                  <option key={show} value={show} style={{ background: theme.navy }}>
                    {show}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Type Filter */}
            <div>
              <label style={filterLabelStyle}>Customer Type</label>
              <select
                value={filterCustomerType}
                onChange={(e) => setFilterCustomerType(e.target.value)}
                style={selectStyle}
              >
                <option value="all" style={{ background: theme.navy }}>All Customers</option>
                <option value="new" style={{ background: theme.navy }}>★ New Customers</option>
                <option value="existing" style={{ background: theme.navy }}>Existing Customers</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label style={filterLabelStyle}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={selectStyle}
              >
                <option value="created_at" style={{ background: theme.navy }}>Date Created</option>
                <option value="ship_date" style={{ background: theme.navy }}>Ship Date</option>
                <option value="customer_name" style={{ background: theme.navy }}>Customer Name</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label style={filterLabelStyle}>Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                style={selectStyle}
              >
                <option value="desc" style={{ background: theme.navy }}>Newest First</option>
                <option value="asc" style={{ background: theme.navy }}>Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '12px',
            color: theme.creamDim,
            letterSpacing: '1px',
          }}>
            Showing {filteredPortals.length} of {portals.length} portals
          </div>
        </div>

        {/* Portals List */}
        {filteredPortals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: 'rgba(248, 244, 232, 0.03)',
            border: `1px solid ${theme.creamFaint}`,
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              color: theme.gold,
            }}>◇</div>
            <div style={{
              fontSize: '20px',
              fontStyle: 'italic',
              marginBottom: '12px',
            }}>
              {portals.length === 0 ? 'No portals yet' : 'No portals match your filters'}
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.creamDim,
              marginBottom: '32px',
            }}>
              {portals.length === 0 
                ? 'Create your first customer portal to get started'
                : 'Try adjusting your filter criteria'
              }
            </div>
            {portals.length === 0 ? (
              <a href="/admin/create" style={buttonPrimaryStyle}>
                + CREATE PORTAL
              </a>
            ) : (
              <button onClick={clearFilters} style={buttonStyle}>
                CLEAR FILTERS
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPortals.map((portal) => (
              <div
                key={portal.id}
                style={{
                  padding: '20px 28px',
                  background: 'rgba(248, 244, 232, 0.03)',
                  border: `1px solid ${portal.is_new_customer ? theme.purple : theme.creamFaint}`,
                  borderLeft: portal.is_new_customer ? `3px solid ${theme.purple}` : `1px solid ${theme.creamFaint}`,
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: '20px',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Customer Info */}
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontStyle: 'italic',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    {portal.customer_name}
                    {portal.is_new_customer && (
                      <span style={{
                        fontSize: '9px',
                        letterSpacing: '1px',
                        color: theme.purple,
                        border: `1px solid ${theme.purple}`,
                        padding: '2px 6px',
                      }}>NEW</span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: theme.creamDim,
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    {portal.customer_email && <span>{portal.customer_email}</span>}
                    {portal.trade_show_name && (
                      <span style={{ color: theme.gold }}>
                        {portal.trade_show_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ship Date */}
                <div>
                  <div style={{
                    fontSize: '9px',
                    letterSpacing: '1px',
                    color: theme.creamDim,
                    marginBottom: '4px',
                  }}>SHIP DATE</div>
                  <div style={{
                    fontSize: '14px',
                    color: portal.ship_date ? theme.cream : theme.creamDim,
                    fontStyle: portal.ship_date ? 'normal' : 'italic',
                  }}>
                    {portal.ship_date 
                      ? new Date(portal.ship_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Not set'
                    }
                  </div>
                </div>

                {/* Status */}
                <div>
                  <select
                    value={portal.status}
                    onChange={(e) => updateStatus(portal.id, e.target.value)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '10px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      background: 'transparent',
                      border: `1px solid ${
                        portal.status === 'active' ? theme.success :
                        portal.status === 'shipped' ? theme.blue :
                        portal.status === 'completed' ? theme.gold :
                        portal.status === 'cancelled' ? theme.error :
                        theme.creamFaint
                      }`,
                      color: portal.status === 'active' ? theme.success :
                             portal.status === 'shipped' ? theme.blue :
                             portal.status === 'completed' ? theme.gold :
                             portal.status === 'cancelled' ? theme.error :
                             theme.cream,
                      cursor: 'pointer',
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                      outline: 'none',
                    }}
                  >
                    <option value="pending" style={{ background: theme.navy, color: theme.cream }}>Pending</option>
                    <option value="active" style={{ background: theme.navy, color: theme.cream }}>Active</option>
                    <option value="shipped" style={{ background: theme.navy, color: theme.cream }}>Shipped</option>
                    <option value="completed" style={{ background: theme.navy, color: theme.cream }}>Completed</option>
                    <option value="cancelled" style={{ background: theme.navy, color: theme.cream }}>Cancelled</option>
                  </select>
                </div>

                {/* Created Date */}
                <div style={{
                  fontSize: '11px',
                  color: theme.creamDim,
                }}>
                  {new Date(portal.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={portal.url || `/portal/${portal.unique_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      fontSize: '9px',
                      letterSpacing: '1px',
                      border: `1px solid ${theme.creamFaint}`,
                      color: theme.cream,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    VIEW
                  </a>
                  <button
                    onClick={() => {
                      const url = portal.url || `${window.location.origin}/portal/${portal.unique_link}`;
                      navigator.clipboard.writeText(url);
                      alert('Link copied!');
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '9px',
                      letterSpacing: '1px',
                      background: 'transparent',
                      border: `1px solid ${theme.gold}`,
                      color: theme.gold,
                      cursor: 'pointer',
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    COPY
                  </button>
                  <button
                    onClick={() => deletePortal(portal.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '9px',
                      letterSpacing: '1px',
                      background: 'transparent',
                      border: `1px solid ${theme.error}`,
                      color: theme.error,
                      cursor: 'pointer',
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                    }}
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══ BOTTOM ORNAMENTAL BORDER ═══ */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, transparent, ${theme.gold}, transparent)`,
        zIndex: 100,
      }} />
    </div>
  );
}
