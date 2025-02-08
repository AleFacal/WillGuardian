"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import "./home.css";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [trustedContacts, setTrustedContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser.email); // Assuming you're storing the email in user data
    }

    const storedContacts = JSON.parse(
      localStorage.getItem("trustedContacts") || "[]"
    );
    setTrustedContacts(storedContacts);
  }, [router]);

  const addTrustedContact = () => {
    if (newContact.trim() !== "") {
      const updatedContacts = [...trustedContacts, newContact];
      setTrustedContacts(updatedContacts);
      localStorage.setItem("trustedContacts", JSON.stringify(updatedContacts));
      setNewContact("");
    }
  };

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-3xl font-semibold mb-6">Welcome, {user}</h2>

      {/* Description and Image Section */}
      <section className="section">
        <div className="sectionText">
          <h3 className="text-xl font-semibold mb-4">About WillGuardian</h3>
          <p className="text-gray-700 dark:text-gray-300">
            WillGuardian is your trusted partner in creating, storing, and
            sharing your last will and testament. Protect your legacy by easily
            setting up your will and ensure your loved ones are taken care of.
            Add trusted contacts to ensure your will is executed as per your
            wishes.
          </p>
        </div>
        <div className="sectionImage">
          <Image
            src="/familypic.jpg" // Path to the image inside the public folder
            alt="Description of Image"
            width={500} // Set the width of the image
            height={300} // Set the height of the image
            className="image"
          />
        </div>
      </section>

      {/* Main Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/will">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full shadow-lg hover:bg-blue-700 transition">
            🚀 Create a New Will
          </button>
        </Link>
        <button className="bg-green-500 text-white px-6 py-3 rounded-lg w-full shadow-lg hover:bg-green-700 transition">
          📤 Share Will
        </button>
      </div>

      {/* Trusted Contacts Section */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4">👥 Trusted Contacts</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Enter contact email"
            className="border p-3 rounded-lg w-full"
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
          />
          <button
            onClick={addTrustedContact}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-800 transition"
          >
            ➕ Add
          </button>
        </div>
        <ul className="space-y-2">
          {trustedContacts.map((contact, index) => (
            <li
              key={index}
              className="border-b pb-2 flex justify-between items-center"
            >
              {contact}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
