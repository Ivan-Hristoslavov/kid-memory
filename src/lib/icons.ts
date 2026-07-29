import {
  Aperture,
  Bird,
  BookHeart,
  Brush,
  Bug,
  Castle,
  Cat,
  Dog,
  Drama,
  Feather,
  Fish,
  Panda,
  PawPrint,
  Rabbit,
  Rat,
  Snail,
  Squirrel,
  Turtle,
  Wand2,
  type LucideIcon,
} from "lucide-react";

/** Maps catalog `icon` names (animals + styles) to lucide components. */
const ICON_MAP: Record<string, LucideIcon> = {
  // animals
  Dog,
  Cat,
  Rabbit,
  Panda,
  Bird,
  Feather,
  Fish,
  Turtle,
  Squirrel,
  Snail,
  Bug,
  Rat,
  // styles
  Aperture,
  BookHeart,
  Castle,
  Drama,
  Brush,
  Wand2,
};

export function iconFor(name: string): LucideIcon {
  return ICON_MAP[name] ?? PawPrint;
}
