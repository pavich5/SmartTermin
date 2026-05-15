import React, { useState } from 'react';
import { Image } from 'antd';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';

// Type assertion for Ant Design Image component
const AntImage = Image as any;

interface PortfolioSectionProps {
  portfolio: string[];
}

export const PortfolioSection = React.memo(function PortfolioSection({
  portfolio,
}: PortfolioSectionProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const displayCount = 6;
  const hasMore = portfolio.length > displayCount;
  const imagesToShow = showAll ? portfolio : portfolio.slice(0, displayCount);

  if (portfolio.length === 0) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl mb-6">{t('artistProfile.portfolio')}</h2>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <ImageIcon className="text-blue-400" size={40} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
            {t('artistProfile.portfolioEmpty')}
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            {t('artistProfile.portfolioEmptyDesc')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl mb-6">{t('artistProfile.portfolio')}</h2>
      <AntImage.PreviewGroup
        preview={{
          mask: {
            style: {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
          rootClassName: 'portfolio-preview',
          getContainer: false,
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
          {imagesToShow.map((image, idx) => {
            return (
              <div
                key={`${image}-${idx}`}
                className="aspect-square rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer relative w-full"
              >
                <AntImage
                  src={image}
                  alt={`Portfolio ${idx + 1}`}
                  className="!w-full !h-full"
                  loading="lazy"
                  preview={{
                    src: image,
                  }}
                  rootClassName="portfolio-image"
                />
              </div>
            );
          })}
        </div>
      </AntImage.PreviewGroup>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            {showAll ? (
              <>
                <ChevronUp size={18} className="mr-2" />
                {t('artistProfile.showLess')}
              </>
            ) : (
              <>
                <ChevronDown size={18} className="mr-2" />
                {t('artistProfile.showMore')} ({portfolio.length - displayCount}{' '}
                {t('artistProfile.more')})
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
});
