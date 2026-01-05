export default function SectionContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 lg:px-0 w-full min-h-screen flex flex-col items-center justify-center">
      {children}
    </div>
  );
}
