import type { Metadata } from 'next';
import ExamInstructionsVideo from '../../components/ExamInstructionsVideo';

export const metadata: Metadata = {
  title: 'How to Take Your Assessment | OriginBI',
  description:
    'Watch this short video to learn how to take your OriginBI assessment.',
};

export default function ExamInstructionsPage() {
  return <ExamInstructionsVideo />;
}
