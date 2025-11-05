import { useState } from "react";
import { motion } from "framer-motion";
import { Folder, File, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fileContents } from "@/data/story-files";

interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
}

const fileTree: FileNode = {
  name: "game-project",
  type: "folder",
  children: [
    {
      name: "story",
      type: "folder",
      children: [
        { name: "abstract.txt", type: "file", content: "abstract" },
        { name: "branching_graph.json", type: "file", content: "graph" },
        {
          name: "scenes",
          type: "folder",
          children: [
            { name: "scene_1_temple_intro.txt", type: "file", content: "scene1" },
            { name: "scene_2_villain_attacks.txt", type: "file", content: "scene2" },
            { name: "scene_3_chunli_return.txt", type: "file", content: "scene3" },
            { name: "scene_4_madara_confrontation.txt", type: "file", content: "scene4" },
            { name: "scene_5_battle_madara.txt", type: "file", content: "scene5" },
            { name: "scene_6_journey_shadows.txt", type: "file", content: "scene6" },
            { name: "scene_7_magma_encounter.txt", type: "file", content: "scene7" },
            { name: "scene_8_rescue_mia.txt", type: "file", content: "scene8" },
          ],
        },
      ],
    },
    {
      name: "characters",
      type: "folder",
      children: [
        { name: "chunli.json", type: "file", content: "chunli" },
        { name: "madara.json", type: "file", content: "madara" },
        { name: "magma.json", type: "file", content: "magma" },
        { name: "mia.json", type: "file", content: "mia" },
      ],
    },
    {
      name: "assets",
      type: "folder",
      children: [
        { name: "sacred_diamond.json", type: "file", content: "diamond" },
      ],
    },
  ],
};

const FileTreeNode = ({ node, level = 0 }: { node: FileNode; level?: number }) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);

  const handleFileClick = (name: string, contentKey?: string) => {
    if (contentKey && fileContents[contentKey]) {
      setSelectedFile({ name, content: fileContents[contentKey] });
    }
  };

  return (
    <>
      <div className="select-none">
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-2 hover:bg-accent/50 cursor-pointer rounded-sm transition-colors",
            level === 0 && "font-semibold"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (node.type === "folder") {
              setIsOpen(!isOpen);
            } else {
              handleFileClick(node.name, node.content);
            }
          }}
        >
          {node.type === "folder" && (
            <span className="text-muted-foreground">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          )}
          {node.type === "folder" ? (
            <Folder className="h-4 w-4 text-primary" />
          ) : (
            <File className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">{node.name}</span>
        </div>
        {node.type === "folder" && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child, index) => (
              <FileTreeNode key={`${child.name}-${index}`} node={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-4 w-4" />
              {selectedFile?.name}
            </DialogTitle>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto whitespace-pre-wrap">
            {selectedFile?.content}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const FileExplorer = () => {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        Project Files
      </h3>
      <FileTreeNode node={fileTree} />
    </div>
  );
};
