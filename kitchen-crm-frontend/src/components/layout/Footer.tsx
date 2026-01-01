/**
 * Footer Component
 * App footer with copyright and links
 */

import { Link } from 'react-router-dom';

export interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-background-800 border-t-2 border-background-700 py-6 ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-text-600 text-sm">
            © {currentYear} HOCH. All rights reserved.
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/privacy"
              className="text-text-600 hover:text-text-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-text-600 hover:text-text-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/support"
              className="text-text-600 hover:text-text-900 transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
