import Image from "next/image";

type MascotMarkProps = Readonly<{
  className?: string;
  priority?: boolean;
}>;

export function MascotMark({ className, priority = false }: MascotMarkProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      height={120}
      priority={priority}
      src="/brand/mascot-mark.svg"
      width={120}
    />
  );
}
