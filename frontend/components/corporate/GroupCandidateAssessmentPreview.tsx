import React from 'react';
import { AssessmentSession } from '../../lib/services/assessment.service';
import AdminGroupCandidateAssessmentPreview from '../admin/GroupCandidateAssessmentPreview';

interface AssessmentResultPreviewProps {
    session: AssessmentSession;
    onBack: () => void;
}

/**
 * Corporate candidate assessment report.
 *
 * The full report experience (DISC / ACI / IAT Gen / Metaphor tabs, survey
 * answers, short & Level 1 report downloads, send email) lives in the admin
 * component. Corporate reuses it verbatim — only adding the page padding the
 * corporate layout expects — so the two panels never drift apart again. The
 * underlying report endpoints are shared and already accept the corporate
 * token (corporate already calls /admin/assessments/* for session + levels).
 */
const GroupCandidateAssessmentPreview: React.FC<AssessmentResultPreviewProps> = ({ session, onBack }) => (
    <div className="p-4 sm:p-6 lg:p-8">
        <AdminGroupCandidateAssessmentPreview session={session} onBack={onBack} />
    </div>
);

export default GroupCandidateAssessmentPreview;
