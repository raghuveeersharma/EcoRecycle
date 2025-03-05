import React from "react";

const About = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <section className="bg-gray-100 text-[#1D4C6C] py-12 px-5">
        <h1 className="text-4xl font-bold text-center mb-5">
          About Ecorecycle
        </h1>
        <p className="text-lg text-center mb-10 leading-relaxed w-3/4 m-auto">
          Ecorecycle is dedicated to making a difference in the world by
          promoting sustainability through recycling and reusing resources. Our
          mission is to create awareness and empower individuals and communities
          to reduce waste, recycle more, and contribute to a greener planet.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-green-200 p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300">
            <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
            <p className="text-base leading-6">
              To reduce waste and promote a circular economy by making recycling
              more accessible and convenient for everyone.
            </p>
          </div>

          <div className="bg-green-200 p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300">
            <h2 className="text-2xl font-semibold mb-3">Our Vision</h2>
            <p className="text-base leading-6">
              To build a sustainable future where waste is minimized, resources
              are reused, and the environment is protected.
            </p>
          </div>

          <div className="bg-green-200 p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300">
            <h2 className="text-2xl font-semibold mb-3">Our Goals</h2>
            <ul className="list-disc list-inside text-left">
              <li className="text-base leading-6">
                Increase awareness about recycling
              </li>
              <li className="text-base leading-6">
                Provide solutions for better waste management
              </li>
              <li className="text-base leading-6">
                Collaborate with communities and businesses to promote
                sustainability
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
