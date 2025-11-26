"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProgram() {
  const router = useRouter();

  const [form, setForm] = useState({
    program_name: "",
    program_level: 1,
    assessment_title: "",
    report_title: "",
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async () => {
    await fetch("http://localhost:4001/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    router.push("/admin/programs");
  };

  return (
    <div>
      <h1>Create Program</h1>

      <input name="program_name" placeholder="Program Name" onChange={handleChange} />
      <br />
      <input name="program_level" placeholder="Level" onChange={handleChange} />
      <br />
      <input name="assessment_title" placeholder="Assessment Title" onChange={handleChange} />
      <br />
      <input name="report_title" placeholder="Report Title" onChange={handleChange} />
      <br />

      <button onClick={submit}>Save</button>
    </div>
  );
}
