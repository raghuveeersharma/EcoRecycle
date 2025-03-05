import React from "react";
import { FaRecycle, FaTree, FaIndustry, FaGlassMartini } from "react-icons/fa";

const recyclingData = [
  {
    type: "Plastic Recycling",
    fact: "Recycling plastic helps reduce pollution and conserves petroleum used for new plastic production.",
    color: "bg-blue-200",
    icon: <FaRecycle className="text-blue-600 text-3xl mb-2" />,
  },
  {
    type: "Paper Recycling",
    fact: "Recycling one ton of paper saves about 17 trees and reduces water pollution by 35%.",
    color: "bg-green-200",
    icon: <FaTree className="text-green-600 text-3xl mb-2" />,
  },
  {
    type: "Metal Recycling",
    fact: "Recycling aluminum saves 95% of the energy required to produce new aluminum from raw materials.",
    color: "bg-yellow-200",
    icon: <FaIndustry className="text-yellow-600 text-3xl mb-2" />,
  },
  {
    type: "Glass Recycling",
    fact: "Recycled glass can be reused indefinitely without losing quality, reducing landfill waste.",
    color: "bg-purple-200",
    icon: <FaGlassMartini className="text-purple-600 text-3xl mb-2" />,
  },
];

const RecycleAwarenessCards = () => {
  return (
    <div className="p-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {recyclingData.map((item, index) => (
        <div
          key={index}
          className={`p-6 rounded-xl shadow-md ${item.color} hover:scale-105 transition-transform duration-300`}
        >
          {item.icon}
          <h2 className="text-xl font-semibold mb-2">{item.type}</h2>
          <p className="text-gray-700">{item.fact}</p>
        </div>
      ))}
    </div>
  );
};

export default RecycleAwarenessCards;
