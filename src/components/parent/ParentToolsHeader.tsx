import { ResourceToolNav } from "@/components/resources/ResourceToolNav";

type ParentToolsHeaderProps = {
  title: string;
  description: string;
};

export function ParentToolsHeader({ title, description }: ParentToolsHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">{title}</h2>
        <p className="mt-1 text-explore-charcoal/70">{description}</p>
      </div>
      <ResourceToolNav basePath="/parent/tools" />
    </div>
  );
}
