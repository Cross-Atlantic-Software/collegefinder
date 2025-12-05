'use client';

interface Subject {
  name: string;
  percent: number;
  obtainedMarks?: number;
  totalMarks?: number;
}

interface SubjectMarksListProps {
  subjects: Subject[];
}

export default function SubjectMarksList({ subjects }: SubjectMarksListProps) {
  return (
    <>
      {subjects.map((subject, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2.5 rounded-md bg-gray-50 border border-gray-200"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{subject.name}</p>
            {subject.obtainedMarks !== undefined && subject.totalMarks !== undefined ? (
              <p className="text-xs text-gray-600 mt-0.5">
                {subject.obtainedMarks} / {subject.totalMarks} marks
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{subject.percent}%</p>
              {subject.obtainedMarks !== undefined && subject.totalMarks !== undefined && (
                <p className="text-xs text-gray-500">
                  {((subject.obtainedMarks / subject.totalMarks) * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <div
              className={`h-10 w-1 rounded-full ${
                subject.percent >= 85
                  ? 'bg-green-500'
                  : subject.percent >= 70
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            />
          </div>
        </div>
      ))}
    </>
  );
}

