export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="sk h-9 w-64 rounded-xl" />
      <div className="sk h-5 w-80 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="sk h-28 rounded-3xl" />)}
      </div>
      <div className="sk h-72 rounded-3xl" />
    </div>
  )
}
