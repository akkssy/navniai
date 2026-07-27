import Image from 'next/image'

// Shared NavniAI brand mark. Renders /icon_navni.png (place the file in public/).
// Uses next/image so the GH Pages export target picks up basePath/assetPrefix.
export default function Logo({ size = 28, className = 'rounded-lg' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/icon_navni.png"
      alt="NavniAI"
      width={size}
      height={size}
      className={className}
    />
  )
}
