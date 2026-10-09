// Apoio à prévia dos clientes (PreviaClientes.vue).

// Base processada antes do registro de correções ("etl_original") não tem
// esse campo: aí não dá pra saber o que foi corrigido (diferente de "nada
// precisou ser corrigido").
export const temRegistroEtl = clientes => {
  return clientes.length > 0 && clientes.every(c => c.etl_original)
}

// Mesmas cores do gráfico por nível do Dashboard (A azul, B laranja, C cinza).
export const ESTILO_NIVEL = {
  A: { selo: 'bg-purple-50 text-[#5B2A86]', barra: 'bg-[#5B2A86]' },
  B: { selo: 'bg-orange-50 text-[#A85700]', barra: 'bg-[#8C1D40]' },
  C: { selo: 'bg-slate-100 text-slate-600', barra: 'bg-[#B9A7C9]' }
}
