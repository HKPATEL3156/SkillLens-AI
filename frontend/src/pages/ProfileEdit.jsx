import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import axios from "axios";

const ProfileEdit = () => {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch user data
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setData(res.data.user);
      } catch (err) {
        console.error("Error fetching user data", err);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://localhost:5000/api/auth/profile",
        { ...data },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage("Failed to update profile. Please try again.");
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center py-20 bg-gray-100">
        <form
          onSubmit={handleUpdate}
          className="bg-white shadow-xl p-10 rounded-xl w-96 space-y-5 hover:shadow-2xl transition duration-300"
        >
          <h2 className="text-3xl font-bold text-blue-600 text-center">
            Edit Profile
          </h2>

          {message && <p className="text-green-500 text-sm text-center">{message}</p>}

          <input
            type="text"
            value={data.name}
            placeholder="Full Name"
            className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setData({ ...data, name: e.target.value })}
          />

          <input
            type="email"
            value={data.email}
            placeholder="Email"
            className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="New Password"
            className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />

          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-green-500 transition font-semibold"
          >
            Update Profile
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ProfileEdit;