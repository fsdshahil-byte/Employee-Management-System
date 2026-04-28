const isBrowser = typeof window !== "undefined";

const getBaseOrigin = () => {
  if (import.meta.env.VITE_API_ORIGIN) {
    return import.meta.env.VITE_API_ORIGIN.replace(/\/$/, "");
  }

  if (isBrowser && window.location.origin) {
    return window.location.origin;
  }

  return "http://localhost:3000";
};

export const APP_ORIGIN = getBaseOrigin();
export const API_BASE_URL = `${APP_ORIGIN}/api`;
export const SOCKET_URL = APP_ORIGIN;
export const getUploadUrl = (fileName) =>
  fileName ? `${APP_ORIGIN}/uploads/${fileName}` : "";
