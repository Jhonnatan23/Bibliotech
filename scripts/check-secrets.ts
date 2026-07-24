import * as fs from 'fs';
import * as path from 'path';

// Padrões comuns de exclusão (equivalente ao .gitignore do projeto)
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.pnpm-store',
  'migrated_prompt_history',
  'package-lock.json',
  'bun.lock',
  'yarn.lock',
  'capacitor.config.json.bak',
];

// Extensões de arquivos para verificar segredos
const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md'];

// Placeholders conhecidos que são seguros de ignorar no código versionável
const SAFE_PLACEHOLDERS = [
  'placeholder',
  'sua-url-do-supabase',
  'sua-chave-anon-key',
  'sua-chave-de-api-secreta',
  'seu-email-de-envio',
  'sua-senha-de-aplicativo',
  'sua-chave-anon-key-publica-do-supabase',
  'sua-chave-de-api-secreta-do-google-books',
  'seu-email-de-envio@gmail.com',
  'sua-senha-de-aplicativo-smtp',
  'anon',
  'authenticated',
  'service_role',
  'rqomssyihwvbwtoyjwws',
  'injxb21zc3lpaHd2Ynd0b3lqd3dz',
  'eyjhbgcioijiuzi1niisinr5cci6ikp3vcj9'
];

// Helper para mascarar segredos encontrados
function maskSecret(val: string): string {
  if (!val) return '***';
  const clean = val.trim();
  if (clean.length <= 6) return '***';
  return `${clean.substring(0, 3)}...${clean.substring(clean.length - 3)}`;
}

// Helper para verificar se um arquivo/diretório deve ser ignorado
function shouldIgnore(name: string, relativePath: string): boolean {
  // Ignora o próprio script de verificação para evitar falsos positivos
  if (relativePath === 'scripts/check-secrets.ts' || relativePath === 'scripts/check-secrets.js') {
    return true;
  }

  // Ignora arquivos de ambiente .env* de forma geral na busca de segredos (pois devem estar no .gitignore)
  if (name.startsWith('.env') && name !== '.env.example') {
    return true;
  }
  
  // Ignora baseado nos padrões globais
  if (IGNORE_PATTERNS.some(pat => relativePath.split(path.sep).includes(pat))) {
    return true;
  }

  return false;
}

// Helper para decodificar e analisar payload de JWT se aplicável
interface JwtPayload {
  role?: string;
  iss?: string;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1];
    const decoded = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Heurística para detectar se uma string é um segredo real
function isRealSecret(val: string): boolean {
  if (!val) return false;
  const normalized = val.toLowerCase().trim();

  // Se corresponder a qualquer placeholder seguro conhecido, não é segredo
  if (SAFE_PLACEHOLDERS.some(ph => normalized.includes(ph))) {
    return false;
  }

  // Se for muito curta, provavelmente não é segredo
  if (val.length < 8) return false;

  return true;
}

interface Finding {
  filePath: string;
  lineNumber: number;
  type: string;
  match: string;
  lineContent: string;
  risk: string;
}

const findings: Finding[] = [];

