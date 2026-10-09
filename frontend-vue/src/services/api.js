// Camada de acesso a dados do front-end.
//
// Toda leitura/gravação de dados e de sessão passa por aqui — nenhuma tela
// ou store deve tocar em localStorage nem chamar fetch diretamente. Assim,
// ligar o back-end (Spring Boot) é trocar o corpo destas funções, sem mexer
// nas telas.
//
// Modo mock (padrão): guarda tudo no localStorage deste navegador.
// Modo API: defina VITE_USE_MOCK=false e VITE_API_URL no arquivo .env
// (veja .env.example). Os endpoints usados estão em API-CONTRATO.md e são
// uma PROPOSTA a validar com a squad de Java — ainda não foram testados
// contra um back-end real.

const USAR_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

const CHAVE_AUTH = 'ctiAuth'
const CHAVE_USUARIO = 'ctiUsuario'
const CHAVE_NOME = 'ctiNome'
const CHAVE_USUARIOS = 'ctiUsuarios'
const CHAVE_CLIENTES = 'ctiClientes'
const CHAVE_TELEMETRIA = 'ctiTelemetria'

// ---------- Utilitários ----------

const lerJson = (chave, padrao) => {
  const salvo = localStorage.getItem(chave)
  return salvo ? JSON.parse(salvo) : padrao
}

