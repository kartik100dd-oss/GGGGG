import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Target, Eye, Globe, Compass, ArrowRight, User, Mail, Phone, MapPin, ChevronDown } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/golden_owl_logo_1783933151695.jpg';

export default function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full uppercase tracking-wider">
          Our Origin & Philosophy
        </span>
        <h1 className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          About <span className="text-red-600">AI RED DRAGON</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          Empowering the next generation of leaders and learners from marksheets to successful global careers.
        </p>
      </motion.div>

      {/* Corporate Structure Interactive Diagram */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900 rounded-2xl p-8 text-white mb-16 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Shield size={180} />
        </div>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-red-400">ORGANIZATION STRUCTURE</h2>
        
        <div className="flex flex-col items-center space-y-6 relative z-10">
          <div className="bg-slate-800 border-2 border-red-500 rounded-xl px-6 py-4 text-center shadow-lg w-full max-w-sm">
            <h3 className="text-xl font-bold text-red-500">BLACK DRAGON CORP</h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Parent Company</p>
            <p className="text-sm text-gray-300 mt-2">Serving as the main parent organization and holding entity.</p>
          </div>

          <div className="w-1 h-8 bg-red-500 animate-pulse"></div>

          <div className="bg-slate-800 border-2 border-amber-500 rounded-xl px-6 py-4 text-center shadow-lg w-full max-w-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-amber-500/30 mb-3 shadow">
              <img 
                src={logoImg} 
                alt="Golden Owl Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-xl font-bold text-amber-500">GOLDEN OWL TECHNOLOGIES</h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Technology Division</p>
            <p className="text-sm text-gray-300 mt-2">Operating as the technical engine, building intelligent frameworks and solutions.</p>
          </div>

          <div className="w-1 h-8 bg-amber-500 animate-pulse"></div>

          <div className="bg-gradient-to-r from-red-600 to-amber-600 rounded-xl px-8 py-5 text-center shadow-xl w-full max-w-md transform scale-105">
            <h3 className="text-2xl font-extrabold text-white">AI RED DRAGON V1</h3>
            <p className="text-xs text-amber-200 mt-1 uppercase tracking-widest">Flagship Educational AI Product</p>
            <p className="text-sm text-white mt-2">The ultimate operational ecosystem for college guidance, career diagnostics, and placements.</p>
          </div>
        </div>
      </motion.div>

      {/* Mission & Vision Bento Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <Target size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">OUR MISSION</h3>
            <p className="text-gray-600 leading-relaxed">
              To dismantle ambiguity in career planning. We leverage artificial intelligence to provide hyper-personalized, objective academic and career blueprints that are accessible to every student, helping them make optimal financial and vocational choices.
            </p>
          </div>
          <div className="mt-6 flex items-center text-red-600 font-semibold text-sm">
            Access Free Counseling <ArrowRight size={16} className="ml-2" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <Eye size={24} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">OUR VISION</h3>
            <p className="text-gray-600 leading-relaxed">
              To establish the world's most trusted, secure, and predictive student guidance engine. We envision an intelligent educational ecosystem where every student’s professional timeline is optimized for happiness, capability, and outstanding Return on Investment (ROI).
            </p>
          </div>
          <div className="mt-6 flex items-center text-amber-600 font-semibold text-sm">
            Learn More About Our Tech <ArrowRight size={16} className="ml-2" />
          </div>
        </motion.div>
      </div>

      {/* Founder Spotlight */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-slate-50 to-red-50/30 border border-gray-200/60 rounded-2xl p-8 md:p-12 mb-16"
      >
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-4xl shadow-md border-4 border-white mb-4">
              KB
            </div>
            <h4 className="text-xl font-bold text-gray-900">Kartik Bali</h4>
            <p className="text-sm text-red-600 font-medium">Founder</p>
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
              Class 12 Commerce Student
            </span>
          </div>
          
          <div className="md:col-span-2">
            <span className="text-3xl text-red-400 font-serif leading-none block mb-2">“</span>
            <p className="text-gray-700 italic text-lg leading-relaxed">
              As a Class 12 Commerce student, I realized first-hand how overwhelming, fragmented, and biased the career and college selection process can be. Most counselors base opinions purely on school marks without looking at the student's inner DNA, financial constraints, and career interest. 
            </p>
            <p className="text-gray-700 italic text-lg leading-relaxed mt-4">
              I founded AI RED DRAGON to build a truly smart, objective guidance system that acts as an admission strategist, placement forecaster, and mentor in one dashboard. Our goal is to ensure students make strategic decisions for a resilient, highly rewarding future.
            </p>
            <span className="text-3xl text-red-400 font-serif leading-none block text-right mt-2">”</span>
          </div>
        </div>
      </motion.div>

      {/* Why Choose AI RED DRAGON */}
      <div className="mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">Why Choose AI RED DRAGON?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Personalized AI Insights", desc: "No cookie-cutter pathways. Recommendations dynamically adapt to your marks, interests, and budget." },
            { title: "Placement Forecasting", desc: "Evaluate real career earnings, local industry demand, and potential AI automation risks before choosing a major." },
            { title: "Comprehensive ROI Calculator", desc: "Know your exact payback periods, living costs, and true educational return on investment." },
            { title: "Scholarship Hunting", desc: "Discover active government, state, and private sponsorships matched to your profile." },
            { title: "Parent Security Dashboard", desc: "Transparent overview focused on campus safety, hostel rules, packages, and budget limits." },
            { title: "Success Roadmaps", desc: "Staggered, year-by-year instructions on which skills to learn, certificates to earn, and networks to build." }
          ].map((item, index) => (
            <div key={index} className="bg-white border border-gray-100 rounded-xl p-6 shadow-xs hover:shadow-md transition">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive FAQ Section */}
      {(() => {
        const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
        const [searchQuery, setSearchQuery] = useState('');

        const faqs = [
          {
            question: "What is AI Red Dragon V1, and how does it help students?",
            answer: "AI Red Dragon V1 is a professional intelligence and decision-support platform designed specifically for students and parents. It acts as an admission strategist, career advisor, and placement forecaster, using advanced AI analytics to build personalized 'Educational Blueprints' that guarantee optimal vocational and financial outcomes."
          },
          {
            question: "How does the platform calculate college compatibility?",
            answer: "Our engine evaluates your academic records, budget limits, preferred locations, and career aspirations against detailed university datasets. It tracks true educational return on investment (ROI), placement records, campus safety scores, and accommodation quality to determine a customized percentage fit."
          },
          {
            question: "Can I save and access my generated blueprints later?",
            answer: "Absolutely! The platform is backed by a secure Cloud Firestore database. Every time you generate an intelligence report, it is saved under your profile. You can load, print, or manage your saved blueprints directly from your dashboard anytime."
          },
          {
            question: "What makes the 'College Battle' feature unique?",
            answer: "The 'College Battle' is an interactive comparison engine. It allows you to select up to three universities and run a detailed side-by-side breakdown. The system grades them on factors like average placement package, total fees, curriculum safety, and overall alignment, pointing you to the absolute best choice."
          },
          {
            question: "How does the ROI and Payback Period calculator work?",
            answer: "Education is a major investment. Our calculator computes the total cost of your degree—including hostel, tuition, and living costs—and offsets it against the historical starting salaries of your selected track. It estimates the exact number of years required to recover your complete investment, ensuring full financial transparency for your family."
          },
          {
            question: "Is this platform suitable for students outside of Tech/Engineering?",
            answer: "Yes! AI Red Dragon is highly inclusive. Our database and career matching models support all major academic streams including Commerce, Business Administration, Liberal Arts, Science, Humanities, and Law. Our algorithms look at your holistic skill sets to recommend resilient, future-proof career paths."
          }
        ];

        const filteredFaqs = faqs.filter(faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <div className="mb-16 bg-white border border-gray-100 rounded-2xl p-6 sm:p-10 shadow-sm">
            <div className="text-center mb-8">
              <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full uppercase tracking-wider">
                FAQ Desk
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
                Got questions about our educational intelligence platform? We've got the answers. Use the search bar to find fast solutions.
              </p>
            </div>

            {/* Search Input */}
            <div className="max-w-md mx-auto mb-8 relative">
              <input
                type="text"
                placeholder="Search questions or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
              />
              <div className="absolute left-3.5 top-3.5 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-red-600 hover:text-red-700 font-bold bg-white px-1.5 py-0.5 rounded border border-gray-100"
                >
                  Clear
                </button>
              )}
            </div>

            {/* FAQ Accordion List */}
            <div className="max-w-3xl mx-auto space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className="border border-gray-100 rounded-xl overflow-hidden hover:border-red-100 transition duration-200"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-5 text-left font-bold text-gray-900 hover:bg-slate-50/40 transition cursor-pointer"
                      >
                        <span className="text-sm sm:text-base flex items-start gap-3">
                          <span className="text-red-500 mt-0.5 font-extrabold">Q.</span>
                          <span>{faq.question}</span>
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-400 shrink-0 ml-4 mt-0.5"
                        >
                          <ChevronDown size={18} />
                        </motion.div>
                      </button>

                      <motion.div
                        initial={false}
                        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 text-sm text-gray-600 border-t border-gray-50/50 leading-relaxed bg-slate-50/30">
                          {faq.answer}
                        </div>
                      </motion.div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-500 text-sm bg-slate-50/50 border border-dashed border-gray-200 rounded-xl">
                  No questions match "{searchQuery}". Try searching for words like "ROI", "Battle", or "compatibility".
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Corporate Contact Info */}
      <div className="bg-slate-900 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-400">CONTACT & LOCATION INFO</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <MapPin className="text-red-500 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Headquarters</p>
              <p className="text-sm text-gray-300 mt-1">Bathinda, Punjab, India - 151001</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Mail className="text-amber-500 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Corporate Support</p>
              <a href="mailto:communist320@gmail.com" className="text-sm text-amber-400 hover:underline mt-1 block">
                communist320@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="text-red-500 mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Direct Hotline</p>
              <a href="tel:771600178" className="text-sm text-red-400 hover:underline mt-1 block">
                +91 771600178
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
