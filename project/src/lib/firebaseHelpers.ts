export const currentHost = () => {
  if (typeof window === 'undefined') return '';
  return window.location.hostname;
};