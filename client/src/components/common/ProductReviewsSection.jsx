import React, { useState } from 'react';
import { Star, ShieldCheck, MessageSquarePlus, MapPin, CheckCircle2, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STAR_LEVELS = [5, 4, 3, 2, 1];

const formatReviewDate = (isoDate) => {
  if (!isoDate) return 'Recently';
  try {
    return new Date(isoDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
};

/**
 * Product Ratings & Humanized Customer Reviews section with distribution bars
 * and live customer review submission.
 */
const ProductReviewsSection = ({
  productSlug,
  rating = 4.8,
  reviewCount = 0,
  ratingBreakdown = {},
  reviews = [],
  onReviewSubmitted,
}) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [vehicleOrUse, setVehicleOrUse] = useState('');
  const [city, setCity] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const total = Math.max(reviewCount || 0, reviews.length);

  const handleOpenReviewForm = () => {
    setSubmitError('');
    setSubmitSuccess('');
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (!city && user?.city) setCity(user.city);
    setShowForm((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (title.trim().length < 3) {
      setSubmitError('Please write a brief headline (at least 3 characters).');
      return;
    }
    if (comment.trim().length < 8) {
      setSubmitError('Please share a few words about your experience (at least 8 characters).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/products/${productSlug}/reviews`, {
        rating: formRating,
        title: title.trim(),
        comment: comment.trim(),
        vehicleOrUse: vehicleOrUse.trim(),
        reviewerCity: city.trim(),
      });
      if (res.data.success) {
        onReviewSubmitted?.(res.data);
        setTitle('');
        setVehicleOrUse('');
        setComment('');
        setFormRating(5);
        setShowForm(false);
        setSubmitSuccess('Thanks! Your review has been posted.');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="rounded-2xl border border-[#dce5ee] bg-white p-5 sm:p-8 shadow-2xs space-y-8">
        {/* Header & Rating Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div>
              <h2 id="reviews-heading" className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Ratings &amp; Customer Reviews
              </h2>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-2xl bg-[#172536] px-4 py-2.5 text-white shadow-xs">
                  <span className="text-3xl font-extrabold tracking-tight">{Number(rating).toFixed(1)}</span>
                  <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-xs sm:text-sm text-gray-600 space-y-0.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="font-semibold text-gray-800">{total} verified customer {total === 1 ? 'review' : 'reviews'}</p>
                  <p className="text-[11px] text-gray-500">Feedback from fleet owners, mechanics &amp; everyday drivers</p>
                </div>
              </div>
            </div>

            {/* 5..1 Star Histogram */}
            <div className="w-full sm:w-64 space-y-1.5 sm:border-l sm:border-gray-100 sm:pl-6">
              {STAR_LEVELS.map((star) => {
                const count = Number(ratingBreakdown?.[star] || 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-7 font-semibold text-gray-600 flex items-center gap-0.5">
                      {star}<Star className="h-3 w-3 fill-gray-400 text-gray-400" />
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#385775] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[11px] font-medium text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2">
            <button
              type="button"
              onClick={handleOpenReviewForm}
              className="inline-flex items-center gap-2 rounded-xl border border-[#385775] bg-white px-4 py-2.5 text-xs font-bold text-[#385775] hover:bg-[#f2f6fa] transition-colors shadow-2xs"
            >
              {showForm ? <X className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
              <span>{showForm ? 'Close Form' : 'Rate Product'}</span>
            </button>
            <p className="text-[11px] text-gray-500">
              {isAuthenticated ? 'Share how this unit works in your vehicle or setup.' : 'Sign in with mobile to rate & write a review.'}
            </p>
          </div>
        </div>

        {submitSuccess && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* Collapsible Customer Review Composer */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#d6e2ed] bg-[#f7fafc] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Write Your Review</h3>
                <p className="text-xs text-gray-500">Tell other buyers about installation, network strength, and daily reliability.</p>
              </div>
              <div className="flex items-center gap-1" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hoverRating || formRating);
                  return (
                    <button
                      key={star}
                      type="button"
                      aria-label={`Rate ${star} stars`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star className={`h-6 w-6 ${filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {submitError && (
              <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                {submitError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Review Title</label>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Quick fitting & reliable app updates"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs focus:border-[#385775] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Vehicle / Usage (Optional)</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={vehicleOrUse}
                    onChange={(e) => setVehicleOrUse(e.target.value)}
                    placeholder="e.g. Swift Dzire"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs focus:border-[#385775] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">City (Optional)</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs focus:border-[#385775] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Your Review</label>
              <textarea
                rows={3}
                maxLength={800}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share how easy setup was, alert accuracy, battery life, or SIM coverage in your area..."
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs focus:border-[#385775] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#385775] px-5 py-2 text-xs font-bold text-white hover:bg-[#293d54] disabled:opacity-50 btn-press"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

        {/* Review Cards */}
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Be the first customer to review this product.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((rev) => (
              <article key={rev.id} className="py-5 first:pt-0 last:pb-0 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold text-white ${
                      rev.rating >= 4 ? 'bg-[#1f7a4c]' : rev.rating === 3 ? 'bg-amber-600' : 'bg-red-600'
                    }`}
                  >
                    <span>{rev.rating}</span>
                    <Star className="h-3 w-3 fill-white text-white" />
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">{rev.title}</h3>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed max-w-4xl">
                  {rev.comment}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                  <span className="font-semibold text-gray-700">{rev.reviewerName}</span>
                  {rev.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[#1f7a4c] font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Buyer
                    </span>
                  )}
                  {rev.reviewerCity && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" /> {rev.reviewerCity}
                    </span>
                  )}
                  {rev.vehicleOrUse && (
                    <span className="rounded-full bg-[#eef3f8] px-2.5 py-0.5 text-[11px] font-semibold text-[#385775]">
                      {rev.vehicleOrUse}
                    </span>
                  )}
                  <span className="text-gray-400">{formatReviewDate(rev.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductReviewsSection;
