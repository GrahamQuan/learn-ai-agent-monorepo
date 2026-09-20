import { env } from "../env.js";
import { BaseDocumentCompressor } from "@langchain/core/retrievers/document_compressors";
import type { Document } from "@langchain/core/documents";
import type { Callbacks } from "@langchain/core/callbacks/manager";

export class DashScopeRerank extends BaseDocumentCompressor {
  declare apiKey: string | undefined;
  declare model: string;
  declare topN: number;
  declare baseUrl: string | undefined;

  constructor({ apiKey, model = env.RERANK_MODEL, topN = 3, baseUrl }: { apiKey?: string; model?: string; topN?: number; baseUrl?: string } = {}) {
    super();
    this.apiKey = apiKey;
    this.model = model;
    this.topN = topN;
    this.baseUrl = baseUrl ?? env.RERANK_URL;
  }

  async compressDocuments(documents: Document[], query: string, _callbacks?: Callbacks): Promise<Document[]> {
    const res = await fetch(this.baseUrl!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: {
          query,
          documents: documents.map((d) => d.pageContent),
        },
        parameters: {
          return_documents: false,
          top_n: this.topN,
        },
      }),
    });

    const json = await res.json() as { output?: { results?: { index: number; relevance_score?: number }[] } };
    if (!res.ok) {
      throw new Error(
        `DashScope rerank ${res.status}: ${JSON.stringify(json)}`,
      );
    }

    const results = json?.output?.results;
    if (!Array.isArray(results)) {
      throw new Error(`unexpected rerank response: ${JSON.stringify(json)}`);
    }

    return results.map((item) => documents[item.index]!);
  }
}
