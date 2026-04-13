/**
 * Converte o JSON da chave privada (Firebase Console → Contas de serviço) em uma linha para o .env.
 *
 * Uso (na pasta do projeto):
 *   node scripts/service-account-to-env.mjs "C:\caminho\para\soldorecreio-8534a-xxxxx.json"
 *
 * Copie a linha impressa e cole no .env como FIREBASE_SERVICE_ACCOUNT_JSON="..."
 */
import fs from "fs";
import path from "path";

const file = process.argv[2];
if (!file) {
  console.error('Informe o caminho do .json. Ex.: node scripts/service-account-to-env.mjs "C:\\Downloads\\chave.json"');
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(file), "utf8");
const obj = JSON.parse(raw);
const oneLine = JSON.stringify(obj);
process.stdout.write(`FIREBASE_SERVICE_ACCOUNT_JSON=${JSON.stringify(oneLine)}\n`);
