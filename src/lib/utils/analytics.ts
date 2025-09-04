export function initGa() {
  const gaId = import.meta.env.VITE_GA_ID;
  
  if (!gaId) {
    console.warn("Google Analytics ID is not set.");
    return;
  }

  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', gaId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);
}