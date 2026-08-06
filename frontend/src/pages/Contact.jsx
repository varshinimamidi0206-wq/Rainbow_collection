import React from 'react';
import { Phone, MapPin, MessageSquare } from 'lucide-react';

const InstagramIcon = ({ size = 24 }) => (
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
    <div className="contact-container" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontFamily: 'Quicksand', fontSize: '24px', fontWeight: '700', color: 'var(--primary-pink)' }}>
          Contact Us
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Get in touch or visit our retail jewellery showrooms
        </p>
      </div>

      {/* Social channels card */}
      <div className="contact-card">
        <h3 className="contact-card-title">
          <InstagramIcon size={18} /> Social & Chat Support
        </h3>
        
        {/* Instagram button */}
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="contact-social-btn instagram"
        >
          <InstagramIcon size={20} /> Rainbow Collection India
        </a>


        {/* WhatsApp button */}
        <a 
          href={`https://wa.me/91${WHATSAPP_PHONE}?text=Hi,%20I%20am%20interested%20in%20Rainbow%20Collection%20jewellery!`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="contact-social-btn whatsapp"
        >
          <MessageSquare size={20} /> Chat on WhatsApp
        </a>
      </div>

      {/* Branches header */}
      <h3 style={{ fontFamily: 'Quicksand', fontSize: '18px', fontWeight: '700', marginTop: '8px' }}>
        📍 Our Branches
      </h3>

      {/* Kadapa Branch */}
      <div className="contact-card">
        <h4 className="branch-title">
          Showroom 1: Kadapa
        </h4>
        <p className="branch-address">
          YV Street, Ganagapeta,<br />
          Kadapa, Andhra Pradesh 516001
        </p>
        
        <a href={`tel:${KADAPA_PHONE}`} className="contact-social-btn phone">
          <Phone size={18} /> Call {KADAPA_PHONE}
        </a>

        <a 
          href="https://maps.google.com/?q=YV+Street,+Ganagapeta,+Kadapa,+Andhra+Pradesh+516001" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="contact-social-btn maps"
        >
          <MapPin size={18} /> View on Google Maps
        </a>
      </div>

      {/* Kakinada Showroom */}
      <div className="contact-card">
        <h4 className="branch-title">
          Showroom 2: Kakinada
        </h4>
        <p className="branch-address">
          Main Market Area Showroom,<br />
          Kakinada, Andhra Pradesh 533001
        </p>
        
        <a href={`tel:${KAKINADA_PHONE}`} className="contact-social-btn phone">
          <Phone size={18} /> Call {KAKINADA_PHONE}
        </a>

        <a 
          href="https://maps.google.com/?q=Kakinada,+Andhra+Pradesh+533001" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="contact-social-btn maps"
        >
          <MapPin size={18} /> View on Google Maps
        </a>
      </div>

      {/* Business Description Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--light-pink), #FFF)',
        border: '1.5px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '14px', letterSpacing: '1px', marginBottom: '8px' }}>
          SPECIALITIES AVAILABLE
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600', lineHeight: '1.6' }}>
          💍 1 GM Gold Jewellery<br />
          💍 Gold Plated Bangles<br />
          🎀 Premium Hair Accessories<br />
          💄 Cosmetics & Makeup<br />
          🪙 Traditional German Silver<br />
          👑 Grand Rental Bridal Sets
        </p>
      </div>
    </div>
  );
}
