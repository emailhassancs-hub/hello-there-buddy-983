import { useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { StoryNodeComponent } from "./StoryNodeComponent";

const nodeTypes = {
  storyNode: StoryNodeComponent,
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "storyNode",
    position: { x: 250, y: 50 },
    data: {
      label: "Temple Intro",
      sceneType: "cutscene",
      description: "Sacred Diamond shown, Mia guards it",
    },
  },
  {
    id: "2",
    type: "storyNode",
    position: { x: 250, y: 180 },
    data: {
      label: "Villain Attacks",
      sceneType: "gameplay",
      description: "Magma fights villain but loses, diamond stolen",
    },
  },
  {
    id: "3",
    type: "storyNode",
    position: { x: 250, y: 310 },
    data: {
      label: "Chun-Li Returns",
      sceneType: "cutscene",
      description: "Sees destruction, suspects Madara",
      video: "Video_of_Model_Performing_Leg_Kicks",
    },
  },
  {
    id: "4",
    type: "storyNode",
    position: { x: 250, y: 440 },
    data: {
      label: "Confrontation with Madara",
      sceneType: "cutscene",
      video: "Character_Fighting_Moves_Video_Generation",
    },
  },
  {
    id: "5",
    type: "storyNode",
    position: { x: 250, y: 570 },
    data: {
      label: "Battle vs Madara",
      sceneType: "boss",
      description: "Anime_Face_Off_Challenge_Accepted",
      isBranching: true,
    },
  },
  {
    id: "6a",
    type: "storyNode",
    position: { x: 100, y: 700 },
    data: {
      label: "Outcome A: Lose",
      sceneType: "cutscene",
      description: "Madara escapes",
    },
  },
  {
    id: "6b",
    type: "storyNode",
    position: { x: 400, y: 700 },
    data: {
      label: "Outcome B: Win",
      sceneType: "cutscene",
      video: "the_first_character_walks_away",
    },
  },
  {
    id: "7",
    type: "storyNode",
    position: { x: 250, y: 830 },
    data: {
      label: "Continue Journey",
      sceneType: "gameplay",
      description: "Battle smaller villains",
    },
  },
  {
    id: "8",
    type: "storyNode",
    position: { x: 250, y: 960 },
    data: {
      label: "Magma Encounter",
      sceneType: "boss",
      description: "Final battle vs Magma",
    },
  },
  {
    id: "9",
    type: "storyNode",
    position: { x: 250, y: 1090 },
    data: {
      label: "Rescue Mia",
      sceneType: "cutscene",
      description: "Sisters fight together",
      video: "Chun_Li_and_Mai_Fight_Enemies.mp4",
      isEnd: true,
    },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2-3", source: "2", target: "3", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e3-4", source: "3", target: "4", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e4-5", source: "4", target: "5", markerEnd: { type: MarkerType.ArrowClosed } },
  {
    id: "e5-6a",
    source: "5",
    target: "6a",
    label: "Lose",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#F5A623" },
  },
  {
    id: "e5-6b",
    source: "5",
    target: "6b",
    label: "Win",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#F5A623" },
  },
  { id: "e6a-7", source: "6a", target: "7", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e6b-7", source: "6b", target: "7", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e7-8", source: "7", target: "8", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e8-9", source: "8", target: "9", markerEnd: { type: MarkerType.ArrowClosed } },
];

export const StoryGraph = () => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: any, node: Node) => {
    console.log("Node clicked:", node);
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
