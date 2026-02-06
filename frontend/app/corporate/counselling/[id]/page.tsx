import React from 'react';
import ClientPage from './ClientPage';

type Props = {
    params: Promise<{ id: string }>;
};

export default async function CounsellingSessionListPage({ params }: Props) {
    const { id } = await params;
    return <ClientPage typeId={parseInt(id)} />;
}
