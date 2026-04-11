import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.soldorecreio.app",
  appName: "Sol do Recreio",
  webDir: "public",
  server: {
    url: "https://skyblue-lark-202006.hostingersite.com",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
