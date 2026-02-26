// Loading UI for project detail route

export default function ProjectDetailLoading() {
  return (
    <div className="flex-1 p-6 flex flex-col gap-6">
      <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="h-64 rounded-xl bg-muted animate-pulse" />
    </div>
  );
}
