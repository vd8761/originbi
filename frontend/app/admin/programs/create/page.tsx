"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProgram() {
  const router = useRouter();

  const [form, setForm] = useState({
    program_name: "",
    program_level: 0,
    assessment_title: "",
    report_title: "",
    status: 1,
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === "status" || name === "program_level") {
        return { ...prev, [name]: Number(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const submit = async () => {
    try {
      const res = await fetch("http://localhost:4001/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error:", errorText);
        alert("Failed to save program. Please try again.");
        return;
      }

      router.push("/admin/programs");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please check the console.");
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-green-700 text-white px-8 py-10 rounded-t-2xl shadow-md">
        <h1 className="text-3xl font-semibold">Add Programs</h1>
        <p className="text-sm mt-2 opacity-90">
          Dashboard / Programs / Add Programs
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-white shadow-lg rounded-b-2xl p-8 -mt-6 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Program Name */}
          <div className="flex flex-col">
            <label className="font-medium mb-1 text-gray-700">
              Program Name <span className="text-red-500">*</span>
            </label>
            <input
              name="program_name"
              placeholder="Enter the Program Name"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          {/* Program Level */}
          <div className="flex flex-col">
            <label className="font-medium mb-1 text-gray-700">
              Program Level <span className="text-red-500">*</span>
            </label>
            <select
              name="program_level"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option value={1}>General</option>
              <option value={2}>Advanced</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="font-medium mb-1 text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          {/* Assessment Title */}
          <div className="flex flex-col md:col-span-2">
            <label className="font-medium mb-1 text-gray-700">
              Assessment Title <span className="text-red-500">*</span>
            </label>
            <input
              name="assessment_title"
              placeholder="Enter the Assessment Title"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          {/* Report Title */}
          <div className="flex flex-col md:col-span-1">
            <label className="font-medium mb-1 text-gray-700">
              Report Title <span className="text-red-500">*</span>
            </label>
            <input
              name="report_title"
              placeholder="Enter the Report Title"
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-10">
          <Link
            href="/admin/programs"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </Link>

          <button
            onClick={submit}
            className="px-8 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 shadow-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
