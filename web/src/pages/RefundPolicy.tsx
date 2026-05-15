import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PolicyHeader } from '../components/legal/PolicyHeader';
import { useTranslation } from '../hooks/useTranslation';

export function RefundPolicy() {
  const { t } = useTranslation();

  const generalPrinciples = [
    'refund.section1.principle1',
    'refund.section1.principle2',
  ] as const;

  const refundConditions = [
    'refund.section2.condition1',
    'refund.section2.condition2',
    'refund.section2.condition3',
    'refund.section2.condition4',
  ] as const;

  const refundSteps = [
    'refund.section3.step1',
    'refund.section3.step2',
    'refund.section3.step3',
  ] as const;

  const nonRefundableItems = [
    'refund.section4.item1',
    'refund.section4.item2',
    'refund.section4.item3',
    'refund.section4.item4',
    'refund.section4.item5',
  ] as const;

  return (
    <div className="min-h-screen bg-white">
      <PolicyHeader
        icon={RefreshCw}
        title={t('legal.refund.title')}
        iconBg="bg-green-100"
        iconColor="text-green-600"
      />

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="mb-12">
              <p className="text-gray-600 mb-4">{t('refund.intro.lastUpdated')}</p>
              <p className="text-gray-600 mb-4">{t('refund.intro.body1')}</p>
              <p className="text-gray-600 mb-4">{t('refund.intro.body2')}</p>
            </div>

            {/* Section I - General Principles */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('refund.section1.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('refund.section1.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {generalPrinciples.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section II - Right to Refund */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('refund.section2.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('refund.section2.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {refundConditions.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-gray-600 mt-4">{t('refund.section2.note')}</p>
            </div>

            {/* Section III - Procedure for Submitting Request */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('refund.section3.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('refund.section3.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {refundSteps.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-gray-600 mt-4">{t('refund.section3.processing')}</p>
            </div>

            {/* Section IV - Cases Usually Not Eligible for Refund */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('refund.section4.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('refund.section4.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {nonRefundableItems.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section V - Refund Transactions and Disputes */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('refund.section5.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('refund.section5.body')}</p>
              <p className="text-gray-600">{t('refund.section5.encouragement')}</p>
            </div>

            {/* Section VI - Legal Rights */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('refund.section6.title')}
              </h2>
              <p className="text-gray-600">{t('refund.section6.body')}</p>
            </div>

            {/* Section VII - Changes to Policy */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('refund.section7.title')}
              </h2>
              <p className="text-gray-600">{t('refund.section7.body')}</p>
            </div>

            {/* Section VIII - Contact */}
            <div className="mb-12 bg-blue-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('refund.section8.title')}
              </h2>
              <div className="space-y-2 text-gray-600">
                <p>{t('refund.section8.questions')}</p>
                <p>
                  <a href={`mailto:support@smartermin.com`} className="text-sky-600 hover:text-sky-700">
                    {t('refund.section8.email')}
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

