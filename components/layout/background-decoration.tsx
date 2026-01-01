export default function BackgroundDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* グラデーションオーブ */}
      <div
        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-60 bg-radial from-orange-500/80 to-transparent rounded-full blur-xl"
      />
      <div className="absolute -bottom-50 -left-50 size-140 bg-radial from-orange-500 to-transparent rounded-full blur-xl" />
    </div>
  );
}
