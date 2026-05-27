export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen relative overflow-hidden">{children}</div>;
}
