'use client';

import { useState, useEffect, useRef } from 'react';

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
    
    // Auto-fill customer info fields
    setCustomerName(customer.customer_name || '');
    setCustomerEmail(customer.email || '');
    setCustomerPhone(customer.phone || '');
    
    // Clear address fields initially - will be filled by location selection
    setAddress1('');
    setAddress2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('USA');
    
    setCustomerSearchQuery('');
    setShowDropdown(false);
    
    // Fetch locations for this customer
    setLoadingLocations(true);
    setCustomerLocations([]);
    setSelectedLocation(null);
    
    try {
      const response = await fetch(`/api/customers/locations?customer_id=${customer.id}`);
      const data = await response.json();
      
      if (data.success && data.locations.length > 0) {
        setCustomerLocations(data.locations);
        
        // Auto-select main location or first location
        const mainLocation = data.locations.find((loc: Location) => loc.is_main_location);
        const defaultLocation = mainLocation || data.locations[0];
        
        if (defaultLocation) {
          selectLocation(defaultLocation);
        }
      } else {
        // No locations found - use customer's main address
        setAddress1(customer.address_1 || '');
        setAddress2(customer.address_2 || '');
        setCity(customer.city || '');
        setState(customer.state || '');
        setPostalCode(customer.postal_code || '');
        setCountry(customer.country || 'USA');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fall back to customer's main address
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
  
  // Select a location and fill address fields
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
  
  // Switch to custom address entry
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
  
  // Create new customer mode
  function startNewCustomer() {
    setSelectedCustomer(null);
    setIsNewCustomer(true);
    setCustomerLocations([]);
    setSelectedLocation(null);
    setUseCustomAddress(true);
    
    // Use the search query as the initial customer name
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
  
  // Clear customer selection
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
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!customerName.trim()) {
      alert('Please enter a customer name');
      return;
    }
    
    // TODO: Implement portal creation API call
    alert('Portal creation coming soon! Customer: ' + customerName);
  }
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>Create New Portal</h1>
          <a href="/admin" style={{ padding: '10px 20px', background: '#6b7280', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Dashboard
          </a>
        </div>
      </div>
      
      {/* Form Container */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
        <form onSubmit={handleSubmit}>
          {/* Customer Search Section */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👤 Customer Information
            </h2>
            
            {/* Customer Search / Selection */}
            {!selectedCustomer && !isNewCustomer ? (
              <div ref={searchRef} style={{ position: 'relative', marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Search Existing Customer
                </label>
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Type customer name to search..."
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    color: '#000000',
                    backgroundColor: '#ffffff'
                  }}
                  onFocus={() => customerSearchQuery.length >= 2 && setShowDropdown(true)}
                />
                
                {/* Loading indicator */}
                {isSearching && (
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
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
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {customerResults.length > 0 ? (
                      <>
                        {customerResults.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => selectCustomer(customer)}
                            style={{
                              padding: '14px 16px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'background 0.1s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ fontWeight: '600', color: '#111827' }}>{customer.customer_name}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                              {[customer.email, customer.phone, customer.city].filter(Boolean).join(' • ')}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div style={{ padding: '14px 16px', color: '#6b7280', textAlign: 'center' }}>
                        No customers found for "{customerSearchQuery}"
                      </div>
                    )}
                    
                    {/* Create New Customer Option */}
                    <div
                      onClick={startNewCustomer}
                      style={{
                        padding: '14px 16px',
                        cursor: 'pointer',
                        background: '#f0fdf4',
                        borderTop: '2px solid #10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600',
                        color: '#059669'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dcfce7'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f0fdf4'}
                    >
                      <span style={{ fontSize: '18px' }}>➕</span>
                      Create New Customer{customerSearchQuery ? `: "${customerSearchQuery}"` : ''}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Selected Customer or New Customer Mode */
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: selectedCustomer ? '#eff6ff' : '#f0fdf4',
                  border: `2px solid ${selectedCustomer ? '#3b82f6' : '#10b981'}`,
                  borderRadius: '10px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#111827', fontSize: '16px' }}>
                      {selectedCustomer ? '✓ Existing Customer Selected' : '✨ Creating New Customer'}
                    </div>
                    {selectedCustomer && (
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                        {selectedCustomer.customer_name}
                        {selectedCustomer.am_customer_id && ` (ID: ${selectedCustomer.am_customer_id})`}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearCustomerSelection}
                    style={{
                      padding: '8px 16px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
            
            {/* Customer Detail Fields */}
            {(selectedCustomer || isNewCustomer) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Customer Name */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#000000',
                      backgroundColor: selectedCustomer ? '#f9fafb' : '#ffffff'
                    }}
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#000000',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                
                {/* Phone */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#000000',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Shipping Address Section */}
          {(selectedCustomer || isNewCustomer) && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📦 Shipping Address
              </h2>
              
              {/* Location Selector - Only show for existing customers with locations */}
              {selectedCustomer && customerLocations.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Select Shipping Location
                  </label>
                  
                  {loadingLocations ? (
                    <div style={{ padding: '14px 16px', color: '#6b7280' }}>Loading locations...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {customerLocations.map((location) => (
                        <div
                          key={location.id}
                          onClick={() => selectLocation(location)}
                          style={{
                            padding: '14px 16px',
                            border: `2px solid ${selectedLocation?.id === location.id ? '#3b82f6' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            background: selectedLocation?.id === location.id ? '#eff6ff' : '#ffffff',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                                {location.location_name}
                                {location.is_main_location && (
                                  <span style={{ marginLeft: '8px', fontSize: '12px', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
                                    Main
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                                {[location.address_1, location.city, location.state, location.postal_code].filter(Boolean).join(', ')}
                              </div>
                            </div>
                            {selectedLocation?.id === location.id && (
                              <div style={{ color: '#3b82f6', fontSize: '20px' }}>✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Option to enter custom address */}
                      <div
                        onClick={enableCustomAddress}
                        style={{
                          padding: '14px 16px',
                          border: `2px solid ${useCustomAddress ? '#10b981' : '#e5e7eb'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          background: useCustomAddress ? '#f0fdf4' : '#ffffff',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: useCustomAddress ? '#059669' : '#111827' }}>
                              ➕ Enter Different Address
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>
                              Ship to a new address not listed above
                            </div>
                          </div>
                          {useCustomAddress && (
                            <div style={{ color: '#10b981', fontSize: '20px' }}>✓</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Address Fields - Always editable for new customers, or when custom address is selected */}
              {(isNewCustomer || useCustomAddress || customerLocations.length === 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Address Line 1 */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      placeholder="Street address"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  
                  {/* Address Line 2 */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      placeholder="Suite, unit, building, floor, etc."
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  
                  {/* City */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  
                  {/* State */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  
                  {/* Postal Code */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="ZIP / Postal code"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  
                  {/* Country */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Show selected address summary when a location is selected */}
              {selectedCustomer && selectedLocation && !useCustomAddress && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  background: '#f9fafb', 
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    Shipping to: {selectedLocation.location_name}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {address1 && <div>{address1}</div>}
                    {address2 && <div>{address2}</div>}
                    <div>{[city, state, postalCode].filter(Boolean).join(', ')}</div>
                    {country && <div>{country}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Trade Show & Notes Section */}
          {(selectedCustomer || isNewCustomer) && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎪 Trade Show Details
              </h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Trade Show Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Trade Show Name
                  </label>
                  <input
                    type="text"
                    value={tradeShowName}
                    onChange={(e) => setTradeShowName(e.target.value)}
                    placeholder="e.g., Magic Las Vegas 2025"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      color: '#000000',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions or notes about this order..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      color: '#000000',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          {(selectedCustomer || isNewCustomer) && (
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '18px 32px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                transition: 'transform 0.1s, box-shadow 0.1s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }}
            >
              Continue to Add Products →
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
