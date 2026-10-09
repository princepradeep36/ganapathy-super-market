/**
 * Brand logo. The image lives at public/brand/logo.png — replace that file
 * (square PNG, 512×512 or larger) with your licensed logo and rebuild.
 */
export function LogoMark({ size = 44, className = '' }: { size?: number; className?: string }) {
  return <img className={`logoImg ${className}`} src="/brand/logo.png" width={size} height={size} alt="Ganapathy Super Market logo" />;
}

export default function Logo({ light = false, size = 44 }: { light?: boolean; size?: number }) {
  return (
    <span className={`logo${light ? ' logoLight' : ''}`}>
      <LogoMark size={size} />
      <span className="logoText">Ganapathy<small>Super Market</small><span className="logoUrl">ganapathysupermarket.com</span></span>
    </span>
  );
}
