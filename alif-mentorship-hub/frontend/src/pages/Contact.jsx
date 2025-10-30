import { motion } from "framer-motion";
import { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitStatus("success");
    setTimeout(() => {
      setSubmitStatus(null);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: "📧",
      title: "Email Us",
      content: "info@alifmentorhub.com",
      description: "Send us an email anytime"
    },
    {
      icon: "📱",
      title: "Call Us",
      content: "+91 7609958608",
      description: "Mon-Fri 9am to 5pm"
    },
    {
      icon: "📍",
      title: "Visit Us",
      content: "123 Education Street",
      description: "Mogadishu, Somalia"
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
              Get In Touch
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Have questions? Want to know more about our mentorship programs? 
              We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-5xl mb-4">{info.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{info.title}</h3>
                <p className="text-blue-600 font-semibold mb-2">{info.content}</p>
                <p className="text-gray-600 text-sm">{info.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-linear-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-xl shadow-lg"
            >
              <h2 className="text-3xl font-bold mb-4">Why Contact Us?</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-2xl mr-3">📚</span>
                  <div>
                    <h4 className="font-semibold mb-1">Student Inquiries</h4>
                    <p className="text-blue-100 text-sm">Learn about our mentorship programs and how to apply</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">👥</span>
                  <div>
                    <h4 className="font-semibold mb-1">Become a Mentor</h4>
                    <p className="text-blue-100 text-sm">Share your expertise and guide students</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">💡</span>
                  <div>
                    <h4 className="font-semibold mb-1">Partnerships</h4>
                    <p className="text-blue-100 text-sm">Collaborate with us to expand our reach</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-2xl mr-3">❓</span>
                  <div>
                    <h4 className="font-semibold mb-1">General Questions</h4>
                    <p className="text-blue-100 text-sm">We're here to help with any inquiries</p>
                  </div>
                </li>
              </ul>
            </motion.div>

            {/* Right Side - Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-lg"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What's this about?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Send Message
                </button>
                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-green-100 text-green-700 p-3 rounded-lg text-center"
                  >
                    Thank you for your message! We'll get back to you soon.
                  </motion.div>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                question: "Who can join Alif Mentorship Hub?",
                answer: "Alif Mentorship Hub is designed for Somali high school students seeking mentorship, career guidance, and educational support."
              },
              {
                question: "How does the mentorship program work?",
                answer: "Students apply through our platform, and we match them with experienced mentors based on their interests and career goals."
              },
              {
                question: "Is there a cost to participate?",
                answer: "No, our mentorship programs and resources are free for all Somali students."
              },
              {
                question: "How can I become a mentor?",
                answer: "If you're an experienced professional or educator, you can contact us through this page to learn about becoming a mentor."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-blue-50 p-6 rounded-lg"
              >
                <h3 className="font-bold text-lg mb-2 text-gray-800">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
