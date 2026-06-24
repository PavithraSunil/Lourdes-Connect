import React, { useState } from 'react';
import { Award, Search, Download, Printer, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

export const CertificateClaim = ({ setToast, navigate }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [svgContent, setSvgContent] = useState(null);
  const [error, setError] = useState(null);
  const [notCheckedIn, setNotCheckedIn] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 8) {
      setError('Please enter a valid 8-character code.');
      return;
    }

    setLoading(true);
    setError(null);
    setSvgContent(null);
    setNotCheckedIn(false);

    try {
      const cleanCode = code.toUpperCase().trim();
      
      // Fetch SVG content directly
      const token = localStorage.getItem('admin_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/certificates/${cleanCode}`, {
        headers,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setNotCheckedIn(true);
          throw new Error(errData.error || 'You must check in to the event before claiming your certificate.');
        }
        throw new Error(errData.error || 'Certificate not found. Please verify your code.');
      }

      const svgText = await res.text();
      setSvgContent(svgText);
      setToast({ message: 'Certificate retrieved successfully!', type: 'success' });
    } catch (err) {
      console.error('Certificate fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_${code.toUpperCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'Certificate downloaded!', type: 'success' });
  };

  const handlePrint = () => {
    if (!svgContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setToast({ message: 'Popup blocked. Please allow popups to print.', type: 'error' });
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Certificate - ${code.toUpperCase()}</title>
          <style>
            body { 
              margin: 0; 
              padding: 0;
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              background-color: #ffffff; 
            }
            svg { 
              width: 100%; 
              height: auto; 
              max-width: 100vw; 
              max-height: 100vh; 
            }
            @page { 
              size: landscape; 
              margin: 0; 
            }
          </style>
        </head>
        <body>
          ${svgContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '3rem auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Claim Your Certificate</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter your 8-digit attendance code below to generate and download your official certificate.
        </p>
      </div>

      {!svgContent ? (
        /* Step 1: Input Code */
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={handleLookup}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                ENTER CODE TO GENERATE CERTIFICATE
              </label>
              
              <input
                type="text"
                className="form-input"
                maxLength={8}
                placeholder="e.g. A2B3C4D5"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                style={{
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: '2rem',
                  letterSpacing: '6px',
                  padding: '1rem',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  borderWidth: '2px',
                  borderColor: error ? 'var(--danger)' : 'var(--border-light)',
                }}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--danger)',
                  fontSize: '0.9rem',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  animation: 'shake 0.3s ease-in-out',
                }}
              >
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {notCheckedIn && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/checkin')}
                  style={{ gap: '8px', fontSize: '0.85rem' }}
                >
                  Go to Check-In Page
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px' }}
              disabled={loading}
            >
              {loading ? (
                'Fetching Certificate...'
              ) : (
                <>
                  <Award size={18} />
                  Claim Certificate
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Step 2: Show Certificate Preview & Downloads */
        <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
          
          <button
            onClick={() => {
              setSvgContent(null);
              setCode('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-accent)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <ArrowLeft size={14} /> Look Up Another Code
          </button>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Your Certificate Preview
          </h3>

          {/* Certificate Preview Wrapper */}
          <div
            style={{
              background: '#0e0e11',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              marginBottom: '2rem',
              boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: svgContent }}
              style={{
                width: '100%',
                maxWidth: '650px',
                height: 'auto',
                aspectRatio: '800/600',
              }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
            }}
          >
            <button className="btn btn-primary" onClick={handleDownload} style={{ padding: '0.8rem 2rem' }}>
              <Download size={18} />
              Download Vector (SVG)
            </button>
            
            <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '0.8rem 2rem' }}>
              <Printer size={18} />
              Print / Save PDF
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default CertificateClaim;
