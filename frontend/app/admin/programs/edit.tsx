"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EditProgram() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch(`http://localhost:4001/programs/${id}`)
      .then(res => res.json())
      .then(data => setForm(data));
  }, [id]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const update = async () => {
    await fetch(`http://localhost:4001/programs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    router.push("/admin/programs");
  };

  return (
    <div>
      <h1>Edit Program</h1>

      <input name="program_name" value={form.program_name || ""} onChange={handleChange} />
      <br />

      <button onClick={update}>Update</button>
    </div>
  );
}
