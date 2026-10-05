/** Full-screen immersive shell (covers main site header/footer when pathname detection misses). */
export default function LearningAssistantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden" data-lenis-prevent>
      {children}
    </div>
  );
}
