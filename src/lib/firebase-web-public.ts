/**
 * Configuração Web do Firebase (Console → Configurações do projeto → teu app).
 * Estes valores são públicos no browser; a segurança é por domínios autorizados e regras.
 * Usados como fallback se NEXT_PUBLIC_* não forem inlined no cliente (env/cache).
 */
export const FIREBASE_WEB_PUBLIC = {
  apiKey: "AIzaSyDaiAatah5a6sOcxaWDwsiZXqzXtNe2QXA",
  authDomain: "soldorecreio-8534a.firebaseapp.com",
  projectId: "soldorecreio-8534a",
  storageBucket: "soldorecreio-8534a.firebasestorage.app",
  messagingSenderId: "338638310998",
  appId: "1:338638310998:web:a77e3c0f2fde633fa275f7",
  measurementId: "G-X1LJFY9L17",
} as const;
