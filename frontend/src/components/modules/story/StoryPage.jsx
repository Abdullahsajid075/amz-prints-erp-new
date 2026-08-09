import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import './StoryPage.css';

const CHAPTERS = [
  {
    image: '/story/story-02-design.jpg',
    title: 'Ideas take shape',
    copy: 'Design that speaks before you do.',
  },
  {
    image: '/story/story-03-press.jpg',
    title: 'Crafted in print',
    copy: 'Color, precision, and presence on every sheet.',
  },
  {
    image: '/story/story-04-delivery.jpg',
    title: 'Delivered with care',
    copy: 'From press floor to your customers — on time.',
  },
];

/**
 * Public storytelling page for AMZ Prints — cinematic video + chapter journey.
 */
const StoryPage = () => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'AMZ Prints — Our Story';
    const id = requestAnimationFrame(() => setHeroReady(true));
    return () => {
      cancelAnimationFrame(id);
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-story-reveal]');
    if (!nodes.length || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.28 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <div className="story-page" data-testid="story-page">
      <header className="story-nav">
        <Link to="/story" className="story-nav-brand" aria-label="AMZ Prints story home">
          AMZ Prints
        </Link>
        <nav className="story-nav-links">
          <Link to="/track">Track order</Link>
          <Link to="/login" className="story-nav-login">Staff login</Link>
        </nav>
      </header>

      <section className={`story-hero ${heroReady ? 'is-ready' : ''}`} aria-label="AMZ Prints story video">
        <video
          ref={videoRef}
          className="story-hero-video"
          autoPlay
          muted
          loop
          playsInline
          poster="/story/poster.jpg"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress((v.currentTime / v.duration) * 100);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          data-testid="story-video"
        >
          <source src="/story/amz-prints-story.mp4" type="video/mp4" />
        </video>

        <div className="story-hero-shade" aria-hidden="true" />

        <div className="story-hero-content">
          <p className="story-brand">AMZ Prints</p>
          <h1 className="story-headline">From idea to delivery.</h1>
          <p className="story-support">
            The story of how every print job moves — design, press, pack, and handoff — in one connected shop.
          </p>
          <div className="story-cta-group">
            <Link to="/track" className="story-cta story-cta-primary" data-testid="story-cta-track">
              Track your order
            </Link>
            <Link to="/login" className="story-cta story-cta-secondary" data-testid="story-cta-login">
              Staff login
            </Link>
          </div>
        </div>

        <div className="story-hero-controls">
          <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause video' : 'Play video'}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute video' : 'Mute video'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="story-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      {CHAPTERS.map((chapter) => (
        <section
          key={chapter.title}
          className="story-chapter"
          data-story-reveal
          style={{ backgroundImage: `url(${chapter.image})` }}
        >
          <div className="story-chapter-shade" aria-hidden="true" />
          <div className="story-chapter-copy">
            <h2>{chapter.title}</h2>
            <p>{chapter.copy}</p>
          </div>
        </section>
      ))}

      <section className="story-close" data-story-reveal>
        <p className="story-brand story-brand-dark">AMZ Prints</p>
        <h2>One system. Your whole shop.</h2>
        <p>Orders, production, invoices, and delivery — connected for the team that makes print happen.</p>
        <div className="story-cta-group">
          <a
            href="/story/amz-prints-story-captions.mp4"
            className="story-cta story-cta-primary"
            download="amz-prints-story.mp4"
            data-testid="story-download"
          >
            Download video
          </a>
          <Link to="/login" className="story-cta story-cta-ghost">
            Enter ERP
          </Link>
        </div>
      </section>
    </div>
  );
};

export default StoryPage;
