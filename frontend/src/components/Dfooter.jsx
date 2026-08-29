import React from "react";

const Dfooter = () => {
  return (
    <footer className="bg-gray-800 text-white text-center py-4 fixed bottom-0 left-0 right-0 z-40">
      <div className="container mx-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} SkillLens AI. All rights reserved.</p>
        <p className="text-xs text-gray-400">Empowering your skills with AI-driven insights.</p>
      </div>
    </footer>
  );
};

export default Dfooter;