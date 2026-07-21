import { useEffect, useState, type ImgHTMLAttributes } from "react";

type OptimizedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  priority?: boolean;
};

function responsiveSrcSet(src: string): string | undefined {
  const match = src.match(/^(.*\/uploads\/)([a-f0-9]{32})\.webp(?:\?.*)?$/i);
  if (!match) return undefined;
  const [, prefix, stem] = match;
  return [320, 640, 1200]
    .map((width) => `${prefix}${stem}-${width}.webp ${width}w`)
    .join(", ");
}

export default function OptimizedImage({
  src,
  alt = "",
  className = "",
  priority = false,
  sizes,
  width = 640,
  height = 640,
  style,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [useResponsiveVariant, setUseResponsiveVariant] = useState(true);
  const srcSet = responsiveSrcSet(src);
  const activeSrcSet = useResponsiveVariant ? srcSet : undefined;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setUseResponsiveVariant(true);
  }, [src]);

  return (
    <>
      {!loaded && (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.04] via-sakura/[0.08] to-crimson/[0.08]"
        />
      )}
      {!failed && (
        <img
          key={`${src}:${activeSrcSet ? "responsive" : "original"}`}
          {...props}
          src={src}
          srcSet={activeSrcSet}
          sizes={activeSrcSet ? sizes : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`${className} transition-[opacity,transform] duration-300`}
          style={{ ...style, opacity: loaded ? style?.opacity : 0 }}
          onLoad={(event) => {
            setLoaded(true);
            onLoad?.(event);
          }}
          onError={(event) => {
            if (activeSrcSet) {
              // A partially completed legacy migration can leave the canonical
              // WebP in place without every responsive variant. Retry the
              // canonical source before treating the image as unavailable.
              setLoaded(false);
              setUseResponsiveVariant(false);
              return;
            }
            setFailed(true);
            onError?.(event);
          }}
        />
      )}
    </>
  );
}
