"use client";

import { useRef, useState, useEffect } from "react";
import UnicornScene from "unicornstudio-react/next";
import gsap from "gsap";
import MusicalParticles from "../MusicalParticles";
import { Leva } from "leva";

export default function Background() {
  const loopVideoRef = useRef<HTMLVideoElement>(null);
  const trailerVideoRef = useRef<HTMLVideoElement>(null);
  const refVideoContainer = useRef<HTMLDivElement>(null);
  const tableVideoRef = useRef<HTMLVideoElement>(null);
  const tableVideoContainerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hoverEnabledRef = useRef(false);
  const [isTrailerLoaded, setIsTrailerLoaded] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [particlesActive, setParticlesActive] = useState(false);

  const handleTrailerLoaded = () => {
    // Use setTimeout to defer setState and avoid cascading renders
    setTimeout(() => {
      setIsTrailerLoaded(true);
    }, 0);
  };

  const handleMouseEnter = () => {
    if (hoverEnabled && maskRef.current) {
      gsap.to(maskRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  };

  const handleMouseLeave = () => {
    if (hoverEnabled && maskRef.current) {
      gsap.to(maskRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut",
      });
    }
  };

  const handleMaskClick = () => {
    if (hoverEnabled) {
      window.open("https://x.com/elizaOS", "_blank", "noopener,noreferrer");
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = trailerVideoRef.current;
    const audio = audioRef.current;

    if (video && audio && !audioPlayed && tableVideoRef.current) {
      const timeRemaining = video.duration - video.currentTime;

      // Play audio when 5 seconds remaining
      if (timeRemaining <= 5 && timeRemaining > 0) {
        audio.play();
        // Show table video
        gsap.to(tableVideoContainerRef.current, {
          opacity: 1,
          duration: 0,
        });
        // Start playing table video
        tableVideoRef.current.play();
        setAudioPlayed(true);
        // Enable hover functionality - use ref to avoid cascading renders
        if (!hoverEnabledRef.current) {
          hoverEnabledRef.current = true;
          setHoverEnabled(true);
        }
      }
    }
  };

  const handleTrailerEnded = async () => {
    const trailerContainer = refVideoContainer.current;
    const tableContainer = tableVideoContainerRef.current;
    const tableVideo = tableVideoRef.current;

    if (trailerContainer && tableContainer && tableVideo) {
      // Check if in fullscreen and exit if needed
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.error("Error exiting fullscreen:", error);
        }
      }

      // Fade out trailer
      gsap.to(trailerContainer, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          // Hide trailer completely from DOM
          gsap.set(trailerContainer, { display: "none" });
          setParticlesActive(true);
        },
      });
    }
  };

  // Check if video is already loaded (for cached videos)
  useEffect(() => {
    const video = trailerVideoRef.current;
    if (video && video.readyState >= 3) {
      // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
      // Defer setState to next tick to avoid cascading renders
      setTimeout(() => {
        setIsTrailerLoaded(true);
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (
      isTrailerLoaded &&
      loopVideoRef.current &&
      trailerVideoRef.current &&
      refVideoContainer.current
    ) {
      // Create GSAP timeline
      const tl = gsap.timeline({
        // onComplete: () => {
        //   // Play trailer after animation completes
        //   trailerVideoRef.current?.play();
        // },
      });

      // Animate loop video to scale 0
      tl.to(loopVideoRef.current, {
        scale: 0,
        delay: 1,
        duration: 1,
        ease: "power2.inOut",
      });

      // Animate trailer video to scale 1 (at the same time)
      tl.to(
        refVideoContainer.current,
        {
          // scale: 1,
          // delay: 1,
          opacity: 1,
          duration: 1,
          ease: "power2.inOut",
        },
        0.5
      ); // Start at the same time (position 0)
    }
  }, [isTrailerLoaded]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* UnicornScene as background */}
      <UnicornScene
        jsonFilePath="/unicorn/background.json"
        width="100vw"
        height="100vh"
        scale={1}
        dpi={0.8}
      />
      {/* Musical Particles - Outside mask container */}
      <MusicalParticles
        isActive={particlesActive}
        position={{
          left: "47%",
          top: "0%",
          width: "36%",
          height: "40vh",
        }}
      />

      {/* Video loop overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center mix-blend-difference">
        <video
          ref={loopVideoRef}
          className="w-full"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/video/logo-loop.mp4" type="video/mp4" />
        </video>
      </div>
      <Leva hidden />
      {/* Table video (behind trailer) */}
      <div
        ref={tableVideoContainerRef}
        className="absolute inset-0 z-15 flex items-center justify-center bg-black opacity-1"
      >
        <video
          ref={tableVideoRef}
          className="w-full h-full object-cover pointer-events-none"
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/video/table-video.mp4" type="video/mp4" />
        </video>

        {/* Invisible hover area positioned over the object */}
        <div
          className="absolute pointer-events-auto cursor-pointer z-[16]"
          style={{
            left: "47%",
            top: "15%",
            width: "36%",
            height: "50%",
            transform: "rotate(58deg) skew(-13deg, 0deg)",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleMaskClick}
        />

        {/* Mask overlay */}
        <img
          ref={maskRef}
          src="/images/mask-discman.png"
          alt="Mask"
          className="absolute w-full h-full object-cover pointer-events-none opacity-0 z-[17]"
        />
      </div>

      {/* Video trailer player */}
      <div
        ref={refVideoContainer}
        className="absolute inset-0 z-20 flex items-center justify-center bg-black opacity-0"
      >
        <video
          ref={trailerVideoRef}
          className="h-full"
          controls
          playsInline
          preload="auto"
          onLoadedData={handleTrailerLoaded}
          onCanPlayThrough={handleTrailerLoaded}
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleTrailerEnded}
        >
          <source src="/video/eliza-trailer.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Audio element */}
      <audio ref={audioRef} preload="auto">
        <source src="/audio/weirdvoiceslol.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
