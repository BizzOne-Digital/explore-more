import { Card, CardBody, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/utils";

import type { PublicCourse } from "@/types/public";

interface CourseCardProps {
  course: PublicCourse;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card href={`/courses/${course.slug}`}>
      <CardBody>
        <div className="mb-3 flex flex-wrap gap-2">
          {course.category && <Badge variant="teal">{course.category}</Badge>}
          {course.difficulty && <Badge variant="default">{course.difficulty}</Badge>}
          {course.isFree || course.priceCents === 0 ? (
            <Badge variant="forest">Free</Badge>
          ) : (
            <Badge variant="orange">{formatCents(course.priceCents)}</Badge>
          )}
        </div>
        <CardTitle>{course.title}</CardTitle>
        <CardDescription>{course.shortDescription}</CardDescription>
        {course.ageRange && (
          <p className="mt-3 text-xs text-explore-charcoal/50">Ages {course.ageRange}</p>
        )}
      </CardBody>
    </Card>
  );
}
