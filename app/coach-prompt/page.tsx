'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CoachPromptPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/prompt-links');
  }, [router]);

  return null;
}
