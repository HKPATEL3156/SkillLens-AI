import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
	const [career, setCareer] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const nav = useNavigate();
	const token = localStorage.getItem("token");

	useEffect(() => {
		fetchCareer();
	}, []);

	const fetchCareer = async () => {
		setLoading(true);
		setError("");
		try {
			const res = await axios.get("/api/career/me", {
				headers: { Authorization: `Bearer ${token}` },
			});
			setCareer(res.data);
		} catch (err) {
			setError("Failed to fetch status");
		}
		setLoading(false);
	};

	if (loading) return <div className="p-4">Loading...</div>;

	return (
		<div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
			<h1 className="text-3xl font-bold mb-4">Welcome to SkillLensAI</h1>
			{error && <div className="text-red-600 mb-2">{error}</div>}
			<div className="mb-4">
				<div className="flex items-center gap-4 mb-2">
					<span className="font-semibold">Resume uploaded?</span>
					<span className={career?.resumeUrl ? "text-green-600" : "text-red-600"}>{career?.resumeUrl ? "Yes" : "No"}</span>
				</div>
				<div className="flex items-center gap-4 mb-2">
					<span className="font-semibold">Result uploaded?</span>
					<span className={career?.resultUrl ? "text-green-600" : "text-red-600"}>{career?.resultUrl ? "Yes" : "No"}</span>
				</div>
			</div>
			<div className="flex gap-4 mt-6">
				<button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => nav("/myprofile")}>Go to My Profile</button>
				<button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => nav("/myactivity")}>View My Activity</button>
				<button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={() => nav("/settings")}>Settings</button>
			</div>
		</div>
	);
};

export default Home;
