import Image from 'next/image';

// Aislely 找货熊 — static bear mascot (reliable render; uses bear-flat.png).
export function Brandmark({ size = 44 }: { size?: number }) {
  return (
    <Image
      src="/bear-flat.png"
      alt="Aislely 找货熊"
      width={size}
      height={size}
      priority
      style={{ width: size, height: size, objectFit: 'contain', mixBlendMode: 'multiply' }}
    />
  );
}

// Page header used across Aislely surfaces: bear + title + subtitle.
export function AislelyHeader({
  title,
  subtitle,
  size = 44,
}: {
  title: string;
  subtitle?: string;
  size?: number;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Brandmark size={size} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
      </div>
    </div>
  );
}
