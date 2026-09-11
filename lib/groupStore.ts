import { seedGroupEvents, type GroupEvent } from '@/data/groupFixtures';

let extraEvents: GroupEvent[] = [];

export function listGroupEvents(): GroupEvent[] {
  return [...extraEvents, ...seedGroupEvents];
}

export function getGroupEvent(id: string): GroupEvent | undefined {
  return listGroupEvents().find((row) => row.id === id);
}

export function createGroupEvent(
  patch?: Partial<Pick<GroupEvent, 'title' | 'dateLabel'>>,
): GroupEvent {
  const template = seedGroupEvents[0]!;
  const created: GroupEvent = {
    ...template,
    id: `group-${Date.now()}`,
    title: patch?.title ?? 'New group outing',
    dateLabel: patch?.dateLabel ?? 'Soon',
    members: template.members.map((m) => ({ ...m })),
  };
  extraEvents = [created, ...extraEvents];
  return created;
}
