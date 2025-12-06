"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";

export default function Header() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    async function fetchUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserRole(user.user_metadata?.role ?? null);
    }
    fetchUserRole();

    async function fetchCategories() {
      const { data, error } = await supabase
        .from("media_categories")
        .select("id, name")
        .order("name", { ascending: true });
      if (!error) setCategories(data ?? []);
    }
    fetchCategories();
  }, []);

  return (
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">Multimedia Catalog</Link>
      <ul className="flex space-x-4">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={`/media/category/${category.id}`} className="hover:underline">
              {category.name}
            </Link>
          </li>
        ))}
        {userRole === "admin" && (
          <li>
            <Link href="/admin" className="font-semibold hover:underline">
              Admin Dashboard
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
