import { Trash } from "lucide-react";
import { DeleteDialog } from "../../components/delete-dialog";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <main id="content">
      <h1>Dashboard</h1>
      <button type="button">Clear filters</button>
      <button type="button" className="size-10" aria-label="Delete project">
        <Trash />
        <span className="sr-only">Delete project</span>
      </button>
      <a href="/projects/1/edit" className="inline-flex h-6 min-w-6 items-center px-2">
        Edit project
      </a>
      <DeleteDialog />
    </main>
  );
}
