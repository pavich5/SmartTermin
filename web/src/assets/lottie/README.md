# Lottie Animation Files

Place your Lottie JSON files in this directory.

## Required Files:

1. **hero-dashboard.json** - Main hero section dashboard animation
2. **seamless-booking.json** - Seamless booking feature illustration
3. **walk-in.json** - Walk-in management feature illustration
4. **professional-tools.json** - Professional tools feature illustration
5. **analytics.json** - Analytics feature illustration
6. **secure-accounts.json** - Secure accounts feature illustration
7. **security.json** - Security feature illustration
8. **phone-verify.json** - Phone verification feature illustration
9. **email-notifications.json** - Email notifications feature illustration

## How to Use:

1. Download or create your Lottie JSON files
2. Place them in this directory (`web/src/assets/lottie/`)
3. Update the component files to import them:

```typescript
// Example for HeroIllustration.tsx
import heroAnimation from '../../assets/lottie/hero-dashboard.json';

<LottieAnimation
  animationData={heroAnimation}
  className="w-full h-auto"
/>
```

## Where to Get Lottie Files:

- **LottieFiles**: https://lottiefiles.com/
- **IconScout**: https://iconscout.com/lottie-animations
- Create your own with After Effects + Bodymovin plugin









