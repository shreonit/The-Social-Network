const About = () => {
  return (
    <div className="container">
      <div className="static-page">
        <h1>About SOCIATE</h1>
        <p>
          SOCIATE is a modern social media platform designed to connect people and share moments.
          Built with React and TypeScript, SOCIATE offers a clean, intuitive interface for
          creating posts, following friends, and engaging with content.
        </p>
        <h2>Features</h2>
        <ul>
          <li>Create and share posts with text, images, and videos</li>
          <li>Like and comment on posts</li>
          <li>Follow other users and discover new content</li>
          <li>Save posts for later</li>
          <li>Personalize your profile</li>
          <li>Dark and light themes</li>
        </ul>
        <h2>Privacy</h2>
        <p>
          Your privacy is important to us. All data is stored locally in your browser,
          giving you full control over your information.
        </p>
      </div>
    </div>
  );
};

export default About;

