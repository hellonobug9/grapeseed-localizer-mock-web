import {
  AppWindow,
  Backpack,
  Bell,
  BookBookmark,
  Building,
  ChartLine,
  Clapperboard,
  Heart,
  Hexagon,
  MessageCircleMore,
  Presentation,
  Puzzle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PROJECT_COLORS } from "@/constants/project";
import { cn } from "@/lib/utils";
import type { ProjectInfo } from "@/types/project";

const ICONS: LucideIcon[] = [
  Building,
  Users,
  ChartLine,
  Clapperboard,
  BookBookmark,
  Bell,
  MessageCircleMore,
  Backpack,
  Puzzle,
  Hexagon,
  Heart,
  AppWindow,
  Presentation,
];

const SIZES = {
  sm: "size-[30px] rounded-lg [&_svg]:size-4",
  md: "size-10 rounded-[11px] [&_svg]:size-5",
  lg: "size-14 rounded-[15px] [&_svg]:size-7",
};

// The API returns no icon or color, so both are picked from the project id;
// the same project always gets the same pair.
const indexById = (length: number, id: number) => (((id - 1) % length) + length) % length;

const projectColor = (id: number) => PROJECT_COLORS[indexById(PROJECT_COLORS.length, id)];

type ProjectIconProps = {
  project: Pick<ProjectInfo, "id" | "name">;
  size?: keyof typeof SIZES;
  className?: string;
};

export function ProjectIcon({ project, size = "md", className }: ProjectIconProps) {
  const Icon = ICONS[indexById(ICONS.length, project.id)];
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center text-white", SIZES[size], className)}
      style={{ background: projectColor(project.id) }}
      title={project.name}
    >
      <Icon />
    </span>
  );
}

export function ProjectDot({ projectId, className }: { projectId: number; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ background: projectColor(projectId) }}
    />
  );
}
