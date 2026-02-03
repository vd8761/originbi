import React from 'react';
import { Metadata } from 'next';
import CorporateRegistration from '../../../components/corporate/CorporateRegistration';

export const metadata: Metadata = {
    title: 'Register Organization | OriginBI Corporate',
    description: 'Register your organization with OriginBI to manage workforce assessments and training.',
};

export default function CorporateRegistrationPage() {
    return <CorporateRegistration />;
}
