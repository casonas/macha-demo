function getEnv() {
  return process.env as unknown as Record<string, string>;
}

export async function GET(request: Request) {
  return Response.json({ status: "ok", service: "r2" });
}
