/**
 * Hostinger: zip no Windows pode extrair pastas sem permissao de leitura.
 * Antes do next build, garante permissoes no Linux (ignora no Windows).
 */
import { execSync } from "node:child_process";
import os from "node:os";

if (os.platform() !== "win32") {
  try {
    execSync("chmod -R u+rwX,go+rX .", { stdio: "inherit" });
  } catch {
    // Sem permissao para chmod; o deploy segue (Hostinger pode corrigir no painel).
  }
}
