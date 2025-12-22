"use client";

import React from "react";
import ComingSoon from "@/components/ui/ComingSoon";

export default function JobsPage() {
    return (
        <div className="h-full">
            <ComingSoon
                title="Jobs Portal"
                description="Our advanced job matching algorithm is currently being fine-tuned efficiently matching your candidates to the best opportunities."
            />
        </div>
    );
}