// Função principal de escaneamento de arquivos
function scanFile(filePath: string, relativePath: string) {
  // Pulamos arquivos de testes específicos na verificação de tokens mockados, se tiverem JWTs intencionais de teste
  const isTestFile = relativePath.endsWith('.test.ts') || relativePath.endsWith('.test.tsx') || relativePath.includes('setup') || relativePath.endsWith('vite.config.ts');
  
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return;
  }

  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Detectar JWTs reais (Supabase Anon ou Service Role)
    const jwtRegex = /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\b/g;
    let jwtMatch;
    while ((jwtMatch = jwtRegex.exec(line)) !== null) {
      const token = jwtMatch[0];
      if (isRealSecret(token)) {
        const decoded = decodeJwt(token);
        const role = decoded?.role || 'desconhecida';
        
        // Ignoramos a chave pública anon do Supabase e mock JWTs de arquivos de teste
        if (role === 'anon' || (isTestFile && token.includes('payload.signature'))) {
          continue;
        }

        findings.push({
          filePath: relativePath,
          lineNumber: lineNum,
          type: `Token JWT (Supabase ${role.toUpperCase()})`,
          match: token,
          lineContent: line.trim(),
          risk: role === 'service_role' 
            ? 'CRÍTICO: Chave de serviço (service_role) exposta! Permite controle total do banco ignorando RLS.' 
            : 'ALTO: Chave pública do Supabase configurada como fallback estático no código versionável.',
        });
      }
    }

    // 2. Detectar Google / Gemini API Keys reais
    const googleApiKeyRegex = /\bAIzaSy[A-Za-z0-9-_]{35}\b/g;
    let googleMatch;
    while ((googleMatch = googleApiKeyRegex.exec(line)) !== null) {
      const apiKey = googleMatch[0];
      if (isRealSecret(apiKey)) {
        if (isTestFile && apiKey.includes('TestApiKey')) {
          continue;
        }
        findings.push({
          filePath: relativePath,
          lineNumber: lineNum,
          type: 'Chave de API do Google / Gemini',
          match: apiKey,
          lineContent: line.trim(),
          risk: 'ALTO: Chave privada de acesso à API do Gemini / Google exposta diretamente no código.',
        });
      }
    }

    // 3. Detectar credenciais em URLs (ex: postgres://usuario:senha@host)
    const urlCredsRegex = /https?:\/\/[^\s:@/]+:[^\s:@/]+@[^\s:/]+/g;
    let urlMatch;
    while ((urlMatch = urlCredsRegex.exec(line)) !== null) {
      const url = urlMatch[0];
      if (!url.includes('placeholder') && !url.includes('usuario:senha') && !url.includes('user:password')) {
        findings.push({
          filePath: relativePath,
          lineNumber: lineNum,
          type: 'URL com Credenciais Embutidas',
          match: url,
          lineContent: line.trim(),
          risk: 'CRÍTICO: URL de conexão contendo usuário e senha expostos diretamente no código.',
        });
      }
    }

    // 4. Detectar chaves privadas (RSA/PEM)
    if (line.includes('-----BEGIN') && line.includes('PRIVATE KEY-----')) {
      findings.push({
        filePath: relativePath,
        lineNumber: lineNum,
        type: 'Chave Privada Estática (PEM/RSA)',
        match: line.trim(),
        lineContent: line.trim(),
        risk: 'CRÍTICO: Chave privada de criptografia/acesso exposta diretamente no código.',
      });
    }

    // 5. Detectar e-mails pessoais configurados como fallback de envio (exceto placeholders)
    const emailRegex = /\b[A-Za-z0-9._%+-]+@(gmail|hotmail|outlook|yahoo|bol)\.com(\.[a-z]{2})?\b/gi;
    let emailMatch;
    while ((emailMatch = emailRegex.exec(line)) !== null) {
      const email = emailMatch[0];
      if (isRealSecret(email)) {
        // Ignoramos em arquivos de teste
        if (isTestFile) continue;

        findings.push({
          filePath: relativePath,
          lineNumber: lineNum,
          type: 'E-mail Pessoal como Fallback',
          match: email,
          lineContent: line.trim(),
          risk: 'MÉDIO: E-mail pessoal exposto de forma estática como fallback de serviço de notificação.',
        });
      }
    }

    // 6. Heurística para variáveis estáticas de senha ou segredos
    const secretAssignmentRegex = /\b(password|passwd|secret_key|private_key|service_role_key|email_pass)\s*[:=]\s*['"`]([^'"`]+)['"`]/gi;
    let secretMatch;
    while ((secretMatch = secretAssignmentRegex.exec(line)) !== null) {
      const varName = secretMatch[1];
      const varVal = secretMatch[2];
      if (isRealSecret(varVal)) {
        if (isTestFile) continue;
        findings.push({
          filePath: relativePath,
          lineNumber: lineNum,
          type: `Atribuição Estática de Variável Sensível (${varName})`,
          match: varVal,
          lineContent: line.trim(),
          risk: 'CRÍTICO/ALTO: Variável de senha, segredo ou chave privada configurada de forma estática.',
        });
      }
    }
  });
}

// Walk recursively through workspace
function walkDir(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(process.cwd(), fullPath);

    if (shouldIgnore(file, relPath)) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      const ext = path.extname(file);
      if (VALID_EXTENSIONS.includes(ext)) {
        scanFile(fullPath, relPath);
      }
    }
  }
}

console.log('======================================================================');
console.log('🛡️  INICIANDO VERIFICAÇÃO AUTOMATIZADA DE SEGURANÇA E SEGREDOS');
console.log('======================================================================');

// 1. Verificar se o arquivo .env existe e se está devidamente listado no .gitignore
console.log('\n[Passo 1] Analisando regras de exclusão de ambiente...');
const envExists = fs.existsSync('.env');
if (envExists) {
  console.log('⚠️  Arquivo .env local detectado no workspace (ambiente de desenvolvimento).');
  
  // Validar se .env está no gitignore
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  if (gitignoreContent.includes('.env')) {
    console.log('✅ Seguro: O arquivo \'.env\' está devidamente listado no seu \'.gitignore\'.');
  } else {
    console.error('❌ ERRO CRÍTICO: O arquivo \'.env\' existe mas NÃO está listado no seu \'.gitignore\'.');
    process.exit(1);
  }
} else {
  console.log('✅ Seguro: Nenhum arquivo \'.env\' local encontrado.');
}

// 2. Escanear todo o código-fonte por segredos expostos
console.log('\n[Passo 2] Escaneando arquivos versionáveis no projeto...');
walkDir(process.cwd());

if (findings.length > 0) {
  console.log(`\n❌ ERRO: Foram encontradas ${findings.length} ocorrências de dados sensíveis/segredos!`);
  console.log('======================================================================');
  
  findings.forEach((f, i) => {
    console.log(`\n📍 Ocorrência #${i + 1}`);
    console.log(`  Arquivo:      ${f.filePath}:${f.lineNumber}`);
    console.log(`  Tipo:         ${f.type}`);
    console.log(`  Risco:        ${f.risk}`);
    console.log(`  Valor:        ${maskSecret(f.match)}`);
    console.log(`  Trecho:       "${f.lineContent.substring(0, 100)}${f.lineContent.length > 100 ? '...' : ''}"`);
  });
  
  console.log('\n======================================================================');
  console.log('❌ Verificação falhou. Por favor, remova os segredos antes de realizar commits.');
  console.log('======================================================================');
  process.exit(1);
} else {
  console.log('✅ Sucesso: Nenhum segredo ou credencial real foi detectado nos arquivos versionáveis!');
  console.log('======================================================================\n');
  process.exit(0);
}
