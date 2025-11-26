"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:4001/programs")
      .then((res) => res.json())
      .then((data) => setPrograms(data));
  }, []);

  const deleteProgram = async (id: number) => {
    const ok = confirm("Are you sure you want to delete this program?");
    if (!ok) return;

    await fetch(`http://localhost:4001/programs/${id}`, {
      method: "DELETE",
    });

    // Remove from UI without reload
    setPrograms((prev) => prev.filter((p) => p.program_id !== id));
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">List of Programs</h1>

        <Link
          href="/admin/programs/create"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-lg shadow"
        >
          + Add New Program
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow border p-5">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-600 text-white text-left">
              <th className="p-3">Action</th>
              <th className="p-3">Status</th>
              <th className="p-3">Program Name</th>
              <th className="p-3">Program Level</th>
              <th className="p-3">Assessment Title</th>
              <th className="p-3">Report Title</th>
            </tr>
          </thead>

          <tbody>
            {programs.map((p: any, index: number) => (
              <tr
                key={p.program_id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
              >
                {/* ACTION BUTTONS */}
                <td className="p-3 flex gap-4 text-xl text-black">
                  <Link
                    href={`/admin/programs/${p.program_id}`}
                    className="text-green-700 hover:text-green-900"
                    title="View"
                  >
                    👁
                  </Link>

                  <Link
                    href={`/admin/programs/${p.program_id}/edit`}
                    className="text-yellow-600 hover:text-yellow-800"
                    title="Edit"
                  >
                    ✏️
                  </Link>

                  <button
                    onClick={() => deleteProgram(p.program_id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    🗑
                  </button>
                </td>

                {/* STATUS SWITCH */}
                <td className="p-3 text-black">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={p.status === 1}
                      className="hidden peer"
                      readOnly
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-green-600 relative transition">
                      <div
                        className="absolute w-5 h-5 bg-white rounded-full top-0.5 left-0.5 
                        peer-checked:translate-x-5 transition"
                      ></div>
                    </div>
                  </label>
                </td>

                <td className="p-3 text-black">{p.program_name}</td>

                <td className="p-3 text-black">
                  {p.program_level === 0
                    ? "General"
                    : p.program_level === 1
                    ? "Advanced"
                    : "N/A"}
                </td>

                <td className="p-3 text-black">
                  {p.assessment_title || "--"}
                </td>

                <td className="p-3 text-black">
                  {p.report_title || "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer (entries count) */}
        <div className="mt-4 text-gray-600 text-sm">
          Showing {programs.length} entries
        </div>
      </div>
    </div>
  );
}
