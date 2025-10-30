import { featuresData } from "../context/FeaturesData";

export default function Features() {
  return (
    <section className="relative py-20 overflow-hidden bg-linear-to-br from-blue-50 to-white">
      {/* Optional: Subtle animated background or particles for more depth */}

      {/* Content container */}
      <div className="relative max-w-7xl mx-auto px-6 z-10 text-center">
        {/* Section Title */}
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-600 tracking-tight uppercase">
          Our Programs
        </h2>
        {/* Subtitle */}
        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-16 text-gray-700">
          Empowering Somali high school students through comprehensive mentorship and learning opportunities designed to unlock your potential.
        </p>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {featuresData.map((feature, index) => (
            <div
              key={feature.id}
              className="relative bg-white bg-opacity-70 border border-gray-300 backdrop-blur-lg rounded-[1.75rem] p-6 shadow-xl hover:scale-105 transition-transform duration-300 ease-in-out"
              style={{ minHeight: "320px" }}
            >
              {/* Icon with a soft gradient or neutral color */}
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-linear-to-tr from-blue-100 to-indigo-100 shadow-lg hover:scale-110 transition-transform duration-200">
                {/* Program-specific icons */}
                <span className="text-2xl">
                  {index === 0 && "🎯"}
                  {index === 1 && "🤝"}
                  {index === 2 && "💻"}
                  {index === 3 && "📚"}
                  {index === 4 && "🌟"}
                </span>
              </div>
              {/* Feature Title */}
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                {feature.title}
              </h3>
              {/* Feature Description */}
              <p className="text-gray-700 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Optional: Floating particles or abstract shapes matching the color palette */}
    </section>
  );
}
