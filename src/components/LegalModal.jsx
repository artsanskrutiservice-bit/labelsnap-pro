import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText, Mail, Send } from 'lucide-react';

export default function LegalModal({ isOpen, onClose, initialTab = 'privacy', darkMode = false }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formStatus, setFormStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFormStatus('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormStatus('Thank you for reaching out! We will get back to you shortly.');
    e.target.reset();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className={`relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${
        darkMode ? 'bg-[#0f172a] border border-slate-800 text-slate-200' : 'bg-white border border-slate-200 text-slate-800'
      }`}>
        
        {/* Header & Tabs */}
        <div className={`shrink-0 border-b ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center justify-between p-4 sm:px-6">
            <h2 className="text-lg font-black flex items-center gap-2">
              <ShieldCheck className="text-blue-500" size={20} />
              Legal &amp; Compliance
            </h2>
            <button 
              onClick={onClose}
              className={`p-2 rounded-xl transition ${
                darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex px-4 sm:px-6 gap-6 text-sm font-semibold overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <ShieldCheck size={16} />
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <FileText size={16} />
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'contact'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Mail size={16} />
              Contact Us
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-sm leading-relaxed space-y-4">
          
          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
              <section>
                <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>1. 100% Client-Side Processing</h3>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  At MyPDFClub, your privacy and data security are our top priority. We explicitly clarify that <strong>all PDF processing, cropping, merging, and editing is executed 100% locally in your web browser</strong> using WebAssembly, Canvas, and pdf-lib. 
                </p>
                <p className={`mt-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <strong>Zero files or user data are ever uploaded, processed, or stored on our external servers.</strong> Your shipping labels and sensitive customer data never leave your device.
                </p>
              </section>

              <section>
                <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>2. Google AdSense & Analytics Cookies</h3>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  To keep our utility software free, we use Google AdSense to display advertisements and Google Analytics (GA4) to measure website traffic. These third-party services use standard cookies to serve ads based on your prior visits to our website or other websites.
                </p>
                <ul className={`list-disc pl-5 mt-2 space-y-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
                  <li>Users may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Ads Settings</a>.</li>
                </ul>
              </section>

              <section>
                <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>3. Data Collection</h3>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  We do not collect personally identifiable information (PII) unless you explicitly provide it via our Contact Us form (e.g., your email address for support purposes). Any data collected via contact forms is used solely for customer support.
                </p>
              </section>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
              <section>
                <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>1. Acceptance of Terms</h3>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  By accessing and using MyPDFClub, you accept and agree to be bound by the terms and provision of this agreement. Our tools are provided as free utility software.
                </p>
              </section>

              <section>
                <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>2. Zero Liability Disclaimer</h3>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  Our service is provided on an "as-is" and "as-available" basis. <strong>MyPDFClub and its developers bear zero liability for any issues arising from e-commerce courier label dispatches, printing errors, marketplace penalties, or misrouted packages.</strong> It is the seller's sole responsibility to verify the accuracy, readability, and scannability of the cropped labels before dispatching shipments.
                </p>
              </section>

              <section>
                <h3 className={`text-base font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>3. Fair Usage</h3>
                <p className={darkMode ? 'text-slate-300' : 'text-slate-600'}>
                  While our tools execute locally, we ask users not to attempt to reverse engineer, abuse, or maliciously distribute our proprietary processing algorithms. We reserve the right to modify or terminate the service for any reason, without notice, at any time.
                </p>
              </section>
            </div>
          )}

          {/* CONTACT US */}
          {activeTab === 'contact' && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-2 duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="font-bold mb-1">Developer Email</h3>
                  <a href="mailto:dhruvusadadiya321@gmail.com" className="text-blue-500 hover:underline">
                    dhruvusadadiya321@gmail.com
                  </a>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <h3 className="font-bold mb-1">Location</h3>
                  <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Surat, Gujarat, India
                  </p>
                </div>
              </div>

              <form onSubmit={handleContactSubmit} className={`p-5 rounded-2xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className="font-bold mb-4">Send Feedback or Support Request</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your Name</label>
                    <input 
                      required
                      type="text" 
                      className={`w-full px-3 py-2 text-sm rounded-lg border outline-none transition ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500' : 'bg-white border-slate-300 focus:border-blue-500'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Your Email</label>
                    <input 
                      required
                      type="email" 
                      className={`w-full px-3 py-2 text-sm rounded-lg border outline-none transition ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500' : 'bg-white border-slate-300 focus:border-blue-500'
                      }`}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Message</label>
                    <textarea 
                      required
                      rows={4}
                      className={`w-full px-3 py-2 text-sm rounded-lg border outline-none transition resize-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500' : 'bg-white border-slate-300 focus:border-blue-500'
                      }`}
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Send size={16} />
                    Send Message
                  </button>

                  {formStatus && (
                    <div className="mt-2 text-center text-sm font-semibold text-emerald-500">
                      {formStatus}
                    </div>
                  )}
                </div>
              </form>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
