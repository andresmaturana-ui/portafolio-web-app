import { NextResponse } from "next/server";
import { getSettings } from "@/lib/get-settings";

export const dynamic = "force-dynamic";

// El logo vive en una sola URL: apunta al subido en /admin/ajustes o al de fábrica.
export async function GET(request: Request) {
  const { logo_url } = await getSettings();
  const res = NextResponse.redirect(logo_url ?? new URL("/logo.png", request.url), 307);
  res.headers.set("Cache-Control", "public, max-age=60, s-maxage=60");
  return res;
}
