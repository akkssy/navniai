import Image from 'next/image'

// Shared NavniAI brand mark. Renders /logo.png (place the file in public/logo.png).
// Uses next/image so the GH Pages export target picks up basePath/assetPrefix.
export default function Logo({ size = 28, className = 'rounded-lg' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="NavniAI"
      width={size}
      height={size}
      className={className}
    />
  )
}
