export default function PageContainer({
  children,
  className = "",
}) {
  return (
    <div
      className={`w-full max-w-[1280px] mx-auto px-4 lg:px-5 ${className}`}
    >
      {children}
    </div>
  );
}