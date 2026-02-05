import { Helmet } from "react-helmet-async";
import {
  canonicalUrl,
  DEFAULT_OG_IMAGE_URL,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_TYPE,
} from "@/lib/seo";

interface PublicPageMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  /** Default: from site OG image (1200). Omit for external images to avoid wrong values. */
  imageWidth?: number;
  /** Default: from site OG image (630). */
  imageHeight?: number;
  /** Default: image/png. */
  imageType?: string;
  /** Default: title. */
  twitterImageAlt?: string;
  noIndex?: boolean;
}

/**
 * Sets document head for public indexable pages: title, description, canonical, OG, Twitter, hreflang (en, ar, x-default).
 */
export function PublicPageMeta({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE_URL,
  imageWidth = DEFAULT_OG_IMAGE_WIDTH,
  imageHeight = DEFAULT_OG_IMAGE_HEIGHT,
  imageType = DEFAULT_OG_IMAGE_TYPE,
  twitterImageAlt,
  noIndex = false,
}: PublicPageMetaProps) {
  const canonical = canonicalUrl(path);
  const imageAlt = twitterImageAlt ?? title;
  const isDefaultImage = image === DEFAULT_OG_IMAGE_URL;
  const showDimensions = isDefaultImage;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <link rel="canonical" href={canonical} />
          <link rel="alternate" hrefLang="en" href={canonical} />
          <link rel="alternate" hrefLang="ar" href={canonical} />
          <link rel="alternate" hrefLang="x-default" href={canonical} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={canonical} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={image} />
          <meta property="og:image:alt" content={imageAlt} />
          {showDimensions && (
            <>
              <meta property="og:image:width" content={String(imageWidth)} />
              <meta property="og:image:height" content={String(imageHeight)} />
              <meta property="og:image:type" content={imageType} />
            </>
          )}
          <meta property="og:site_name" content="Shyftcut" />
          <meta property="og:locale" content="en_US" />
          <meta property="og:locale:alternate" content="ar_SA" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={canonical} />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={image} />
          <meta name="twitter:image:alt" content={imageAlt} />
        </>
      )}
    </Helmet>
  );
}
