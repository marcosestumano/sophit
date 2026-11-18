/* eslint-disable @next/next/no-img-element */
export function SophitLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo-mark.png?v=2"
      alt="Sophit"
      width={size}
      height={size}
      draggable={false}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  )
}
