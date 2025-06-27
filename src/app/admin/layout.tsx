
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The root layout now handles the admin header and theme.
  // This layout just needs to pass children through.
  return <>{children}</>;
}
