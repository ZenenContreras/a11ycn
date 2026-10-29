import { Trash } from "lucide-react";
import { DeleteDialog } from "../../components/delete-dialog";

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      <span onClick={() => {}}>Clear filters</span>
      <button type="button" className="size-5">
        <Trash />
      </button>
      <a href="/projects/1/edit" className="h-4 w-4">
        Edit
      </a>
      <DeleteDialog />
    </main>
  );
}
