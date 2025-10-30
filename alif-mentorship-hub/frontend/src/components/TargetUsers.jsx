import { motion } from "framer-motion";

const TargetUsers = () => {
  const users = [
    {
      title: "Primary Users",
      subtitle: "High School Students",
      description: "Somali students aged 15-20, especially from underserved areas, seeking career guidance and mentorship opportunities.",
      icon: "🎓",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Secondary Users", 
      subtitle: "Supporting Community",
      description: "Teachers, mentors, NGOs, parents, and institutions supporting youth development and education.",
      icon: "🤝",
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <section className="py-20 bg-linear-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
            Who We Serve
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Alif Mentorship Hub is designed for Somali students and their supporting community, 
            creating a comprehensive ecosystem for youth development and empowerment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {users.map((user, index) => (
            <motion.div
              key={user.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="text-center">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-r ${user.color} flex items-center justify-center text-3xl shadow-lg`}>
                  {user.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{user.title}</h3>
                <h4 className="text-xl font-semibold text-blue-600 mb-4">{user.subtitle}</h4>
                <p className="text-gray-600 leading-relaxed">{user.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Join hundreds of Somali students who are already discovering their potential through our mentorship programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="bg-white text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors duration-300"
              >
                Apply Now
              </a>
              <a
                href="/about"
                className="border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:bg-white hover:text-blue-600 transition-colors duration-300"
              >
                Learn More
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TargetUsers;
