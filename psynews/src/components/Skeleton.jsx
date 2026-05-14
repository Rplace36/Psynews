/* Skeleton loading components — shimmer styles live in index.css */

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton--image" />
      <div className="skeleton-card__body">
        <div className="skeleton skeleton--tag" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--title skeleton--title-short" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text skeleton--text-short" />
        <div className="skeleton-card__footer">
          <div className="skeleton skeleton--avatar" />
          <div className="skeleton skeleton--author" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonHeroMain() {
  return (
    <div className="skeleton-hero-main" aria-hidden="true">
      <div className="skeleton skeleton--hero-image" />
      <div className="skeleton-hero-main__content">
        <div className="skeleton skeleton--tag" />
        <div className="skeleton skeleton--h1" />
        <div className="skeleton skeleton--h1 skeleton--h1-short" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text skeleton--text-short" />
      </div>
    </div>
  );
}

export function ErrorMessage({ message = "Failed to load content.", onRetry }) {
  return (
    <div className="error-message" role="alert">
      <span className="error-message__icon" aria-hidden="true">&#9888;</span>
      <p>{message}</p>
      {onRetry && (
        <button className="error-message__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
