import Script from 'next/script';

type TelemetryProviderProps = {
  children: React.ReactNode;
};

const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export function TelemetryProvider({ children }: TelemetryProviderProps) {
  return (
    <>
      {children}
      {umamiScriptUrl && umamiWebsiteId ? (
        <Script
          id="umami-telemetry"
          src={umamiScriptUrl}
          strategy="afterInteractive"
          data-website-id={umamiWebsiteId}
          data-do-not-track="true"
        />
      ) : null}
    </>
  );
}
