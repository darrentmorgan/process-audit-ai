/**
 * Simple RAG retriever for n8n node docs and patterns.
 * In dev, uses a local JSON index; in prod, can query Supabase pgvector.
 */

const DEFAULT_TOP_K = 6;

// Local index placeholder; to be replaced by real ingestion
let localIndex = [];

export function loadLocalIndex(docs = []) {
  localIndex = Array.isArray(docs) ? docs : [];
}

function simpleScore(text, query) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let score = 0;
  q.split(/\s+/).forEach(token => {
    if (!token) return;
    const count = (t.match(new RegExp(token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
    score += count;
  });
  return score;
}

/**
 * Retrieve relevant documentation chunks.
 * @param {Object} params
 * @param {string} params.task - Brief task summary
 * @param {string[]} [params.nodeTypes] - n8n node types (e.g., httpRequest, emailSend)
 * @param {Object} [params.paramsHint] - key parameter hints (e.g., { retryOnFail: true })
 * @param {number} [topK]
 * @returns {Array<{title: string, url?: string, content: string}>}
 */
export function getRelevantDocs({ task, nodeTypes = [], paramsHint = {} }, topK = DEFAULT_TOP_K) {
  const queries = [];
  queries.push(task || 'n8n workflow');
  nodeTypes.forEach(nt => queries.push(`n8n ${nt}`));
  Object.keys(paramsHint || {}).forEach(p => queries.push(`n8n ${p}`));

  const ranked = localIndex
    .map(doc => ({
      doc,
      score: Math.max(...queries.map(q => simpleScore(`${doc.title} ${doc.content}`, q)))
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(x => x.doc);

  return ranked;
}

export default { getRelevantDocs, loadLocalIndex };
