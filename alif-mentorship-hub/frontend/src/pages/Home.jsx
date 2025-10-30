import Hero from "../components/Hero";
import Features from "../components/Features";
import AboutUs from "../components/AboutUs";
import TargetUsers from "../components/TargetUsers";

const Home = () => {
  return (
    <div className="pt-15 p-4 bg-linear-to-br from-blue-50 to-white">
      <Hero />
      <Features />
      <AboutUs />
      <TargetUsers />
    </div>
  );
};

export default Home;
