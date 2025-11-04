import React, { useState, useEffect, useRef } from "react";
import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AllCategories = () => {
 
  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-all"
       >
        <FaBars className="text-lg" />
        <span>{"Categories"}</span>
      </button>


    </div>
  );
};

export default AllCategories;
