import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

async function handleRequest(request: Request) {
  const auth = await getAuth();
  const handlers = toNextJsHandler(auth);
  const method = request.method as keyof typeof handlers;
  const routeHandler = handlers[method];
  if (!routeHandler) {
    return new Response("Method not allowed", { status: 405 });
  }
  return routeHandler(request);
}

export {
  handleRequest as GET,
  handleRequest as POST,
  handleRequest as PUT,
  handleRequest as PATCH,
  handleRequest as DELETE,
};
