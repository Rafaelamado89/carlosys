import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function pickMeta(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

export const fetchLinkPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string }) => {
    const u = new URL(input.url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("URL inválido");
    return { url: u.toString() };
  })
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; WorkshopERP/1.0)" },
        redirect: "follow",
      });
      if (!res.ok) return { image: null as string | null, title: null as string | null };
      const html = (await res.text()).slice(0, 400_000);

      const image = pickMeta(html, [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
        /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
      ]);
      const title = pickMeta(html, [
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
        /<title[^>]*>([^<]+)<\/title>/i,
      ]);

      const absolute = image ? new URL(image, data.url).toString() : null;
      return { image: absolute, title };
    } catch {
      return { image: null as string | null, title: null as string | null };
    }
  });
