"use client";
import { useEffect, useState } from "react";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4001/programs")
      .then(res => res.json())
      .then(data => setPrograms(data));
  }, []);

  return (
    <div>
      <h1>Programs</h1>

      <a href="/admin/programs/create">Add Program</a>
      <h1>Programs List</h1>
      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Program Name</th>
            <th>Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p: any) => (
            <tr key={p.program_id}>
              <td>{p.program_id}</td>
              <td>{p.program_name}</td>
              <td>{p.program_level}</td>
              <td>{p.status === 1 ? "Active" : "Inactive"}</td>
              <td>
                <a href={`/admin/programs/${p.program_id}/edit`}>Edit</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
