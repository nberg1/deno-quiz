import { generateQuestion } from "./fetch-data.ts";

const handler = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    // Serve CSS file
    if (url.pathname === "/styles.css") {
        const css = await Deno.readTextFile("./styles.css");
        return new Response(css, {
          headers: { "Content-Type": "text/css" },
        });
      }

    // Serve script file
    if (url.pathname === "/script.js") {
        const script = await Deno.readTextFile("./script.js");
        return new Response(script, {
          headers: { "Content-Type": "application/javascript" },
        });
    }


    // Serve HTML file
    if (url.pathname === "/") {
        const html = await Deno.readTextFile("./index.html");
        return new Response(html, {
            headers: { "Content-Type": "text/html"},
        });
    } 
    
    // Fetch data and generate question
    if (url.pathname === "/question") {
        try {
            const question = await generateQuestion();
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