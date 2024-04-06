import { Flow, NodeData, NodeType } from '@graveler/graveler';
import { nanoid } from 'nanoid';
import React, { useCallback, useContext, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Connection,
  Controls,
  Edge,
  Handle,
  Position,
  // Handle,
  // Position,
  ReactFlowInstance,
  ReactFlowProvider,
  updateEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';

import './App.scss';
import { API, TRPC } from './common/api';

function NodeView({ id, data }: { id: string; data: NodeData }) {
  const { availableNodes, setNodeValue } = useContext(AppContext);
  const nodeDef = availableNodes[data.type];

  return (
    <div className="node">
      <div className="name">{nodeDef.label}</div>
      <div className="handles">
        <div className="inputs">
          {nodeDef.inputTypes &&
            Object.entries(nodeDef.inputTypes).map(([key, type]) => (
              <div className="handle" key={key}>
                <Handle type="target" id={key} position={Position.Left} />
                <span className="handle_info">
                  <span className="handle_label">{type.label}</span>
                  <span className="handle_type">({type.type})</span>
                </span>
              </div>
            ))}
        </div>
        <div className="outputs">
          {nodeDef.outputTypes &&
            Object.entries(nodeDef.outputTypes).map(([key, type]) => (
              <div className="handle" key={key}>
                <span className="handle_info">
                  <span className="handle_label">{type.label}</span>
                  <span className="handle_type">({type.type})</span>
                </span>
                <Handle type="source" id={key} position={Position.Right} />
              </div>
            ))}
        </div>
      </div>
      <div className="arguments">
        {nodeDef.argTypes &&
          Object.entries(nodeDef.argTypes).map(([key, type]) => (
            <div key={key} className="argument">
              <span className="argName">{type.label}</span>
              <span className="argValue">
                <input
                  type="string"
                  value={data.args[key]}
                  onChange={e => {
                    setNodeValue(id, key, e.target.value);
                  }}
                />
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

const nodeTypes = { node: NodeView };

const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  const { availableNodes, execute } = useContext(AppContext);

  return (
    <div className="sidebar">
      <div className="description">
        You can drag these nodes to the pane on the right.
      </div>
      <div className="actions">
        <button onClick={execute}>Execute</button>
      </div>
      {Object.entries(availableNodes).map(([type, node]) => (
        <div
          key={type}
          className="dragNode"
          onDragStart={event => onDragStart(event, type)}
          draggable
        >
          {node.label}
        </div>
      ))}
    </div>
  );
};

const AppContext = React.createContext<{
  availableNodes: Record<string, NodeType>;
  execute: () => void;
  setNodeValue: (nodeId: string, key: string, value: any) => void;
}>(undefined as any);

export const App: React.FC = () => {
  const reactFlowInstance = useRef<ReactFlowInstance>();
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (connection: Connection) => setEdges(eds => addEdge(connection, eds)),
    [setEdges],
  );
  const availableNodesQuery = TRPC.node.all.useQuery();
  const availableNodes = availableNodesQuery.data;
  const edgeUpdateSuccessful = useRef(true);

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeUpdateSuccessful.current = true;
      setEdges(els => updateEdge(oldEdge, newConnection, els));
    },
    [setEdges],
  );

  const onEdgeUpdateEnd = useCallback(
    (_: any, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        setEdges(eds => eds.filter(e => e.id !== edge.id));
      }

      edgeUpdateSuccessful.current = true;
    },
    [setEdges],
  );
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  const isValidConnextion = useCallback(
    (connection: Connection) => {
      if (
        connection.source === connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
      ) {
        return false;
      }

      const sourceNode = nodes.find(node => node.id === connection.source);
      const targetNode = nodes.find(node => node.id === connection.target);
      if (!sourceNode || !targetNode) {
        return false;
      }

      const sourceNodeDef = availableNodes?.[sourceNode.data.type];
      const targetNodeDef = availableNodes?.[targetNode.data.type];
      if (!sourceNodeDef || !targetNodeDef) {
        return false;
      }

      return (
        sourceNodeDef.outputTypes?.[connection.sourceHandle]?.type ===
        targetNodeDef.inputTypes?.[connection.targetHandle]?.type
      );
    },
    [nodes, availableNodes],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const instance = reactFlowInstance?.current;
      if (!instance) {
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const nodeDef = availableNodes?.[type];
      if (!nodeDef) {
        return;
      }

      // reactFlowInstance.project was renamed to reactFlowInstance.screenToFlowPosition
      // and you don't need to subtract the reactFlowBounds.left/top anymore
      // details: https://reactflow.dev/whats-new/2023-11-10
      const position = instance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const args: Record<string, any> = {};
      if (nodeDef.argTypes) {
        for (const [key] of Object.entries(nodeDef.argTypes)) {
          args[key] = undefined;
        }
      }
      const newNode = {
        id: nanoid(),
        type: 'node',
        position,
        data: { type, args },
      };

      setNodes(nds => nds.concat(newNode));
    },
    [setNodes, availableNodes],
  );

  const execute = () => {
    const flow: Flow = {
      nodes: nodes.map(node => ({ id: node.id, data: node.data })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle!,
        target: edge.target,
        targetHandle: edge.targetHandle!,
      })),
    };

    API.flow.execute.mutate(flow);
  };

  const setNodeValue = useCallback(
    (nodeId: string, key: string, value: any) => {
      setNodes(nodes =>
        nodes.map(node =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  args: { ...node.data.args, [key]: value },
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  return (
    <AppContext.Provider
      value={{ availableNodes: availableNodes || {}, execute, setNodeValue }}
    >
      <ReactFlowProvider>
        <div className="wrapper">
          <Sidebar />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeUpdate={onEdgeUpdate}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            isValidConnection={isValidConnextion}
            onConnect={onConnect}
            onInit={instance => (reactFlowInstance.current = instance)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </AppContext.Provider>
  );
};
