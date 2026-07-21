import { useState, type ImgHTMLAttributes } from "react";

type OptimizedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  priority?: boolean;
};

export function responsiveSrcSet(src: string): string | undefined {
  const match = src.match(/^(.*\/uploads\/)([a-f0-9]{32})\.webp(?:\?.*)?$/i);
  if (!match) return undefined;
  const [, prefix, stem] = match;
  return [320, 640, 1200]
    .map((width) => `${prefix}${stem}-${width}.webp ${width}w`)
    .join(", ");
}

export function preloadOptimizedImage(src: string, sizes = "100vw"): Promise<void> {
  return new Promise((resolve) => {
    if (!src) {
      resolve();
      return;
    }

    const image = new Image();
    const srcSet = responsiveSrcSet(src);
    if (srcSet) {
      image.srcset = srcSet;
      image.sizes = sizes;
    }

    const finish = () => resolve();
    image.onload = () => {
      if (typeof image.decode === "function") {
        image.decode().catch(() => undefined).finally(finish);
      } else {
        finish();
      }
    };
    image.onerror = finish;
    image.src = src;
  });
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
  const srcSet = responsiveSrcSet(src);

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
          {...props}
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
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
            setFailed(true);
            onError?.(event);
          }}
        />
      )}
    </>
  );
}
