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

        {/* Additional Section: Why Choose Us */}
        <div className="max-w-6xl mx-auto mt-12 p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-3xl font-bold text-center mb-5">
            Why Choose Ecorecycle?
          </h2>
          <p className="text-lg text-center mb-5 leading-relaxed">
            Ecorecycle is more than just a recycling initiative. We are a
            movement dedicated to creating a cleaner and more sustainable world.
            Here’s what sets us apart:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-4 border-l-4 border-green-600">
              <h3 className="text-xl font-semibold">Community Driven</h3>
              <p className="text-base leading-6">
                We work with communities to spread awareness and create a
                collective impact.
              </p>
            </div>
            <div className="p-4 border-l-4 border-green-600">
              <h3 className="text-xl font-semibold">Eco-Friendly Solutions</h3>
              <p className="text-base leading-6">
                We focus on innovative and practical waste management
                techniques.
              </p>
            </div>
            <div className="p-4 border-l-4 border-green-600">
              <h3 className="text-xl font-semibold">Reliable & Transparent</h3>
              <p className="text-base leading-6">
                We ensure all recycling processes are traceable and
                environmentally friendly.
              </p>
            </div>
            <div className="p-4 border-l-4 border-green-600">
              <h3 className="text-xl font-semibold">Sustainable Future</h3>
              <p className="text-base leading-6">
                Our efforts are focused on long-term sustainability for future
                generations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
