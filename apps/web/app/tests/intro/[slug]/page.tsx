import { TEST_SLUGS } from '@/lib/types';
import { TestIntroPage } from '@/components/pages/TestIntroPage';

export function generateStaticParams() {
  return TEST_SLUGS.map((slug) => ({ slug }));
}

export default function Page() {
  return <TestIntroPage />;
}
