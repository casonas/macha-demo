import { withMutatingAuth } from "@/lib/mutatingAuth";

function getEnv() {
  return process.env as unknown as Record<string, string>;
}

export async function POST(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  return withMutatingAuth(request, async (req) => {
    const { agentId } = params;
    return Response.json({ status: "ok", agentId });
  });
}
