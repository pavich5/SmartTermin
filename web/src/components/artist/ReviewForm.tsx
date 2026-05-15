import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { createReview, canReviewService, Review } from '../../services/reviewService';
import { toast } from 'sonner';

interface ReviewFormProps {
  artistId: string;
  services: Array<{ id: string; name: string }>;
  selectedService?: string | null;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewForm({
  artistId,
  services,
  selectedService,
  onClose,
  onSubmitted,
}: ReviewFormProps) {
  const { t } = useTranslation();
  const [serviceId, setServiceId] = useState<string>(selectedService || '');
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    if (serviceId) {
      checkEligibility();
    }
  }, [serviceId]);

  const checkEligibility = async () => {
    if (!serviceId) {
      setCanReview(null);
      return;
    }

    setCheckingEligibility(true);
    try {
      const response = await canReviewService(artistId, serviceId);
      setCanReview(response.canReview);
      if (!response.canReview) {
        toast.info(
          t('reviews.cannotReview') ||
            'You cannot review this service yet. Please wait until after your appointment time has passed.'
        );
      }
    } catch (error) {
      console.error('Failed to check review eligibility', error);
      setCanReview(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serviceId) {
      toast.error(t('reviews.selectService') || 'Please select a service');
      return;
    }

    if (rating === 0) {
      toast.error(t('reviews.selectRating') || 'Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview({
        artistId,
        serviceId,
        rating,
        reviewText: reviewText.trim() || undefined,
      });
      toast.success(t('reviews.reviewSubmitted') || 'Thank you for your review!');
      onSubmitted();
    } catch (error: any) {
      console.error('Failed to submit review', error);
      const errorMessage =
        error?.message || t('reviews.submitError') || 'Failed to submit review. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('reviews.writeReview')}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={t('common.close')}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('reviews.selectService')}
          </label>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setRating(0);
              setReviewText('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            required
          >
            <option value="">{t('reviews.chooseService')}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        {serviceId && checkingEligibility && (
          <div className="text-sm text-gray-500">
            {t('reviews.checkingEligibility') || 'Checking eligibility...'}
          </div>
        )}

        {serviceId && canReview === false && !checkingEligibility && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            {t('reviews.cannotReviewMessage') ||
              'You cannot review this service yet. Please wait until after your appointment time has passed, or you may have already reviewed this service.'}
          </div>
        )}

        {canReview && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reviews.rating')}
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }
                      size={32}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating} {rating === 1 ? t('reviews.star') : t('reviews.stars')}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reviews.comment')} ({t('reviews.optional')})
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                placeholder={t('reviews.commentPlaceholder') || 'Share your experience...'}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">{reviewText.length}/1000</div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 bg-sky-500 hover:bg-sky-600"
              >
                {isSubmitting
                  ? t('reviews.submitting') || 'Submitting...'
                  : t('reviews.submit') || 'Submit Review'}
              </Button>
              <Button type="button" onClick={onClose} variant="outline" className="flex-1">
                {t('reviews.cancel') || 'Cancel'}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}


