"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

export default function EditProgram({ params }: any) {
  const router = useRouter();
  const { id } = params;

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    program_name: "",
    program_level: 0,      // 0 = General, 1 = Advanced
    status: 1,             // 1 = Active, 0 = Inactive
    assessment_title: "",
    report_title: "",
  });

  useEffect(() => {
    fetch(`http://localhost:4001/programs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          program_name: data.program_name ?? "",
          program_level:
            typeof data.program_level === "number" ? data.program_level : 0,
          status: typeof data.status === "number" ? data.status : 1,
          assessment_title: data.assessment_title ?? "",
          report_title: data.report_title ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      // convert numeric fields
      if (name === "program_level" || name === "status") {
        return { ...prev, [name]: Number(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const update = async () => {
    await fetch(`http://localhost:4001/programs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form), // program_level & status are numbers
    });

    router.push("/admin/programs");
  };

  if (loading) return <p className="text-black">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6 text-black">
      {/* MAIN WHITE CONTAINER */}
      <div
        className="bg-white rounded-xl shadow-lg mx-auto"
        style={{ maxWidth: "95%" }}
      >
        {/* HEADER GREEN BANNER */}
        <div className="bg-green-700 text-white p-6 rounded-t-xl">
          <h1 className="text-3xl font-bold">Edit Program</h1>
          <p className="text-sm mt-2">Dashboard / Programs / Edit Program</p>
        </div>

        {/* FORM CONTENT */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Program Name */}
            <div>
              <label className="block font-semibold mb-1">
                Program Name *
              </label>
              <input
                type="text"
                name="program_name"
                value={form.program_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
                placeholder="Enter Program Name"
              />
            </div>

            {/* Program Level */}
            <div>
              <label className="block font-semibold mb-1">
                Program Level *
              </label>
              <select
                name="program_level"
                value={form.program_level}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
              >
                <option value={0}>General</option>
                <option value={1}>Advanced</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold mb-1">Status *</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
              >
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Assessment Title */}
            <div>
              <label className="block font-semibold mb-1">
                Assessment Title *
              </label>
              <input
                type="text"
                name="assessment_title"
                value={form.assessment_title}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
                placeholder="Enter Assessment Title"
              />
            </div>

            {/* Report Title */}
            <div>
              <label className="block font-semibold mb-1">
                Report Title *
              </label>
              <input
                type="text"
                name="report_title"
                value={form.report_title}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-black"
                placeholder="Enter Report Title"
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-between mt-10">
            <button
              onClick={() => router.push("/admin/programs")}
              className="px-6 py-3 rounded bg-gray-200 text-black"
            >
              Cancel
            </button>

            <button
              onClick={update}
              className="px-8 py-3 rounded bg-green-700 text-white hover:bg-green-800"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
