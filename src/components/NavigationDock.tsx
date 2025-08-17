import React, { useState, useRef, useEffect } from "react";
import { FloatingDock } from "./ui/floating-dock";
import { COMMUNITY_ENABLED } from "../lib/community";
import { CursorToggle } from "./CursorToggle";
import {
  IconHome,
  IconBrain,
  IconTarget,
  IconSchool,
  IconBook,
  IconGripVertical,
  IconMessageCircle,
  IconClipboardCheck,
} from "@tabler/icons-react";

export default function NavigationDock() {
  const baseLinks = [
    {
      title: "Dashboard",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/dashboard",
    },
    {
      title: "Take a Diagnostic",
      icon: (
        <IconClipboardCheck className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/diagnostic",
    },
    {
      title: "Breakdowns",
      icon: (
        <IconBrain className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/breakdowns",
    },
    {
      title: "Practice",
      icon: (
        <IconTarget className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/practice",
    },
    {
      title: "Mock Tests",
      icon: (
        <IconSchool className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/mock-tests",
    },
  ];

  const communityLink = {
    title: "Community",
    icon: (
      <IconMessageCircle className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    ),
    href: "/community",
  };

  const manualCourseLink = {
    title: "Manual Course Creation",
    icon: (
      <IconBook className="h-full w-full text-neutral-500 dark:text-neutral-300" />
    ),
    href: "/builder/manual",
  };

  const links = [
    ...baseLinks,
    ...(COMMUNITY_ENABLED ? [communityLink] : []),
    manualCourseLink
  ];

  // Draggable state management
  const [position, setPosition] = useState(() => {
    // Try to load saved position from localStorage
    const savedPosition = localStorage.getItem('navigationDockPosition');
    if (savedPosition) {
      try {
        return JSON.parse(savedPosition);
      } catch {
        // Fallback to default position if parsing fails
      }
    }
    // Default position (bottom center)
    return { x: window.innerWidth / 2, y: window.innerHeight - 100 };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dockRef = useRef<HTMLDivElement>(null);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('navigationDockPosition', JSON.stringify(position));
  }, [position]);

  // Handle window resize to keep dock within bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 100),
        y: Math.min(prev.y, window.innerHeight - 100)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleMouseDown(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep dock within viewport bounds
    const dockWidth = 300; // Approximate dock width
    const dockHeight = 100; // Approximate dock height
    
    const boundedX = Math.max(dockWidth / 2, Math.min(newX, window.innerWidth - dockWidth / 2));
    const boundedY = Math.max(dockHeight / 2, Math.min(newY, window.innerHeight - dockHeight / 2));
    
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div 
      ref={dockRef}
      className="fixed z-50 transition-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Extended Dock with Integrated Grip */}
      <div 
        className="pointer-events-auto bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-2xl flex items-center"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Section - Integrated Left Extension */}
        <div 
          className="flex items-center justify-center px-3 py-3 border-r border-gray-200/50 transition-all duration-200 hover:bg-white/90 group rounded-l-2xl"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleDragHandleMouseDown}
          title="Drag to move dock"
        >
          <IconGripVertical 
            className="h-5 w-5 text-neutral-500 dark:text-neutral-300 group-hover:text-neutral-700 dark:group-hover:text-neutral-100 transition-colors duration-200" 
          />
        </div>

        {/* Navigation Icons Section */}
        <div className="flex items-center">
          <FloatingDock
            items={links}
            desktopClassName="!bg-transparent !border-0 !shadow-none pointer-events-auto"
            mobileClassName="!bg-transparent !border-0 !shadow-none pointer-events-auto"
          />
        </div>

        {/* Cursor Toggle Section - Right Extension */}
        <div className="flex items-center justify-center px-3 py-3 border-l border-gray-200/50 rounded-r-2xl">
          <CursorToggle />
        </div>
      </div>
    </div>
  );
}
