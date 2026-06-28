import { IncomingMessage, ServerResponse, createServer } from "http";

const mockRoutes: Record<string, unknown> = {
  "/api/health": { status: "ok" },
  "/api/auth/me": { id: "mock-user-1", name: "Mock User", email: "mock@example.com" },
  "/api/creators": [{ id: "c1", name: "Mock Creator" }],
  "/api/payments": [{ id: "p1", amount: 500, status: "confirmed" }],
};

function handler(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? "/";
  const body = mockRoutes[url];
  if (body) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
}

export function startMockServer(port = 4001): void {
  const server = createServer(handler);
  server.listen(port, () =>
    console.log(`Mock API server running at http://localhost:${port}`)
  );
}
