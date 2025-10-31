/// <reference types="vite/client" />

interface Window {
  mixpanel: any;
  gtag: (...args: any[]) => void;
  clarity: any;
  dataLayer: any[];
}
