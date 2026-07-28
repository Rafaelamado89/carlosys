import { ExternalLink, Image as ImageIcon } from "lucide-react";

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function LinkPreviewCard({
  url,
  imageUrl,
  title,
  className = "",
}: {
  url: string;
  imageUrl?: string | null;
  title?: string | null;
  className?: string;
}) {
  const domain = domainOf(url);
  const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`group flex items-center gap-4 p-3 rounded-xl border bg-background hover:border-primary transition-colors ${className}`}
    >
      <div className="h-20 w-20 shrink-0 rounded-lg border bg-muted overflow-hidden grid place-items-center">
        {imageUrl ? (
          <img src={imageUrl} alt={title || `Imagem de ${domain}`} className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate group-hover:text-primary">{title || domain}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate mt-0.5">
          <img src={favicon} alt="" className="h-3.5 w-3.5 rounded-sm" />
          {domain}
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-2">
          <ExternalLink className="h-3.5 w-3.5" /> Abrir no site
        </div>
      </div>
    </a>
  );
}

export function LinkThumb({ url, imageUrl }: { url: string; imageUrl?: string | null }) {
  const domain = domainOf(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={`Abrir em ${domain}`}
      className="h-12 w-12 shrink-0 rounded-lg border bg-muted overflow-hidden grid place-items-center hover:border-primary"
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`Imagem de ${domain}`} className="h-full w-full object-contain" loading="lazy" />
      ) : (
        <img
          src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`}
          alt={domain}
          className="h-5 w-5"
        />
      )}
    </a>
  );
}
