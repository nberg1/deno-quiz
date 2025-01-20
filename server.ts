import { generateQuestion } from "./fetch-data.ts";

const handler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // Serve CSS file


    // Serve script file

    // Serve HTML file
    if (req.method === "GET" && url.pathname === "/") {
        const html = await Deno.readTextFile("./index.html");
        return new Response(html, {
            headers: { "Content-Type": "text/html"},
        });
    } else if (req.method === "GET" && url.pathname === "/question") {
        try {
            const question = generateQuestion();
            console.log(question);
            return new Response(JSON.stringify(question), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error: any) {
            console.error("Error generating question:", error.message);
            return new Response("Failed to generate question", { status: 500 });
        }
      }
    return new Response("Not Found", { status: 404 });
};

console.log("Server running at http://localhost:8000");
await Deno.serve({ port: 8000 }, handler);