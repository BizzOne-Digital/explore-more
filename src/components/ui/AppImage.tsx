"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { PLACEHOLDER_IMAGE, resolveImageUrl } from "@/lib/images/resolve";

type AppImageProps = Omit<ImageProps, "src"> & {
  src: string | undefined | null;
};

/** next/image wrapper with legacy upload fallback and placeholder on error. */
export function AppImage({ src, alt, onError, ...props }: AppImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = failed ? PLACEHOLDER_IMAGE : resolveImageUrl(src);

  return (
    <Image
      {...props}
      src={resolved}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
