'use client';

import RequireCorporate from '../../../components/auth/RequireCorporate';
import AskAIPage from '../../../components/ai/AskAIPage';
import { configureAmplify } from '../../../lib/aws-amplify-config';

configureAmplify();

export default function AskAIRoutePage() {
  return (
    <RequireCorporate>
      <AskAIPage />
    </RequireCorporate>
  );
}
