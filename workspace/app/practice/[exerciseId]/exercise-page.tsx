'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PracticeShell } from '@/components/practice/PracticeShell';
import { FocusView, type SessionInfo } from '@/components/practice/FocusView';
import { findExercise } from '@/lib/practice/client/packs';
import { readSession } from '@/lib/practice/client/session';
import type { PracticeExercise } from '@/lib/practice/adapters/types';

export default function ExercisePage({ exerciseId }: { exerciseId: string }) {
  const [state, setState] = useState<{ exercise: PracticeExercise; packId: string; session?: SessionInfo } | null | 'missing'>(null);
  useEffect(() => {
    const session = readSession(new URLSearchParams(window.location.search).get('session'), exerciseId);
    findExercise(exerciseId).then(r => setState(r ? { exercise: r.exercise, packId: r.pack.id, session } : 'missing')).catch(() => setState('missing'));
  }, [exerciseId]);
  return (
    <PracticeShell active="Practice" crumb={state && state !== 'missing' ? state.exercise.title : undefined}>
      {state === null && <p className="muted">Loading exercise…</p>}
      {state === 'missing' && <div className="empty"><h3>Exercise not found</h3><p><Link href="/practice">Back to practice</Link></p></div>}
      {state && state !== 'missing' && <FocusView key={state.exercise.id} exercise={state.exercise} packId={state.packId} session={state.session} />}
    </PracticeShell>
  );
}
