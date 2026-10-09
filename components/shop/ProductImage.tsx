/** Renders an uploaded photo, or falls back to the emoji stored in `image`. */
export default function ProductImage({ image, name, size = 'md' }: { image?: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const isUrl = !!image && (image.startsWith('/') || image.startsWith('http'));
  return (
    <span className={`pimg pimg-${size}`}>
      {isUrl ? <img src={image!} alt={name} loading="lazy" /> : <span aria-hidden>{image || '🛒'}</span>}
    </span>
  );
}
