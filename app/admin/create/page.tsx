'use client';

import { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ART DECO THEME - Trade Show Portal
// Deep navy (#0d1b2a), Gold accents (#d4af37), Cream text (#f8f4e8)
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
};

interface Customer {
  id: string;
  am_customer_id: string | null;
  customer_name: string;
  account_number: string | null;
  email: string | null;
  phone: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  is_local_only: boolean;
}

interface Location {
  id: string;
  am_location_id: string | null;
  location_name: string;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  is_main_location: boolean;
}

export default function CreatePortalPage() {
  // Customer selection state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // Location selection state
  const [customerLocations, setCustomerLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  
  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [tradeShowName, setTradeShowName] = useState('');
  const [shipDate, setShipDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Refs
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Search customers with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (customerSearchQuery.length < 2) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/customers/search?q=${encodeURIComponent(customerSearchQuery)}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
          setCustomerResults(data.customers);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [customerSearchQuery]);
  
  // Select existing customer from dropdown
  async function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setUseCustomAddress(false);
    
    setCustomerName(customer.customer_name || '');
    setCustomerEmail(customer.email || '');
    setCustomerPhone(customer.phone || '');
    
    setAddress1('');
    setAddress2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('USA');
    
    setCustomerSearchQuery('');
    setShowDropdown(false);
    
    setLoadingLocations(true);
    setCustomerLocations([]);
    setSelectedLocation(null);
    
    try {
      const response = await fetch(`/api/customers/locations?customer_id=${customer.id}`);
      const data = await response.json();
      
      if (data.success && data.locations.length > 0) {
        setCustomerLocations(data.locations);
        
        const mainLocation = data.locations.find((loc: Location) => loc.is_main_location);
        const defaultLocation = mainLocation || data.locations[0];
        
        if (defaultLocation) {
          selectLocation(defaultLocation);
        }
      } else {
        setAddress1(customer.address_1 || '');
        setAddress2(customer.address_2 || '');
        setCity(customer.city || '');
        setState(customer.state || '');
        setPostalCode(customer.postal_code || '');
        setCountry(customer.country || 'USA');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setAddress1(customer.address_1 || '');
      setAddress2(customer.address_2 || '');
      setCity(customer.city || '');
      setState(customer.state || '');
      setPostalCode(customer.postal_code || '');
      setCountry(customer.country || 'USA');
    } finally {
      setLoadingLocations(false);
    }
  }
  
  function selectLocation(location: Location) {
    setSelectedLocation(location);
    setUseCustomAddress(false);
    setAddress1(location.address_1 || '');
    setAddress2(location.address_2 || '');
    setCity(location.city || '');
    setState(location.state || '');
    setPostalCode(location.postal_code || '');
    setCountry(location.country || 'USA');
  }
  
  function enableCustomAddress() {
    setSelectedLocation(null);
    setUseCustomAddress(true);
    setAddress1('');
    setAddress2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('USA');
  }
  
  function startNewCustomer() {
    setSelectedCustomer(null);
    setIsNewCustomer(true);
    setCustomerLocations([]);
    setSelectedLocation(null);
    setUseCustomAddress(true);
    
    setCustomerName(customerSearchQuery);
    setCustomerEmail('');
    setCustomerPhone('');
    setAddress1('');
    setAddress2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('USA');
    
    setCustomerSearchQuery('');
    setShowDropdown(false);
  }
  
  function clearCustomerSelection() {
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setCustomerLocations([]);
    setSelectedLocation(null);
    setUseCustomAddress(false);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAddress1('');
    setAddress2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('USA');
  }
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!customerName.trim()) {
      alert('Please enter a customer name');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/portals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id || null,
          customerName: customerName.trim(),
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          locationId: selectedLocation?.id || null,
          locationName: selectedLocation?.location_name || null,
          address1: address1 || null,
          address2: address2 || null,
          city: city || null,
          state: state || null,
          postalCode: postalCode || null,
          country: country || 'USA',
          tradeShowName: tradeShowName || null,
          shipDate: shipDate || null,
          notes: notes || null,
          isNewCustomer: isNewCustomer,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to admin dashboard with success message
        window.location.href = `/admin?created=${data.portal.uniqueLink}`;
      } else {
        alert('Failed to create portal: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating portal:', error);
      alert('Error creating portal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLED INPUT COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 20px',
    fontSize: '16px',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    background: 'rgba(248, 244, 232, 0.08)',
    border: `1px solid ${theme.creamFaint}`,
    borderRadius: '0',
    color: theme.cream,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: theme.gold,
    fontFamily: '"Cormorant Garamond", Georgia, serif',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.navy,
      fontFamily: '"Playfair Display", Georgia, serif',
      color: theme.cream,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ═══ GEOMETRIC BACKGROUND PATTERN ═══ */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(30deg, ${theme.navy} 12%, transparent 12.5%, transparent 87%, ${theme.navy} 87.5%),
          linear-gradient(150deg, ${theme.navy} 12%, transparent 12.5%, transparent 87%, ${theme.navy} 87.5%),
          linear-gradient(30deg, ${theme.navy} 12%, transparent 12.5%, transparent 87%, ${theme.navy} 87.5%),
          linear-gradient(150deg, ${theme.navy} 12%, transparent 12.5%, transparent 87%, ${theme.navy} 87.5%),
          linear-gradient(60deg, rgba(212,175,55,0.03) 25%, transparent 25.5%, transparent 75%, rgba(212,175,55,0.03) 75%),
          linear-gradient(60deg, rgba(212,175,55,0.03) 25%, transparent 25.5%, transparent 75%, rgba(212,175,55,0.03) 75%)
        `,
        backgroundSize: '80px 140px',
        backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px',
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        borderBottom: `1px solid ${theme.creamFaint}`,
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
            fontSize: '28px',
            fontWeight: '400',
            margin: 0,
            fontStyle: 'italic',
            letterSpacing: '1px',
          }}>
            New Portal
          </h1>
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

        <a
          href="/admin"
          style={{
            background: 'transparent',
            border: `1px solid ${theme.gold}`,
            color: theme.gold,
            padding: '12px 24px',
            fontSize: '11px',
            letterSpacing: '2px',
            textDecoration: 'none',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            transition: 'all 0.3s ease',
          }}
        >
          ← RETURN
        </a>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '60px 40px',
        position: 'relative',
        zIndex: 10,
      }}>
        <form onSubmit={handleSubmit}>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION I: CUSTOMER
          ═══════════════════════════════════════════════════════════════════ */}
          <section style={{ marginBottom: '60px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                fontSize: '10px',
                letterSpacing: '4px',
                color: theme.gold,
                marginBottom: '16px',
              }}>— I —</div>
              <div style={{
                fontSize: '12px',
                letterSpacing: '3px',
                opacity: 0.6,
                textTransform: 'uppercase',
              }}>Customer</div>
            </div>

            {/* Customer Search */}
            {!selectedCustomer && !isNewCustomer ? (
              <div ref={searchRef} style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search customer name..."
                  style={{
                    ...inputStyle,
                    fontSize: '20px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: '20px',
                    border: `1px solid ${theme.creamFaint}`,
                    borderBottom: customerSearchQuery ? `1px solid ${theme.gold}` : `1px solid ${theme.creamFaint}`,
                  }}
                  onFocus={() => customerSearchQuery.length >= 2 && setShowDropdown(true)}
                />

                {isSearching && (
                  <div style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: theme.creamDim,
                    fontSize: '12px',
                    letterSpacing: '1px',
                  }}>
                    Searching...
                  </div>
                )}

                {/* Dropdown Results */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: theme.navyLight,
                    border: `1px solid ${theme.creamFaint}`,
                    borderTop: 'none',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    zIndex: 100,
                  }}>
                    {customerResults.length > 0 ? (
                      customerResults.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          style={{
                            padding: '16px 20px',
                            cursor: 'pointer',
                            borderBottom: `1px solid ${theme.creamFaint}`,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontSize: '16px', fontStyle: 'italic', marginBottom: '4px' }}>
                            {customer.customer_name}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.creamDim }}>
                            {[customer.email, customer.city].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px 20px', color: theme.creamDim, textAlign: 'center', fontStyle: 'italic' }}>
                        No customers found
                      </div>
                    )}

                    {/* Create New Option */}
                    <div
                      onClick={startNewCustomer}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        background: `rgba(212,175,55,0.15)`,
                        borderTop: `2px solid ${theme.gold}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: theme.gold,
                        fontStyle: 'italic',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.25)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.15)'}
                    >
                      <span>+</span>
                      <span>Create New Customer{customerSearchQuery ? `: "${customerSearchQuery}"` : ''}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Selected Customer Display */
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '24px',
                  background: selectedCustomer ? 'rgba(212,175,55,0.1)' : 'rgba(45, 212, 191, 0.1)',
                  border: `1px solid ${selectedCustomer ? theme.gold : theme.success}`,
                  marginBottom: '32px',
                }}>
                  <div>
                    <div style={{
                      fontSize: '10px',
                      letterSpacing: '2px',
                      color: selectedCustomer ? theme.gold : theme.success,
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}>
                      {selectedCustomer ? '✓ Customer Selected' : '✦ New Customer'}
                    </div>
                    <div style={{ fontSize: '22px', fontStyle: 'italic' }}>
                      {selectedCustomer?.customer_name || customerName || 'Unnamed'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearCustomerSelection}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${theme.creamFaint}`,
                      color: theme.cream,
                      padding: '10px 20px',
                      fontSize: '11px',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  >
                    CHANGE
                  </button>
                </div>

                {/* Customer Detail Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Business Name *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="email@example.com"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION II: SHIPPING DESTINATION
          ═══════════════════════════════════════════════════════════════════ */}
          {(selectedCustomer || isNewCustomer) && (
            <section style={{ marginBottom: '60px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  fontSize: '10px',
                  letterSpacing: '4px',
                  color: theme.gold,
                  marginBottom: '16px',
                }}>— II —</div>
                <div style={{
                  fontSize: '12px',
                  letterSpacing: '3px',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                }}>Shipping Destination</div>
              </div>

              {/* Location Selector */}
              {selectedCustomer && customerLocations.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  {loadingLocations ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: theme.creamDim, fontStyle: 'italic' }}>
                      Loading locations...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {customerLocations.map((location) => (
                        <div
                          key={location.id}
                          onClick={() => selectLocation(location)}
                          style={{
                            padding: '20px 24px',
                            background: selectedLocation?.id === location.id
                              ? 'rgba(212,175,55,0.12)'
                              : 'rgba(248, 244, 232, 0.03)',
                            border: `1px solid ${selectedLocation?.id === location.id ? theme.gold : theme.creamFaint}`,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              marginBottom: '6px',
                            }}>
                              <span style={{ fontSize: '18px', fontStyle: 'italic' }}>
                                {location.location_name}
                              </span>
                              {location.is_main_location && (
                                <span style={{
                                  fontSize: '9px',
                                  letterSpacing: '1px',
                                  color: theme.gold,
                                  border: `1px solid ${theme.gold}`,
                                  padding: '3px 8px',
                                  textTransform: 'uppercase',
                                }}>Primary</span>
                              )}
                            </div>
                            <div style={{ fontSize: '13px', color: theme.creamDim }}>
                              {[location.address_1, location.city, location.state, location.postal_code]
                                .filter(Boolean).join(', ')}
                            </div>
                          </div>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: `1px solid ${selectedLocation?.id === location.id ? theme.gold : theme.creamFaint}`,
                            transform: 'rotate(45deg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: selectedLocation?.id === location.id ? theme.gold : 'transparent',
                            transition: 'all 0.2s',
                          }}>
                            {selectedLocation?.id === location.id && (
                              <span style={{
                                transform: 'rotate(-45deg)',
                                color: theme.navy,
                                fontSize: '12px',
                              }}>✓</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Custom Address Option */}
                      <div
                        onClick={enableCustomAddress}
                        style={{
                          padding: '20px 24px',
                          background: useCustomAddress ? 'rgba(45, 212, 191, 0.1)' : 'transparent',
                          border: `1px dashed ${useCustomAddress ? theme.success : theme.creamFaint}`,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{
                            fontSize: '16px',
                            fontStyle: 'italic',
                            color: useCustomAddress ? theme.success : theme.cream,
                          }}>
                            + Enter Different Address
                          </div>
                          <div style={{ fontSize: '12px', color: theme.creamDim, marginTop: '4px' }}>
                            Ship to a location not listed above
                          </div>
                        </div>
                        {useCustomAddress && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: `1px solid ${theme.success}`,
                            transform: 'rotate(45deg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: theme.success,
                          }}>
                            <span style={{
                              transform: 'rotate(-45deg)',
                              color: theme.navy,
                              fontSize: '12px',
                            }}>✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Address Fields */}
              {(isNewCustomer || useCustomAddress || customerLocations.length === 0) && (
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Address Line 1</label>
                    <input
                      type="text"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="Street address"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Address Line 2</label>
                    <input
                      type="text"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Suite, unit, building..."
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Postal Code</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Selected Address Summary */}
              {selectedCustomer && selectedLocation && !useCustomAddress && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px 24px',
                  background: 'rgba(212,175,55,0.08)',
                  border: `1px solid ${theme.creamFaint}`,
                }}>
                  <div style={{
                    fontSize: '10px',
                    letterSpacing: '2px',
                    color: theme.gold,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}>
                    Shipping To: {selectedLocation.location_name}
                  </div>
                  <div style={{ fontSize: '14px', color: theme.creamDim, lineHeight: 1.6 }}>
                    {address1 && <div>{address1}</div>}
                    {address2 && <div>{address2}</div>}
                    <div>{[city, state, postalCode].filter(Boolean).join(', ')}</div>
                    {country && <div>{country}</div>}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION III: TRADE SHOW
          ═══════════════════════════════════════════════════════════════════ */}
          {(selectedCustomer || isNewCustomer) && (
            <section style={{ marginBottom: '60px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  fontSize: '10px',
                  letterSpacing: '4px',
                  color: theme.gold,
                  marginBottom: '16px',
                }}>— III —</div>
                <div style={{
                  fontSize: '12px',
                  letterSpacing: '3px',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                }}>Trade Show</div>
              </div>

              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Event Name</label>
                    <input
                      type="text"
                      value={tradeShowName}
                      onChange={(e) => setTradeShowName(e.target.value)}
                      placeholder="e.g., Magic Las Vegas 2025"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Requested Ship Date</label>
                    <input
                      type="date"
                      value={shipDate}
                      onChange={(e) => setShipDate(e.target.value)}
                      style={{
                        ...inputStyle,
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions or notes..."
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: '100px',
                    }}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SUBMIT BUTTON
          ═══════════════════════════════════════════════════════════════════ */}
          {(selectedCustomer || isNewCustomer) && (
            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '20px 64px',
                  background: isSubmitting ? theme.goldDim : theme.gold,
                  border: 'none',
                  color: theme.navy,
                  fontSize: '13px',
                  letterSpacing: '4px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease',
                  boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(212, 175, 55, 0.3)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(212, 175, 55, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isSubmitting ? 'none' : '0 4px 20px rgba(212, 175, 55, 0.3)';
                }}
              >
                {isSubmitting ? '◌ Creating Portal...' : 'Continue to Products →'}
              </button>
            </div>
          )}
        </form>
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
