import { listTrackedPeople } from "./people.js";
import { buildPersonOverview } from "./overview.js";

export interface TeamGridTag {
  id: string;
  name: string;
}

export interface TeamGridCell {
  noteCount: number;
  lastDate?: string;
}

export interface TeamGridRow {
  slug: string;
  name: string;
  cells: Record<string, TeamGridCell | null>;
}

export interface TeamGrid {
  tags: TeamGridTag[];
  rows: TeamGridRow[];
}

export function buildTeamGrid(workspacePath: string): TeamGrid {
  const people = listTrackedPeople(workspacePath);
  const overviews = people.map((p) => ({
    slug: p.slug,
    overview: buildPersonOverview(workspacePath, p.record.name),
  }));

  const tagMap = new Map<string, string>();
  for (const { overview } of overviews) {
    for (const section of overview.sections) {
      if (!tagMap.has(section.tagId)) {
        tagMap.set(section.tagId, section.tagName);
      }
    }
  }
  const tags: TeamGridTag[] = Array.from(tagMap, ([id, name]) => ({ id, name }));

  const rows: TeamGridRow[] = overviews.map(({ slug, overview }) => {
    const cells: Record<string, TeamGridCell | null> = {};
    const sectionsById = new Map(overview.sections.map((s) => [s.tagId, s]));

    for (const tag of tags) {
      const section = sectionsById.get(tag.id);
      cells[tag.id] = section
        ? { noteCount: section.noteCount, lastDate: section.lastDate }
        : null;
    }

    return { slug, name: overview.personName, cells };
  });

  return { tags, rows };
}