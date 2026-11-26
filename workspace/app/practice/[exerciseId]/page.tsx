import ExercisePage from './exercise-page';
export const metadata = { title: 'Exercise · Pathway' };
export default async function Page({ params }: { params: Promise<{ exerciseId: string }> }) {
  return <ExercisePage exerciseId={decodeURIComponent((await params).exerciseId)} />;
}
