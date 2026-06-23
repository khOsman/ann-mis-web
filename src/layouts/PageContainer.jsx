export default function PageContainer({ children, className = "" }) {
  return (
    <div className={`w-full max-w-[1440px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 ${className}`}>
      {children}
    </div>
  );
}