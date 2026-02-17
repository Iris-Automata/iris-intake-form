import React, { useState, useEffect } from 'react'

// Get business slug from URL path: /jn-tailor or /?business=jn-tailor
function getBusinessSlug() {
  const path = window.location.pathname.slice(1) // Remove leading slash
  if (path && path !== '') return path
  
  const params = new URLSearchParams(window.location.search)
  return params.get('business')
}

// Your Supabase Edge Function URL
const SUPABASE_URL = 'https://bnytdgxgedktxlzyjbjp.supabase.co'
const SUBMIT_URL = `${SUPABASE_URL}/functions/v1/intake-submit`

const GARMENT_TYPES = ['Pants', 'Shirt', 'Dress', 'Suit', 'Jacket', 'Skirt', 'Coat', 'Other']
const SERVICE_TYPES = ['Hem', 'Taper', 'Repair', 'Shorten', 'Lengthen', 'Take In', 'Let Out', 'Zipper', 'Other']

export default function App() {
  const [businessSlug, setBusinessSlug] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    garment_type: '',
    custom_garment: '',
    service_type: '',
    custom_service: '',
    order_details: '',
    sms_consent: false
  })

  useEffect(() => {
    const slug = getBusinessSlug()
    if (slug) {
      setBusinessSlug(slug)
      fetchBusinessName(slug)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchBusinessName(slug) {
    try {
      // Fetch business name from Supabase
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/businesses?slug=eq.${slug}&select=name`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueXRkZ3hnZWRrdHhsenlqYmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTcwNTIsImV4cCI6MjA1MzA5MzA1Mn0.tOGR1v-Jkg0ORgvT1F_VaCA_gGPvNFcdaJXHKWY8S5c',
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        setBusinessName(data[0].name)
      }
    } catch (err) {
      console.error('Error fetching business:', err)
    }
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validate required fields
    if (!form.first_name || !form.last_name || !form.phone || !form.garment_type || !form.service_type) {
      setError('Please fill in all required fields')
      return
    }
    
    // Validate custom fields if "Other" is selected
    if (form.garment_type === 'Other' && !form.custom_garment.trim()) {
      setError('Please specify the garment type')
      return
    }
    if (form.service_type === 'Other' && !form.custom_service.trim()) {
      setError('Please specify the service type')
      return
    }

    setSubmitting(true)
    setError('')

    // Use custom values if "Other" is selected
    const finalGarmentType = form.garment_type === 'Other' ? form.custom_garment.trim() : form.garment_type
    const finalServiceType = form.service_type === 'Other' ? form.custom_service.trim() : form.service_type

    try {
      const response = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_slug: businessSlug,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          email: form.email,
          garment_type: finalGarmentType,
          service_type: finalServiceType,
          order_details: form.order_details,
          sms_consent: form.sms_consent
        })
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        setBusinessName(data.business_name)
      } else {
        setError(data.error || 'Failed to submit order')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }

    setSubmitting(false)
  }

  function resetForm() {
    setForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      garment_type: '',
      custom_garment: '',
      service_type: '',
      custom_service: '',
      order_details: '',
      sms_consent: false
    })
    setSubmitted(false)
    setError('')
  }

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    )
  }

  // No business slug provided
  if (!businessSlug) {
    return (
      <div className="container">
        <div className="not-found">
          <h1 className="not-found-title">No Business Selected</h1>
          <p className="not-found-message">Please use a valid intake form link provided by your tailor shop.</p>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted) {
    return (
      <div className="container">
        <div className="form-card">
          <div className="success-container">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="success-title">Order Submitted!</h1>
            <p className="success-message">
              Thank you! {businessName ? `${businessName} has` : 'The shop has'} received your order request and will review it shortly.
              <br /><br />
              You'll be contacted when your order is ready.
            </p>
            <button className="new-order-btn" onClick={resetForm}>
              Submit Another Order
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Form state
  return (
    <div className="container">
      <div className="header">
      <h1 className="business-name">{businessName || 'JN Tailor & Alterations'}<br /><span className="form-subtitle">Order Intake Form</span></h1>
        <p className="subtitle">Save time during your visit by completing this order intake form before coming into the shop.</p>
      </div>

      <div className="form-card">
        <h2 className="form-title">Your Information</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="form-group">
              <label className="label">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                className="input"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="label">
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                className="input"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              className="input"
              placeholder="(555) 123-4567"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="john@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <h2 className="form-title" style={{ marginTop: 24 }}>Order Details</h2>

          <div className="row">
            <div className="form-group">
              <label className="label">
                Garment Type <span className="required">*</span>
              </label>
              <select
                name="garment_type"
                className="select"
                value={form.garment_type}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {GARMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {form.garment_type === 'Other' && (
                <input
                  type="text"
                  name="custom_garment"
                  className="input"
                  style={{ marginTop: 8 }}
                  placeholder="Specify garment type..."
                  value={form.custom_garment}
                  onChange={handleChange}
                />
              )}
            </div>
            <div className="form-group">
              <label className="label">
                Service Type <span className="required">*</span>
              </label>
              <select
                name="service_type"
                className="select"
                value={form.service_type}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {SERVICE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {form.service_type === 'Other' && (
                <input
                  type="text"
                  name="custom_service"
                  className="input"
                  style={{ marginTop: 8 }}
                  placeholder="Specify service type..."
                  value={form.custom_service}
                  onChange={handleChange}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Additional Details</label>
            <textarea
              name="order_details"
              className="textarea"
              placeholder="Any specific instructions or measurements..."
              value={form.order_details}
              onChange={handleChange}
            />
          </div>

          {/* SMS Consent */}
          <div className="consent-group">
            <p className="consent-header">SMS Notifications <span className="optional">(optional)</span></p>
            <label className="consent-checkbox">
              <input
                type="checkbox"
                name="sms_consent"
                checked={form.sms_consent}
                onChange={(e) => setForm(prev => ({ ...prev, sms_consent: e.target.checked }))}
              />
              <span className="consent-text">
                Yes, I would like to receive SMS notifications about my order status from JN Tailor & Alterations. 
                Message and data rates may apply. Message frequency varies. 
                Reply STOP to unsubscribe or HELP for help. 
                View our <a href="https://irisautomata.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://irisautomata.com/terms-of-service/" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Order Request'}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <div className="footer">
      Powered by <a href="https://irisautomata.com" target="_blank" rel="noopener noreferrer">Iris Automata</a>
    </div>
  )
}
