import React from 'react';
import { Scale } from 'lucide-react';
import { PolicyHeader } from '../components/legal/PolicyHeader';
import { useTranslation } from '../hooks/useTranslation';

export function TermsOfService() {
  const { t } = useTranslation();

  const generalProvisionsItems = [
    'terms.section1.item1',
    'terms.section1.item2',
    'terms.section1.item3',
    'terms.section1.item4',
  ] as const;

  const platformUsers = [
    'terms.section1.user1',
    'terms.section1.user2',
  ] as const;

  const userObligations = [
    'terms.section3.obligation1',
    'terms.section3.obligation2',
    'terms.section3.obligation3',
  ] as const;

  const userCommitments = [
    'terms.section4.commitment1',
    'terms.section4.commitment2',
    'terms.section4.commitment3',
    'terms.section4.commitment4',
  ] as const;

  const relationshipPoints = [
    'terms.section5.point1',
    'terms.section5.point2',
    'terms.section5.point3',
  ] as const;

  const subscriptionSubsections = [
    'terms.section6.subsection1',
    'terms.section6.subsection2',
    'terms.section6.subsection3',
    'terms.section6.subsection4',
    'terms.section6.subsection5',
    'terms.section6.subsection6',
  ] as const;

  const liabilityPoints = [
    'terms.section8.point1',
    'terms.section8.point2',
    'terms.section8.point3',
  ] as const;

  const liabilityExclusions = [
    'terms.section8.exclusion1',
    'terms.section8.exclusion2',
    'terms.section8.exclusion3',
  ] as const;

  return (
    <div className="min-h-screen bg-white">
      <PolicyHeader
        icon={Scale}
        title={t('legal.terms.title')}
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
      />

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="mb-12">
              <p className="text-gray-600 mb-4">{t('terms.intro.lastUpdated')}</p>
              <p className="text-gray-600 mb-4">{t('terms.intro.body1')}</p>
              <p className="text-gray-600 mb-4">{t('terms.intro.body2')}</p>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-800 font-semibold mb-2">{t('terms.intro.legalBusinessName')}</p>
                <p className="text-gray-700">{t('terms.intro.legalBusinessNameDesc')}</p>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-gray-600">
                  <strong>{t('terms.intro.contactSupport')}</strong>{' '}
                  <a href="mailto:support@smartermin.com" className="text-sky-600 hover:text-sky-700">
                    support@smartermin.com
                  </a>
                </p>
                <p className="text-gray-600">
                  <strong>{t('terms.intro.contactPrivacy')}</strong>{' '}
                  <a href="mailto:privacy@smarttermin.com" className="text-sky-600 hover:text-sky-700">
                    privacy@smarttermin.com
                  </a>
                </p>
              </div>
            </div>

            {/* Section I */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section1.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('terms.section1.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {generalProvisionsItems.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-gray-600 mb-2">{t('terms.section1.platformUsers')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {platformUsers.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section II */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section2.title')}
              </h2>
              <p className="text-gray-600 mb-2">
                <strong>{t('terms.section2.user')}</strong> {t('terms.section2.userDef')}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>{t('terms.section2.salon')}</strong> {t('terms.section2.salonDef')}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>{t('terms.section2.client')}</strong> {t('terms.section2.clientDef')}
              </p>
              <p className="text-gray-600 mb-2">
                <strong>{t('terms.section2.account')}</strong> {t('terms.section2.accountDef')}
              </p>
              <p className="text-gray-600">
                <strong>{t('terms.section2.subscription')}</strong> {t('terms.section2.subscriptionDef')}
              </p>
            </div>

            {/* Section III */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section3.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('terms.section3.intro')}</p>
              <p className="text-gray-600 mb-2">{t('terms.section3.userObligations')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {userObligations.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-gray-600">{t('terms.section3.responsibility')}</p>
            </div>

            {/* Section IV */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section4.title')}
              </h2>
              <p className="text-gray-600 mb-2">{t('terms.section4.intro')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {userCommitments.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-gray-600">{t('terms.section4.rights')}</p>
            </div>

            {/* Section V */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section5.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('terms.section5.intro')}</p>
              <p className="text-gray-600 mb-4">{t('terms.section5.notParty')}</p>
              <p className="text-gray-600 mb-2">{t('terms.section5.meaning')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {relationshipPoints.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section VI */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section6.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('terms.section6.intro')}</p>
              <div className="space-y-4">
                {subscriptionSubsections.map((key, index) => (
                  <div key={key}>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {index + 1}. {t(`${key}.title`)}
                    </h3>
                    <p className="text-gray-600">{t(`${key}.body`)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section VII */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section7.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('terms.section7.intro')}</p>
              <p className="text-gray-600">{t('terms.section7.prohibited')}</p>
            </div>

            {/* Section VIII */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section8.title')}
              </h2>
              <p className="text-gray-600 mb-4">{t('terms.section8.intro')}</p>
              <p className="text-gray-600 mb-2">{t('terms.section8.cannotGuarantee')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                {liabilityPoints.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
              <p className="text-gray-600 mb-2">{t('terms.section8.notResponsible')}</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                {liabilityExclusions.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>

            {/* Section IX */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section9.title')}
              </h2>
              <p className="text-gray-600">{t('terms.section9.body')}</p>
            </div>

            {/* Section X */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section10.title')}
              </h2>
              <p className="text-gray-600">{t('terms.section10.body')}</p>
            </div>

            {/* Section XI */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section11.title')}
              </h2>
              <p className="text-gray-600">{t('terms.section11.body')}</p>
            </div>

            {/* Section XII */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('terms.section12.title')}
              </h2>
              <p className="text-gray-600">{t('terms.section12.body')}</p>
            </div>

            {/* Section XIII */}
            <div className="mb-12 bg-blue-50 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('terms.section13.title')}
              </h2>
              <div className="space-y-2 text-gray-600">
                <p>
                  {t('terms.section13.questions')}
                </p>
                <p>
                  📧{' '}
                  <a href="mailto:support@smartermin.com" className="text-sky-600 hover:text-sky-700">
                    support@smartermin.com
                  </a>
                </p>
                <p className="mt-4">
                  {t('terms.section13.privacyQuestions')}
                </p>
                <p>
                  📧{' '}
                  <a href="mailto:privacy@smarttermin.com" className="text-sky-600 hover:text-sky-700">
                    privacy@smarttermin.com
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
