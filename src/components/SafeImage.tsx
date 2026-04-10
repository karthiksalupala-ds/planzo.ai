import { useEffect, useState } from "react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK =
  "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800";

const SafeImage = ({ src, fallbackSrc = DEFAULT_FALLBACK, alt = "", ...props }: SafeImageProps) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
};

export default SafeImage;
