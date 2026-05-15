import React from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  animationData?: object;
  animationUrl?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
}

export function LottieAnimation({
  animationData,
  animationUrl,
  className = '',
  loop = true,
  autoplay = true,
  style,
}: LottieAnimationProps) {
  const [animation, setAnimation] = React.useState<object | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (animationData) {
      setAnimation(animationData);
      setLoading(false);
      return;
    }

    if (animationUrl) {
      setLoading(true);
      fetch(animationUrl)
        .then((res) => res.json())
        .then((data) => {
          setAnimation(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [animationData, animationUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={style}>
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !animation) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={style}>
        <div className="text-gray-400 text-sm">Animation unavailable</div>
      </div>
    );
  }

  return (
    <Lottie
      animationData={animation}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  );
}

