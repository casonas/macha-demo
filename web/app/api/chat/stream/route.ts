import { withMutatingAuth } from "@/lib/mutatingAuth";

function getEnv() {
  return process.env as unknown as Record<string, string>;
}

export async function POST(request: Request) {
  return withMutatingAuth(request, async (req) => {
    return Response.json({ status: "ok" });
  });
}
