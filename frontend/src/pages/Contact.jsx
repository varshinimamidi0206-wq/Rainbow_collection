import React from 'react';
import { Phone, MapPin, MessageSquare } from 'lucide-react';

const Instagram = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function Contact() {
  const KADAPA_PHONE = '8247224824';
  const KAKINADA_PHONE = '7676679224';
  const WHATSAPP_PHONE = '8919590533';

  return (
    <div className="contact-container" style={{ animation: 'fadeInUp 0.3s ease-out', padding: '20px 16px', background: '#FAF8F6', minHeight: '80vh' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Quicksand', fontSize: '22px', fontWeight: '800', color: 'var(--primary-pink)' }}>
          Contact Us
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Visit our showrooms or get in touch online
        </p>
      </div>

      {/* Showroom 1: Kadapa */}
      <div className="contact-card" style={{ padding: '16px', borderRadius: '18px', marginBottom: '16px' }}>
        <h4 className="branch-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span>📍</span> Kadapa Showroom
        </h4>
        <p className="branch-address" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
          YV Street, Ganagapeta, Kadapa, Andhra Pradesh 516001
        </p>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href={`tel:${KADAPA_PHONE}`} 
            className="contact-social-btn phone"
            style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <Phone size={16} /> Call Showroom
          </a>
          <a 
            href="https://maps.google.com/?q=YV+Street,+Ganagapeta,+Kadapa,+Andhra+Pradesh+516001" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="contact-social-btn maps"
            style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <MapPin size={16} /> Google Maps
          </a>
        </div>
      </div>

      {/* Showroom 2: Kakinada */}
      <div className="contact-card" style={{ padding: '16px', borderRadius: '18px', marginBottom: '16px' }}>
        <h4 className="branch-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <span>📍</span> Kakinada Showroom
        </h4>
        <p className="branch-address" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
          Main Market Area Showroom, Kakinada, Andhra Pradesh 533001
        </p>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href={`tel:${KAKINADA_PHONE}`} 
            className="contact-social-btn phone"
            style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <Phone size={16} /> Call Showroom
          </a>
          <a 
            href="https://maps.google.com/?q=Kakinada,+Andhra+Pradesh+533001" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="contact-social-btn maps"
            style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <MapPin size={16} /> Google Maps
          </a>
        </div>
      </div>

      {/* Social & Chat Support */}
      <div className="contact-card" style={{ padding: '16px', borderRadius: '18px', marginBottom: '16px' }}>
        <h4 className="contact-card-title" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-pink)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <span>💬</span> Social & Chat Support
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="contact-social-btn instagram"
            style={{ minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <Instagram size={18} /> Follow on Instagram
          </a>

          <a 
            href={`https://wa.me/91${WHATSAPP_PHONE}?text=Hi,%20I%20am%20interested%20in%20Rainbow%20Collection%20jewellery!`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="contact-social-btn whatsapp"
            style={{ minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <MessageSquare size={18} /> Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Specialty Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--light-pink), #FFF)',
        border: '1.5px solid var(--border-color)',
        borderRadius: '18px',
        padding: '16px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', marginBottom: '6px' }}>
          OUR JEWELLERY SPECIALITIES
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-dark)', fontWeight: '600', lineHeight: '1.6' }}>
          💍 1 GM Gold Jewellery &nbsp;•&nbsp; 💍 Gold Plated Bangles<br />
          🎀 Premium Hair Accessories &nbsp;•&nbsp; 💄 Cosmetics & Makeup<br />
          🪙 Traditional German Silver &nbsp;•&nbsp; 👑 Grand Bridal Rental Sets
        </p>
      </div>

    </div>
  );
}
