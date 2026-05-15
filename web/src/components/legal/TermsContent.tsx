import React from 'react';

interface TermsContentProps {
  sections: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
  }>;
}

export function TermsContent({ sections }: TermsContentProps) {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none">
          {sections.map((section) => (
            <div key={section.id} className="mb-12">
              {section.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
