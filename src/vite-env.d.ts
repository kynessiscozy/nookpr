/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TCB_ENV_ID?: string;
  readonly VITE_TCB_REGION?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
