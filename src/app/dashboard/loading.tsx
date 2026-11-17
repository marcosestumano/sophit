/**
 * Mostrado na hora em que o aluno toca para trocar de tela, enquanto o servidor
 * busca os dados. Com ele a navegação responde de imediato em vez de "travar".
 */
export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-6 lg:pt-2" aria-busy="true" aria-label="Carregando">
      <div className="h-11" />
      <div className="sk mt-3 h-9 w-48 rounded-xl" />
      <div className="sk mt-2 h-5 w-32 rounded-lg" />
      <div className="sk mt-6 h-28 rounded-3xl" />
      <div className="mt-3 flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => <div key={i} className="sk h-[72px] w-[42px] rounded-2xl" />)}
      </div>
      <div className="sk mt-4 h-56 rounded-3xl" />
      <div className="sk mt-3 h-20 rounded-3xl" />
    </div>
  )
}
