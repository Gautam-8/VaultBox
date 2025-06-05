export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid place-items-center p-4 relative bg-background overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20">
          <div className="absolute inset-0 bg-primary rounded-full blur-3xl animate-blob" />
          <div className="absolute inset-0 bg-secondary rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute inset-0 bg-accent rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 w-full">{children}</main>
    </div>
  );
} 