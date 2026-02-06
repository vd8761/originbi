import React from "react";
import ClientPage from "./ClientPage";

export default async function CounsellingSessionListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <ClientPage typeId={Number(id)} />;
}
