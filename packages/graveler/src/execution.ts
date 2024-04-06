import { NODES } from './nodes/index.js';
import { Flow } from './types.js';

function bfs(flow: Flow): string[] {
  const inDegree: Record<string, number> = Object.fromEntries(
    flow.nodes.map(node => [node.id, 0]),
  );
  const adjacentIds: Record<string, string[]> = Object.fromEntries(
    flow.nodes.map(node => [node.id, []]),
  );

  for (const edge of flow.edges) {
    adjacentIds[edge.source].push(edge.target);
  }

  for (const node of flow.nodes) {
    for (const id of adjacentIds[node.id]) {
      inDegree[id]++;
    }
  }

  const queue: string[] = [];
  for (const node of flow.nodes) {
    if (inDegree[node.id] === 0) {
      queue.push(node.id);
    }
  }

  const visitedIds: string[] = [];
  while (queue.length !== 0) {
    const currentId = queue.shift()!;
    visitedIds.push(currentId);

    for (const id of adjacentIds[currentId]) {
      inDegree[id]--;
      if (inDegree[id] === 0) {
        queue.push(id);
      }
    }
  }

  if (visitedIds.length !== flow.nodes.length) {
    throw new Error('Cyclic graph detected');
  }

  return visitedIds;
}

export async function execute(flow: Flow) {
  const nodeById = Object.fromEntries(flow.nodes.map(node => [node.id, node]));
  const order = bfs(flow);
  const nodeInputSources: Record<
    string,
    Record<string, { source: string; sourceHandle: string }>
  > = Object.fromEntries(flow.nodes.map(node => [node.id, {}]));
  const nodeOutputs: Record<string, Record<string, any>> = Object.fromEntries(
    flow.nodes.map(node => [node.id, {}]),
  );

  for (const edge of flow.edges) {
    nodeInputSources[edge.target][edge.targetHandle] = {
      source: edge.source,
      sourceHandle: edge.sourceHandle,
    };
  }

  for (const id of order) {
    const node = nodeById[id];
    const { type, args } = node.data;
    const nodeDef = NODES[type];
    if (!nodeDef) {
      throw new Error(`Invalid node type: ${type}`);
    }

    const inputs: Record<string, any> = {};
    const sources = Object.entries(nodeInputSources[id]);
    for (const [key, source] of sources) {
      // TODO: Verify required
      inputs[key] = nodeOutputs[source.source][source.sourceHandle];
    }

    // TODO: Wrap in try catch
    // TODO: Partial results for preview
    const outputs = await nodeDef.run({ args, inputs });
    console.log('EXEC:', id, outputs);

    nodeOutputs[id] = outputs;
  }
}
