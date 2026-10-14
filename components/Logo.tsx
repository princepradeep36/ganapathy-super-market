/**
 * Brand logo: the TamilKadai shop-stall badge (public/brand/logo.svg) plus the
 * wordmark. logo.png and apple-icon.png are the same badge as PNG icons.
 */
export function LogoMark({ size = 44, className = '' }: { size?: number; className?: string }) {
  return <img className={`logoImg ${className}`} src="/brand/logo.svg" width={size} height={size} alt="TamilKadai logo" />;
}

export default function Logo({ light = false, size = 44 }: { light?: boolean; size?: number }) {
  return (
    <span className={`logo${light ? ' logoLight' : ''}`}>
      <LogoMark size={size} />
      <span className="logoText">
        <span className="logoWord">Tamil<em>Kadai</em></span>
        <small className="logoTa" lang="ta">தமிழ் கடை</small>
        <span className="logoUrl">tamilkadai.se</span>
      </span>
    </span>
  );
}
