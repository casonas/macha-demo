import React from 'react';
import AppShell from '../layout/AppShell';
import './pages.css';

export const AboutUs: React.FC = () => (
<AppShell title="About Us">
<article className="panel about-page">
<section className="about-block">
<h2>Our Mission</h2>
<p>
At The Macha Group, our mission is to <strong>safeguard organizations by proactively
identifying and addressing vulnerabilities</strong>, thereby minimizing potential threats.
We are dedicated to empowering our clients with comprehensive advisory security services,
ensuring a more secure and resilient operational environment.
</p>
</section>

<section className="about-block about-split">
<img
src="/images/field-assessment.png"
alt="Security professional conducting a facility assessment"
className="about-hero-image"
/>
<div>
<h2>About The Macha Group</h2>
<p>
In a world where security threats are constantly evolving—from planned physical attacks
on public buildings and schools to sophisticated cyber-attacks targeting private
companies—proactive defense isn’t just a best practice, it’s a necessity.
</p>
<p>
The Macha Group was founded in 2023 by a team built on discipline, integrity, and a
deep understanding of threat dynamics: <strong>Dr. Bobby Lambert</strong> (Chief
Operating Officer), <strong>Travis Valley</strong> (Chief Executive Officer), and
<strong> Schuyler Moran</strong> (Chief Technology Officer).
</p>
</div>
</section>

<section className="about-block">
<h2>Our Vision</h2>
<p>
Our vision is to be the <strong>leading authority in vulnerability assessment and threat
mitigation</strong>, setting the standard for proactive security solutions.
</p>
</section>

<section className="about-block">
<h2>Leadership</h2>
<div className="leaders-grid">
<article className="leader-card">
<img src="/images/Travis-Valley.png" alt="Travis Valley" />
<h3>Travis Valley</h3>
<p>Chief Executive Officer &amp; Co-Founder</p>
</article>

<article className="leader-card">
<img src="/images/bobby-lambert.png" alt="Bobby Lambert" />
<h3>Bobby Lambert</h3>
<p>Chief Operating Officer &amp; Co-Founder</p>
</article>

<article className="leader-card">
<img src="/images/schuyler-moran.png" alt="Schuyler Moran" />
<h3>Schuyler Moran</h3>
<p>Chief Technology Officer &amp; Co-Founder</p>
</article>
</div>
</section>
</article>
</AppShell>
);

export default AboutUs;
