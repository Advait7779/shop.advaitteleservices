import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { companyName } from '../utils/branding';
import { 
  ShieldCheck, 
  Target, 
  Compass, 
  MapPin, 
  Clock, 
  FileText, 
  Key, 
  Globe, 
  Smartphone, 
  Award,
  CheckCircle2
} from 'lucide-react';

const AboutUs = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: 'Route History Playback',
      icon: Clock,
      description: 'Route History Playback allows users to view the previously taken routes or locations visited, displayed as a visual playback on the map. This feature helps track movement patterns, monitor activity timelines, and analyze travel behaviour over time. It is especially useful for logistics, delivery tracking, or personal travel logs.'
    },
    {
      title: 'Real Time Location Tracking',
      icon: MapPin,
      description: 'Live continuous pinpoint tracking with sub-second latency. Know the exact street, speed, and heading of your vehicles anywhere in India directly on your smartphone screen.'
    },
    {
      title: 'Daily / Weekly Report',
      icon: FileText,
      description: 'Automated telematics analytics delivering comprehensive mileage, travel time, stoppage, idling, and speed reports to optimize fleet operational efficiency.'
    },
    {
      title: 'Ignition On/Off Status',
      icon: Key,
      description: 'Real-time ignition sensory detection notifies you the very instant your vehicle engine is turned on or shut down, deterring unauthorized usage.'
    },
    {
      title: 'Web-Based Access',
      icon: Globe,
      description: 'Full-featured enterprise cloud web portal allowing multi-vehicle monitoring, geofence generation, and fleet management from any desktop browser.'
    },
    {
      title: 'Mobile-Based Access',
      icon: Smartphone,
      description: 'Intuitive Android and iOS mobile app with push notifications, remote engine immobilization relay switch, and quick emergency contacts.'
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      
      {/* Short Subpage Banner with Real Product Photography */}
      <section className="subpage-hero" aria-label={'About ' + companyName}>
        <img
          src="/banners/hero-fleet-editorial.webp"
          alt="Advait Fleet Solutions"
          className="subpage-hero__image"
        />
        <div className="subpage-hero__shade" aria-hidden="true" />
        <div className="subpage-hero__content space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-300">
            Company story
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            About {companyName}
          </h1>
          <p className="text-xs sm:text-sm text-brand-200/90 max-w-lg mx-auto">
            Maharashtra&apos;s leading telematics and vehicle security partner since 2018.
          </p>
          <div className="text-xs text-brand-300 pt-1">
            <Link to="/" className="hover:underline text-brand-200">Home</Link> &gt; About Us
          </div>
        </div>
      </section>

      {/* About Company Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-12 items-center">
          
          <div className="min-w-0 lg:col-span-7 space-y-5 reveal-left">
            <div className="inline-block px-3 py-1 bg-brand-100 text-[#385775] text-xs font-bold uppercase tracking-wider rounded-full">
              ABOUT OUR COMPANY
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Precision Telematics Engineering & Vehicle Security Across India.
            </h2>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              <strong>{companyName}</strong> is a specialized Indian telematics provider headquartered at Amanora Chambers, Pune. We engineer, supply, and support commercial-grade satellite GPS tracking units, AIS-140 certified RTO telematics, high-accuracy capacitive fuel sensors, and standalone 4G solar surveillance systems.
            </p>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              From private vehicle owners safeguarding personal cars against theft with remote engine immobilization, to transport operators managing commercial fleets across Maharashtra, our focus is uncompromising: robust, commercial-grade hardware backed by a full <strong>1-Year Doorstep Replacement Warranty</strong> and direct Pune-based engineering support.
            </p>

            {/* Core Features Bullets */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-800 font-medium">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span>Dedicated Pune Customer Support Hotline & WhatsApp Help</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span>Continuous cloud telemetry with 99.9% platform uptime</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span>Pre-configured multi-network 4G M2M SIMs included</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                <span>Genuine 1-Year Doorstep Replacement Guarantee</span>
              </div>
            </div>
          </div>

          {/* Right Brand Badge / Visual */}
          <div className="min-w-0 lg:col-span-5 flex justify-center reveal-right">
            <div className="min-w-0 bg-gradient-to-br from-brand-50 to-white p-6 sm:p-8 rounded-3xl border border-brand-200 shadow-md text-center space-y-6 max-w-md w-full card-hover">
              <img
                src="/logo.png"
                alt="Advait Teleservices Logo"
                className="w-24 h-24 mx-auto object-contain rounded-2xl p-2 bg-white shadow-sm border border-brand-200"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{companyName}</h3>
                <p className="text-xs text-brand-700 font-semibold mt-1">Pune, Maharashtra, India</p>
              </div>
              <div className="border-t border-brand-100 pt-4 grid grid-cols-2 gap-3 text-left">
                <div>
                  <span className="text-[11px] text-gray-500 block">Registration</span>
                  <span className="text-xs font-bold text-gray-800">Private Limited</span>
                </div>
                <div>
                  <span className="text-[11px] text-gray-500 block">Head Office</span>
                  <span className="text-xs font-bold text-gray-800">Amanora, Pune</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Vision & Mission Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 reveal-stagger">
          
          {/* Vision */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 card-hover">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-[#385775] flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">OUR VISION</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                <span>Achieve complete customer satisfaction across all vehicle telematics products.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                <span>Respond immediately to the evolving tracking needs of our clients.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                <span>Create and cultivate long-term relationships based on transparency and top-tier support.</span>
              </li>
            </ul>
          </div>

          {/* Mission */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 card-hover">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-[#385775] flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">OUR MISSION</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                <span>Deliver dependable Indian telematics hardware with sub-second live tracking and durable field reliability.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                <span>Provide highest quality service and products with 1-Year replacement warranty.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-2 shrink-0"></span>
                <span>To deliver our Indian telematics innovations and GPS engineering globally.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Interactive Features Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#385775] uppercase tracking-widest bg-brand-100 px-3 py-1 rounded-full">
            OUR FEATURES
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3">
            What Features Do We Provide?
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Feature Tabs List */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-gray-100 bg-brand-50/40 p-4 space-y-2">
            {features.map((feat, index) => {
              const IconComp = feat.icon;
              const isSelected = activeFeature === index;
              return (
                <button
                  key={feat.title}
                  onClick={() => setActiveFeature(index)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left text-xs font-bold transition-all duration-200 btn-press ${
                    isSelected
                      ? 'bg-[#385775] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-brand-100/70 hover:text-brand-900'
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-brand-200' : 'text-brand-700'}`} />
                  <span>{feat.title}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Details Panel */}
          <div className="md:col-span-7 p-5 sm:p-8 flex flex-col justify-center space-y-4">
            <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>{features[activeFeature].title}</span>
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {features[activeFeature].description}
            </p>
            <div className="pt-4 flex items-center gap-4">
              <Link
                to="/shop"
                className="px-5 py-2.5 rounded-xl bg-[#385775] hover:bg-[#293d54] text-white text-xs font-bold shadow-xs transition-all duration-200 btn-press"
              >
                Find Devices Supporting This Feature
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default AboutUs;
