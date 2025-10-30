import { motion } from "framer-motion";

const About = () => {
  const teamMembers = [
    {
      name: "Belinda Larose",
      role: "Team Leader & Devops Engineer",
      description: "Leading the vision and coordination of the Alif Mentorship Hub project"
    },
    {
      name: "Amelie Umutoni",
      role: "Backend Developer",
      description: "Building robust APIs and managing data infrastructure"
    },
    {
      name: "Khalid Abdillahi",
      role: "Frontend Developer",
      description: "Creating beautiful and intuitive user interfaces"
    }
  ];

  const values = [
    {
      icon: "🎯",
      title: "Empowerment",
      description: "We empower Somali youth to reach their full potential through mentorship and guidance"
    },
    {
      icon: "🤝",
      title: "Community",
      description: "Building a supportive community that fosters growth, learning, and collaboration"
    },
    {
      icon: "📚",
      title: "Education",
      description: "Providing access to quality education, digital skills, and career opportunities"
    },
    {
      icon: "🌟",
      title: "Innovation",
      description: "Harnessing technology to create innovative solutions for student mentorship"
    }
  ];

  return (
    <div className="pt-20 bg-linear-to-br from-blue-50 to-white min-h-screen">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-blue-600">
              About Alif Mentorship Hub
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Empowering Somali high school students through career guidance, mentorship, 
              and access to technology, innovation, and higher education opportunities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-blue-50 p-8 rounded-xl shadow-lg"
          >
            <h2 className="text-3xl font-bold text-blue-600 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To provide comprehensive mentorship and educational support that empowers Somali 
              high school students to discover their potential, connect with mentors, gain digital 
              skills, and access scholarships and career pathways. We believe in creating opportunities 
              for personal and academic growth through structured programs and community engagement.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-green-50 p-8 rounded-xl shadow-lg"
          >
            <h2 className="text-3xl font-bold text-green-600 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              To become the leading mentorship platform for Somali students, transforming lives 
              through accessible education, career guidance, and community support. We envision a 
              future where every Somali high school student has the resources and guidance needed 
              to pursue their dreams in technology, innovation, and beyond.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-linear-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg text-center"
              >
                <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{member.name}</h3>
                <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Join Our Mission</h2>
            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Together, we can make a lasting impact on the lives of Somali students. 
              Whether you're a student seeking guidance, a mentor willing to share your expertise, 
              or a supporter of our mission, we welcome you to be part of the Alif Mentorship Hub community.
            </p>
            <a
              href="/signup"
              className="inline-block bg-blue-600 text-white font-bold px-8 py-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-105"
            >
              Get Started Today
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
