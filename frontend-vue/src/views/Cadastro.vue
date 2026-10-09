<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const mostrarSenha = ref(false)
const erro = ref('')
const enviando = ref(false)

const SENHA_MINIMA = 6

const emailValido = valor => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)

const cadastrar = async () => {
  erro.value = ''

  if (!nome.value.trim() || !email.value || !senha.value || !confirmarSenha.value) {
    erro.value = 'Preencha todos os campos.'
    return
  }

  if (nome.value.trim().length < 2) {
    erro.value = 'Digite seu nome.'
    return
  }

  if (!emailValido(email.value.trim())) {
    erro.value = 'Digite um e-mail válido.'
    return
  }

  if (senha.value.length < SENHA_MINIMA) {
    erro.value = `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`
    return
  }

  if (senha.value !== confirmarSenha.value) {
    erro.value = 'As senhas não são iguais.'
    return
  }

  enviando.value = true

  try {
    // Cria a conta e já entra com ela
    await auth.cadastrar(nome.value.trim(), email.value.trim(), senha.value)
  } catch (falha) {
    const mensagem = String(falha?.message || '')

    erro.value =
      mensagem === 'EMAIL_JA_CADASTRADO' || mensagem.includes('409')
        ? 'Este e-mail já está cadastrado. Tente entrar.'
        : 'Não foi possível concluir o cadastro. Tente novamente.'

    enviando.value = false
    return
  }

  router.push('/dashboard')
}
</script>

<template>

  <main class="min-h-screen flex flex-col md:flex-row">

    <!-- Painel esquerdo: identidade e proposta de valor -->

    <div
      class="relative flex flex-col justify-between overflow-hidden bg-[#2A1535] px-8 py-10 text-white md:w-1/2 md:px-16 md:py-14"
    >

      <RouterLink
        to="/"
        class="text-2xl font-bold tracking-tight text-white"
      >
        cti-information<span class="text-[#D98BA3]">.</span>
      </RouterLink>

      <div class="max-w-md">

        <h1 class="font-['Space_Grotesk'] text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Crie sua conta e
          <span class="text-[#D98BA3]">comece a analisar</span>
        </h1>

        <p class="mt-6 text-base leading-relaxed text-[#CDB8E0]">
          Cadastre-se para importar a base de clientes e acompanhar
          faturamento, contratos e insights em um só painel.
        </p>

      </div>

      <p class="mt-12 text-xs text-[#A58BBF]">
        cti-information © 2026 — Ambiente Corporativo Seguro
      </p>

    </div>

    <!-- Painel direito: formulário de cadastro -->

    <div class="flex flex-1 flex-col items-center justify-center bg-[#F6F0FA] px-6 py-12 sm:py-16">

      <RouterLink
        to="/"
        class="mb-4 flex w-full max-w-sm items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#5B2A86]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Voltar para a página inicial
      </RouterLink>

      <div
        class="w-full max-w-sm rounded-xl border-t-4 border-[#8C1D40] bg-white p-8 shadow-lg ring-1 ring-gray-200 sm:p-9"
      >

        <h1 class="text-2xl font-bold text-[#292A2F]">
          Criar conta
        </h1>

        <p class="mt-2 text-sm text-gray-500">
          Preencha os dados para se cadastrar.
        </p>

        <form
          @submit.prevent="cadastrar"
          class="mt-8 space-y-5"
          novalidate
        >

          <!-- Nome -->

          <div>

            <label
              for="nome"
              class="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#292A2F]"
            >
              Nome
            </label>

            <input
              id="nome"
              v-model="nome"
              type="text"
              autocomplete="name"
              placeholder="Seu nome completo"
              class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#5B2A86] focus:ring-2 focus:ring-[#5B2A86]/10"
            />

          </div>

          <!-- E-mail -->

          <div>

            <label
              for="email"
              class="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#292A2F]"
            >
              E-mail
            </label>

            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="nome.sobrenome@empresa.com"
              class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#5B2A86] focus:ring-2 focus:ring-[#5B2A86]/10"
            />

          </div>

          <!-- Senha -->

          <div>

            <label
              for="senha"
              class="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#292A2F]"
            >
              Senha
            </label>

            <div class="relative">

              <input
                id="senha"
                v-model="senha"
                :type="mostrarSenha ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Mínimo de 6 caracteres"
                class="w-full rounded-md border border-gray-300 px-4 py-3 pr-16 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#5B2A86] focus:ring-2 focus:ring-[#5B2A86]/10"
              />

              <button
                type="button"
                @click="mostrarSenha = !mostrarSenha"
                :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 transition hover:text-gray-600"
              >
                {{ mostrarSenha ? 'Ocultar' : 'Mostrar' }}
              </button>

            </div>

          </div>

          <!-- Confirmar senha -->

          <div>

            <label
              for="confirmar-senha"
              class="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#292A2F]"
            >
              Confirmar senha
            </label>

            <input
              id="confirmar-senha"
              v-model="confirmarSenha"
              :type="mostrarSenha ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Repita a senha"
              class="w-full rounded-md border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#5B2A86] focus:ring-2 focus:ring-[#5B2A86]/10"
            />

          </div>

          <!-- Mensagem de erro -->

          <div
            v-if="erro"
            role="alert"
            class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600"
          >
            {{ erro }}
          </div>

          <!-- Botão -->

          <button
            type="submit"
            :disabled="enviando"
            class="w-full rounded-md bg-[#5B2A86] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#46206A] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ enviando ? 'Criando conta...' : 'Criar conta' }}
          </button>

        </form>

        <p class="mt-6 text-center text-sm text-gray-500">
          Já possui conta?
          <RouterLink
            to="/login"
            class="font-medium text-[#5B2A86] hover:underline"
          >
            Entrar
          </RouterLink>
        </p>

      </div>

    </div>

  </main>

</template>