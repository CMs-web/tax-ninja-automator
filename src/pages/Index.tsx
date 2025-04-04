
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  // Check if user is already logged in
  const isLoggedIn = localStorage.getItem("isAuthenticated") === "true";

  // If logged in, redirect to dashboard
  React.useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <header className="bg-gradient-to-r from-gst-primary to-gst-secondary text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Simplify Your GST Filing With Tax Ninja
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Automate invoice processing, GST calculation, and tax filing. Save time and ensure compliance with our easy-to-use platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-white text-gst-primary hover:bg-gray-100 text-lg px-8 py-6" 
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://via.placeholder.com/600x400?text=GST+Filing+Made+Easy" 
                alt="GST Filing Made Easy" 
                className="rounded-lg shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gst-primary mb-4">Why Choose Tax Ninja?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform offers a complete solution for GST compliance, designed to save you time and eliminate errors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gst-light rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gst-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gst-primary">Automated Invoice Processing</h3>
              <p className="text-gray-600">
                Upload invoices in any format. Our OCR technology extracts all relevant GST data automatically.
              </p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gst-light rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gst-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gst-primary">One-Click GST Filing</h3>
              <p className="text-gray-600">
                Generate GSTR-1 and GSTR-3B returns with a single click. Submit directly to the GST portal.
              </p>
            </div>

            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gst-light rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gst-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gst-primary">Never Miss Deadlines</h3>
              <p className="text-gray-600">
                Get timely reminders for GST filing and payments. Avoid penalties with our smart notification system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gst-primary mb-4">Trusted by Businesses</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See what our customers say about Tax Ninja GST filing solution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gst-light rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-gst-secondary">RS</span>
                </div>
                <div>
                  <h4 className="font-semibold">Rajesh Sharma</h4>
                  <p className="text-sm text-gray-500">Small Business Owner</p>
                </div>
              </div>
              <p className="text-gray-600">
                "Tax Ninja has transformed how I handle GST. I used to spend days on filing returns, now it takes just minutes!"
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gst-light rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-gst-secondary">AP</span>
                </div>
                <div>
                  <h4 className="font-semibold">Anita Patel</h4>
                  <p className="text-sm text-gray-500">Chartered Accountant</p>
                </div>
              </div>
              <p className="text-gray-600">
                "As an accountant handling multiple businesses, Tax Ninja has been a game-changer for my practice. The automation is top-notch."
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gst-light rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold text-gst-secondary">VK</span>
                </div>
                <div>
                  <h4 className="font-semibold">Vikram Kumar</h4>
                  <p className="text-sm text-gray-500">E-commerce Seller</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The invoice extraction feature is amazing! It reads all my marketplace invoices accurately, saving me hours of data entry."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-r from-gst-secondary to-gst-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Simplify Your GST Filing?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of businesses that trust Tax Ninja for their GST compliance needs.
          </p>
          <Button 
            className="bg-white text-gst-primary hover:bg-gray-100 text-lg px-8 py-6" 
            onClick={() => navigate("/register")}
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Tax Ninja</h3>
              <p className="text-gray-300">
                Simplifying GST compliance for businesses across India.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">FAQs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white">GST Articles</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Calculator</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white">Guides</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-300">support@taxninja.com</li>
                <li className="text-gray-300">+91 1234567890</li>
              </ul>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-300">
            <p>&copy; 2025 Tax Ninja. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
