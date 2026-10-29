import { DndContext } from "@dnd-kit/core";

export function List() {
  return (
    <DndContext>
      <button type="button">Move up</button>
      <button type="button">Move down</button>
    </DndContext>
  );
}
