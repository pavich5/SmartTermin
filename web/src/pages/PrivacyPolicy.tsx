import React from 'react';
import { Shield } from 'lucide-react';
import { PolicyHeader } from '../components/legal/PolicyHeader';
import { useTranslation } from '../hooks/useTranslation';

export function PrivacyPolicy() {
  const { t } = useTranslation();

  const userDataItems = [
    'privacy.section4.userData.name',
    'privacy.section4.userData.email',
    'privacy.section4.userData.phone',
    'privacy.section4.userData.businessName',
    'privacy.section4.userData.services',
  ] as const;

  const clientDataItems = [
    'privacy.section4.clientData.name',
    'privacy.section4.clientData.phone',
    'privacy.section4.clientData.email',
    'privacy.section4.clientData.booking',
  ] as const;

  const technicalDataItems = [
    'privacy.section4.technicalData.ip',
    'privacy.section4.technicalData.device',
    'privacy.section4.technicalData.cookies',
  ] as const;

  const collectionMethods = [
    'privacy.section5.method1',
    'privacy.section5.method2',
    'privacy.section5.method3',
  ] as const;

  const processingPurposes = [
    'privacy.section6.purpose1',
    'privacy.section6.purpose2',
    'privacy.section6.purpose3',
    'privacy.section6.purpose4',
    'privacy.section6.purpose5',
  ] as const;

  const legalBasis = [
    'privacy.section7.basis1',
    'privacy.section7.basis2',
    'privacy.section7.basis3',
    'privacy.section7.basis4',
  ] as const;

  const dataRights = [
    'privacy.section10.right1',
    'privacy.section10.right2',
    'privacy.section10.right3',
    'privacy.section10.right4',
    'privacy.section10.right5',
  ] as const;

  return (
    <div className="min-h-screen bg-white">
      <PolicyHeader
        icon={Shield}
        title={t('legal.privacy.title')}
        iconBg="bg-sky-100"
        iconColor="text-sky-600"
      />

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {/* Section I */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section1.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section1.greeting')}</p>
              <p className="text-gray-600 mb-4">{t('privacy.section1.readNotice')}</p>
              <p className="text-gray-600 mb-4">{t('privacy.section1.acceptance')}</p>
              <p className="text-gray-600 mb-4">{t('privacy.section1.description')}</p>
              <p className="text-gray-600 mb-4">{t('privacy.section1.respect')}</p>
              <p className="text-gray-600 mb-4">{t('privacy.section1.compliance')}</p>
              <div className="mt-4 space-y-2">
                <p className="text-gray-600">
                  <strong>{t('privacy.section1.contactPrivacy')}</strong>
                </p>
                <p className="text-gray-600">
                  📧{' '}
                  <a href="mailto:privacy@smarttermin.com" className="text-sky-600 hover:text-sky-700">
                    privacy@smarttermin.com
                  </a>
                </p>
                <p className="text-gray-600">
                  <strong>{t('privacy.section1.contactSupport')}</strong>
                </p>
                <p className="text-gray-600">
                  📧{' '}
                  <a href="mailto:support@smartermin.com" className="text-sky-600 hover:text-sky-700">
                    support@smartermin.com
                  </a>
                </p>
              </div>
            </div>

            {/* Section II */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section2.title')}
              </h2>
              <p className="text-gray-600 mb-2">
                <strong>{t('privacy.section2.personalData')}</strong> {t('privacy.section2.personalDataDef')}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>{t('privacy.section2.processing')}</strong> {t('privacy.section2.processingDef')}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>{t('privacy.section2.controller')}</strong> {t('privacy.section2.controllerDef')}
              </p>
              <p className="text-gray-600">
                <strong>{t('privacy.section2.user')}</strong> {t('privacy.section2.userDef')}
              </p>
            </div>

            {/* Section III */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section3.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section3.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>{t('privacy.section3.principle1')}</li>
                <li>{t('privacy.section3.principle2')}</li>
                <li>{t('privacy.section3.principle3')}</li>
                <li>{t('privacy.section3.principle4')}</li>
                <li>{t('privacy.section3.principle5')}</li>
                <li>{t('privacy.section3.principle6')}</li>
              </ul>
            </div>

            {/* Section IV */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section4.title')}
              </h2>
              <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
                {t('privacy.section4.userDataTitle')}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {userDataItems.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
                {t('privacy.section4.clientDataTitle')}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {clientDataItems.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>

              <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-3">
                {t('privacy.section4.technicalDataTitle')}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {technicalDataItems.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section V */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section5.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section5.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {collectionMethods.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section VI */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section6.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section6.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {processingPurposes.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section VII */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section7.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section7.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {legalBasis.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section VIII */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section8.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section8.intro')}</p>
              <p className="text-gray-600">{t('privacy.section8.noSale')}</p>
            </div>

            {/* Section IX */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section9.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section9.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>{t('privacy.section9.retention1')}</li>
                <li>{t('privacy.section9.retention2')}</li>
                <li>{t('privacy.section9.retention3')}</li>
              </ul>
            </div>

            {/* Section X */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section10.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('privacy.section10.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {dataRights.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-gray-600">
                {t('privacy.section10.contact')}{' '}
                <a href="mailto:privacy@smarttermin.com" className="text-sky-600 hover:text-sky-700">
                  📧 privacy@smarttermin.com
                </a>
              </p>
            </div>

            {/* Section XI */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section11.title')}
              </h2>
              <p className="text-gray-600">{t('privacy.section11.body')}</p>
            </div>

            {/* Section XII */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section12.title')}
              </h2>
              <p className="text-gray-600">{t('privacy.section12.body')}</p>
            </div>

            {/* Section XIII */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('privacy.section13.title')}
              </h2>
              <p className="text-gray-600">{t('privacy.section13.body')}</p>
            </div>

            {/* Contact Section */}
            <div className="mb-12 bg-blue-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacy.contact.title')}</h2>
              <div className="space-y-2 text-gray-600">
                <p>
                  📧{' '}
                  <a href="mailto:privacy@smarttermin.com" className="text-sky-600 hover:text-sky-700">
                    privacy@smarttermin.com
                  </a>
                </p>
                <p>
                  📧{' '}
                  <a href="mailto:support@smarttermin.com" className="text-sky-600 hover:text-sky-700">
                    support@smarttermin.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
