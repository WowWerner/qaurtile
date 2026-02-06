import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_BASE = "http://34.132.34.189:3000/api";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "tables/count";
    const limit = url.searchParams.get("limit") || "";
    const offset = url.searchParams.get("offset") || "";

    let apiUrl = `${API_BASE}/${path}`;
    const params = new URLSearchParams();
    if (limit) params.set("limit", limit);
    if (offset) params.set("offset", offset);
    const qs = params.toString();
    if (qs) apiUrl += `?${qs}`;

    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Proxy request failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
