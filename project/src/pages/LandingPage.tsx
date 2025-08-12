import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Spotlight } from '../components/ui/spotlight-new';
import { Logo } from '../components/Logo';
import { CometCard } from '../components/ui/comet-card';
import { HoverBorderGradient } from '../components/ui/hover-border-gradient';

import { StarsBackground } from '../components/ui/stars-background-new';

import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'North Star - Advanced Learning Platform';
  }, []);

  return (
    <StarsBackground 
      className="h-screen antialiased relative overflow-hidden"
      factor={0.03}
      speed={60}
      starColor="#8b5cf6"
    >
      {/* Spotlight Effect */}
      <Spotlight 
        gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(270, 100%, 85%, .08) 0, hsla(270, 100%, 65%, .03) 50%, hsla(270, 100%, 55%, 0) 80%)"
        gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(270, 100%, 85%, .06) 0, hsla(270, 100%, 65%, .02) 80%, transparent 100%)"
        gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(270, 100%, 85%, .04) 0, hsla(270, 100%, 55%, .01) 80%, transparent 100%)"
        duration={10}
        xOffset={80}
      />
      
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo />
          </div>
                     <div className="flex items-center">
             <HoverBorderGradient
               containerClassName="rounded-full"
               as={Link}
               to="/auth/signup"
               className="text-white flex items-center space-x-2"
               duration={2}
             >
               <span>Get Started</span>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
               </svg>
             </HoverBorderGradient>
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col justify-center p-4 pt-20">
        <div className="max-w-7xl mx-auto text-center flex-1 flex flex-col justify-center">
          {/* Hero Title */}
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-2 md:mb-3">
            North Star
          </h1>
          
          {/* By Invisible Mechanics - Hover Border Gradient */}
          <div className="mb-4 md:mb-6 flex justify-center">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="div"
              className="bg-white text-black flex items-center space-x-2 px-4 py-2"
              duration={2}
            >
              <span className="text-xs md:text-sm font-medium">By Invisible Mechanics</span>
            </HoverBorderGradient>
          </div>
          
          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-normal text-base md:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-10"
          >
            Master complex concepts through interactive breakdowns, practice problems, and personalized learning paths.
          </motion.p>
          
          {/* Features - CometCard Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto"
          >
            {/* Interactive Breakdowns Card */}
            <CometCard>
              <div className="flex w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-3">
                <div className="mx-1 flex-1">
                  <div className="relative mt-1 aspect-[4/3] w-full">
                    <div className="absolute inset-0 h-full w-full rounded-[12px] bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex flex-shrink-0 flex-col p-2 font-sans text-white">
                  <div className="text-xl font-semibold mb-1">Interactive Breakdowns</div>
                  <div className="text-sm text-gray-300 opacity-75">Step by step explanations turn complex concepts into simple visual interactive understanding.</div>
                </div>
              </div>
            </CometCard>

            {/* Practice Problems Card */}
            <CometCard>
              <div className="flex w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-3">
                <div className="mx-1 flex-1">
                  <div className="relative mt-1 aspect-[4/3] w-full">
                    <div className="absolute inset-0 h-full w-full rounded-[12px] bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex flex-shrink-0 flex-col p-2 font-sans text-white">
                  <div className="text-xl font-semibold mb-1">Practice Problems</div>
                  <div className="text-sm text-gray-300 opacity-75">Targeted exercises build skills with feedback, repetition, and smart adaptive difficulty levels.</div>
                </div>
              </div>
            </CometCard>

            {/* Mock Tests Card */}
            <CometCard>
              <div className="flex w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-3">
                <div className="mx-1 flex-1">
                  <div className="relative mt-1 aspect-[4/3] w-full">
                    <div className="absolute inset-0 h-full w-full rounded-[12px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex flex-shrink-0 flex-col p-2 font-sans text-white">
                  <div className="text-xl font-semibold mb-1">Mock Tests</div>
                  <div className="text-sm text-gray-300 opacity-75">Full length assessments track progress, surface weaknesses, and guide focused improvement.</div>
                </div>
              </div>
            </CometCard>

            {/* Hybrid Learning Card */}
            <CometCard>
              <div className="flex w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-3">
                <div className="mx-1 flex-1">
                  <div className="relative mt-1 aspect-[4/3] w-full">
                    <div className="absolute inset-0 h-full w-full rounded-[12px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="mt-1 flex flex-shrink-0 flex-col p-2 font-sans text-white">
                  <div className="text-xl font-semibold mb-1">Hybrid Learning</div>
                  <div className="text-sm text-gray-300 opacity-75">Personalized learning paths adapt to diagnostics, closing gaps with curated, dynamic content.</div>
                </div>
              </div>
            </CometCard>
          </motion.div>
          

        </div>
      </div>
    </StarsBackground>
  );
};