const http = async (caminho, opcoes = {}) => {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes
  })

  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} em ${caminho}`)
  }

  return resposta.status === 204 ? null : resposta.json()
}

// ---------- Sessão ----------

// Síncronas de propósito: a guarda de rota e a Sidebar precisam da resposta
// na hora. No modo API, troque por token/cookie de sessão.
export const estaAutenticado = () => {
  return localStorage.getItem(CHAVE_AUTH) === 'true'
}

export const usuarioAtual = () => {
  return localStorage.getItem(CHAVE_USUARIO) || ''
}

// Nome para exibir na Sidebar. Vem do cadastro (ou da API, quando ela
// informa o campo "nome"). Sem isso, deriva do e-mail:
// "ana.lima@empresa.com" -> "Ana Lima".
const nomeAPartirDoEmail = email => {
  return String(email || '')
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(' ')
}

export const nomeUsuario = () => {
  return localStorage.getItem(CHAVE_NOME) || nomeAPartirDoEmail(usuarioAtual())
}

// ---------- Cadastro de usuários (modo mock) ----------

// E-mail sem espaços e em minúsculas, pra "Ana@x.com" e "ana@x.com" serem
// a mesma conta.
const normalizarEmail = email => String(email || '').trim().toLowerCase()

// A senha nunca é guardada em texto puro: guardamos um hash SHA-256 com um
// "sal" aleatório por usuário. É suficiente pra um protótipo no navegador,
// mas NÃO substitui a segurança de um back-end de verdade (o localStorage
// continua visível pra quem abrir o navegador). Obs.: crypto.subtle só
// funciona em localhost ou HTTPS.
const gerarSal = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

const gerarHash = async (senha, sal) => {
  const dados = new TextEncoder().encode(`${sal}:${senha}`)
  const resumo = await crypto.subtle.digest('SHA-256', dados)

  return Array.from(new Uint8Array(resumo), b => b.toString(16).padStart(2, '0')).join('')
}

// API: POST /auth/cadastro  { nome, email, senha } -> { email, nome }
// (409 se o e-mail já existir). Lança Error('EMAIL_JA_CADASTRADO') no mock.
export const cadastrar = async ({ nome, email, senha }) => {
  if (!USAR_MOCK) {
    return http('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha })
    })
  }

  const emailNormalizado = normalizarEmail(email)
  const usuarios = lerJson(CHAVE_USUARIOS, [])

  if (usuarios.some(usuario => usuario.email === emailNormalizado)) {
    throw new Error('EMAIL_JA_CADASTRADO')
  }

  const sal = gerarSal()

  usuarios.push({
    nome: String(nome).trim(),
    email: emailNormalizado,
    sal,
    senhaHash: await gerarHash(senha, sal),
    criadoEm: new Date().toISOString()
  })

  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios))

  return { email: emailNormalizado, nome: String(nome).trim() }
}

// API: POST /auth/login  { email, senha } -> { email, nome? }
export const login = async (email, senha) => {
  if (!USAR_MOCK) {
    const usuario = await http('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    })
    localStorage.setItem(CHAVE_AUTH, 'true')
    localStorage.setItem(CHAVE_USUARIO, usuario.email)

    if (usuario.nome) {
      localStorage.setItem(CHAVE_NOME, usuario.nome)
    }

    return usuario
  }

  // Mock: só entra quem foi cadastrado e acertou a senha. A mensagem de erro
  // é a mesma pros dois casos (e-mail inexistente ou senha errada), pra não
  // revelar quais e-mails existem.
  const emailNormalizado = normalizarEmail(email)
  const usuario = lerJson(CHAVE_USUARIOS, []).find(
    item => item.email === emailNormalizado
  )

  if (!usuario) {
    throw new Error('CREDENCIAIS_INVALIDAS')
  }

  const hash = await gerarHash(senha, usuario.sal)

  if (hash !== usuario.senhaHash) {
    throw new Error('CREDENCIAIS_INVALIDAS')
  }

  localStorage.setItem(CHAVE_AUTH, 'true')
  localStorage.setItem(CHAVE_USUARIO, usuario.email)
  localStorage.setItem(CHAVE_NOME, usuario.nome)

  return { email: usuario.email, nome: usuario.nome }
}

// API: POST /auth/logout
export const logout = async () => {
  localStorage.removeItem(CHAVE_AUTH)
  localStorage.removeItem(CHAVE_USUARIO)
  localStorage.removeItem(CHAVE_NOME)

  if (!USAR_MOCK) {
    await http('/auth/logout', { method: 'POST' })
  }
}

// ---------- Clientes ----------

// API: GET /clientes -> [Cliente]
export const listarClientes = async () => {
  if (!USAR_MOCK) {
    return http('/clientes')
  }

  return lerJson(CHAVE_CLIENTES, [])
}

// Mock: o front trata a planilha e guarda o resultado aqui.
// API: a base é gravada pelo back-end ao receber a planilha
// (POST /uploads); esta função deixa de ser necessária.
export const salvarClientes = async clientes => {
  if (!USAR_MOCK) {
    return
  }

  localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes))
}

// ---------- Histórico de processamento (telemetria) ----------

// API: GET /uploads -> [RegistroUpload]
export const listarHistorico = async () => {
  if (!USAR_MOCK) {
    return http('/uploads')
  }

  return lerJson(CHAVE_TELEMETRIA, [])
}

// Mesmo caso de salvarClientes: só existe no modo mock.
export const salvarHistorico = async historico => {
  if (!USAR_MOCK) {
    return
  }

  localStorage.setItem(CHAVE_TELEMETRIA, JSON.stringify(historico))
}

// ---------- Apoio a testes ----------

// Só em desenvolvimento (npm run dev): se a chave ctiDelayUpload do
// localStorage tiver um número (milissegundos), o processamento do upload
// espera esse tempo, para dar para ver o status PROCESSANDO na tela. Em
// produção (npm run build) não faz nada. Para usar, no console do navegador:
//   localStorage.setItem('ctiDelayUpload', 3000)
// e para desligar: localStorage.removeItem('ctiDelayUpload')
export const esperarSimulado = async () => {
  if (!import.meta.env.DEV) {
    return
  }

  const atraso = Number(localStorage.getItem('ctiDelayUpload'))

  if (atraso > 0) {
    await new Promise(resolver => setTimeout(resolver, atraso))
  }
}

// ---------- Limpeza ----------

// Ferramenta de teste (botão "Limpar dados locais" em Relatórios).
// Não apaga os usuários cadastrados, só clientes e histórico.
// API: DELETE /clientes e DELETE /uploads, se o back-end oferecer isso.
export const limparDados = async () => {
  localStorage.removeItem(CHAVE_CLIENTES)
  localStorage.removeItem(CHAVE_TELEMETRIA)
}