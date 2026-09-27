import { httpRouter } from "convex/server";
import { ingestHttp } from "./ingest";

const http = httpRouter();

// Automatic bank-alert import (iPhone Shortcut SMS + Gmail Apps Script). See convex/ingest.ts.
http.route({ path: "/ingest", method: "POST", handler: ingestHttp });

export default http;
