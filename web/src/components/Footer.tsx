import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center">
                <span className="text-white">{t('brand.initial')}</span>
              </div>
              <span className="tracking-tight">{t('brand.name')}</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{t('footer.tagline')}</p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-sky-600 transition-colors border border-gray-200"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-sky-600 transition-colors border border-gray-200"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-sky-600 transition-colors border border-gray-200"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-sky-600 transition-colors border border-gray-200"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-gray-900">{t('footer.product')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/features"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('nav.features')}
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('nav.pricing')}
                </Link>
              </li>
              <li>
                <Link
                  to="/directory"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('nav.artists')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-gray-900">{t('footer.company')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-gray-900">{t('footer.legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('legal.privacy.title')}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('legal.terms.title')}
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="text-gray-600 hover:text-sky-600 transition-colors text-sm"
                >
                  {t('legal.refund.title')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
