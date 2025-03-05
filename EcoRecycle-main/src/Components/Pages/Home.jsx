import { Link } from "react-router-dom";
import RecycleAwarenessCards from "../RecycleAwarenessCards";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <section className="flex flex-col justify-center items-center py-24 px-5 bg-white text-[#1D4C6C]">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to Ecorecycle</h1>
          <p className="text-xl mb-8 leading-relaxed">
            Join us in building a sustainable future by recycling and reusing
            resources.
          </p>

          <Link
            to="/services"
            className="bg-[#1D4C6C] text-white py-4 px-8 rounded-lg text-lg font-semibold hover:bg-[#4c5e8f] transition-colors duration-300"
          >
            Learn more
          </Link>
        </div>
        <div className="mt-12">
          <RecycleAwarenessCards />
        </div>
      </section>
    </div>
  );
};

export default Home;
