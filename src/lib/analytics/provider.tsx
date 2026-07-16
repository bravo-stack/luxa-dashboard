import Script from 'next/script';

type TelemetryProviderProps = {
  children: React.ReactNode;
};

const umamiHostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL?.replace(/\/+$/, '');
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiEnabled = process.env.NEXT_PUBLIC_UMAMI_ENABLED !== 'false';

export function TelemetryProvider({ children }: TelemetryProviderProps) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'production' &&
      umamiEnabled &&
      umamiHostUrl &&
      umamiWebsiteId ? (
        <Script
          id="umami-telemetry"
          src={`${umamiHostUrl}/script.js`}
          strategy="afterInteractive"
          data-website-id={umamiWebsiteId}
          data-auto-track="false"
        />
      ) : null}
    </>
  );
}
