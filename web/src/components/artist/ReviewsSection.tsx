import React, { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  getReviewsForArtist,
  Review,
  ReviewsResponse,
  canReviewService,
} from '../../services/reviewService';
import { ReviewForm } from './ReviewForm';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewsSectionProps {
  artistId: string;
  services: Array<{ id: string; name: string }>;
}

export function ReviewsSection({ artistId, services }: ReviewsSectionProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [canWriteReview, setCanWriteReview] = useState<boolean>(false);
  const [checkingReviewEligibility, setCheckingReviewEligibility] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      try {
        const response = await getReviewsForArtist(artistId);
        setReviews(response);
      } catch (error) {
        console.error('Failed to load reviews', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [artistId]);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      if (!isAuthenticated || user?.userType !== 'client' || services.length === 0) {
        setCanWriteReview(false);
        return;
      }

      setCheckingReviewEligibility(true);
      try {
        const eligibilityChecks = await Promise.all(
          services.map((service) =>
            canReviewService(artistId, service.id).catch(() => ({ canReview: false }))
          )
        );

        const hasReviewableService = eligibilityChecks.some((result) => result.canReview);
        setCanWriteReview(hasReviewableService);
      } catch (error) {
        console.error('Failed to check review eligibility', error);
        setCanWriteReview(false);
      } finally {
        setCheckingReviewEligibility(false);
      }
    };

    checkReviewEligibility();
  }, [isAuthenticated, user?.userType, artistId, services]);

  const handleReviewSubmitted = async () => {
    setShowReviewForm(false);
    setSelectedService(null);

    const loadReviews = async () => {
      try {
        const response = await getReviewsForArtist(artistId);
        setReviews(response);
      } catch (error) {
        console.error('Failed to reload reviews', error);
      }
    };
    await loadReviews();

    if (isAuthenticated && user?.userType === 'client' && services.length > 0) {
      try {
        const eligibilityChecks = await Promise.all(
          services.map((service) =>
            canReviewService(artistId, service.id).catch(() => ({ canReview: false }))
          )
        );
        const hasReviewableService = eligibilityChecks.some((result) => result.canReview);
        setCanWriteReview(hasReviewableService);
      } catch (error) {
        console.error('Failed to recheck review eligibility', error);
        setCanWriteReview(false);
      }
    }
  };

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl mb-6">{t('reviews.title')}</h2>
        <div className="text-center py-8 text-gray-500">{t('reviews.loading')}</div>
      </section>
    );
  }

  if (!reviews) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">{t('reviews.title')}</h2>
        {reviews.averageRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
              <span className="ml-1 text-lg font-semibold">{reviews.averageRating.toFixed(1)}</span>
            </div>
            <span className="text-gray-500">
              ({reviews.totalReviews} {t('reviews.reviews')})
            </span>
          </div>
        )}
      </div>

      {isAuthenticated &&
        user?.userType === 'client' &&
        canWriteReview &&
        !checkingReviewEligibility && (
          <div className="mb-6">
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-blue-600 hover:text-sky-600 font-medium flex items-center gap-2"
            >
              <MessageSquare size={18} />
              {t('reviews.writeReview')}
            </button>
          </div>
        )}

      {showReviewForm && (
        <ReviewForm
          artistId={artistId}
          services={services}
          selectedService={selectedService}
          onClose={() => {
            setShowReviewForm(false);
            setSelectedService(null);
          }}
          onSubmitted={handleReviewSubmitted}
        />
      )}

      {reviews.reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="mx-auto mb-4 text-gray-300" size={48} />
          <p>{t('reviews.noReviews')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{review.clientName}</span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{review.serviceName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }
                        size={16}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.reviewText && <p className="text-gray-700 mt-2">{review.reviewText}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


