// lib/sse.ts —— SSE(text/event-stream)响应小工具,搜索路由共用
import "server-only";

export type Send = (event: string, data?: Record<string, unknown>) => void;

/** 把一个 async handler 包成 SSE Response;handler 抛错自动发 error 事件并收尾。 */
export function sseResponse(run: (send: Send) => Promise<void>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send: Send = (event, data = {}) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
        } catch {
          /* 客户端已断开 */
        }
      };
      try {
        await run(send);
      } catch (e) {
        send("error", { message: e instanceof Error ? e.message : "失败" });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
