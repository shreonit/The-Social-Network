const Terms = () => {
  return (
    <div className="container">
      <div className="static-page">
        <h1>Terms of Use</h1>
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using SOCIATE, you accept and agree to be bound by the terms
          and provision of this agreement.
        </p>

        <h2>2. User Conduct</h2>
        <p>You agree to use SOCIATE in a manner that is:</p>
        <ul>
          <li>Lawful and in compliance with all applicable laws</li>
          <li>Respectful of other users' rights and privacy</li>
          <li>Free from harassment, abuse, or harmful content</li>
        </ul>

        <h2>3. Content</h2>
        <p>
          You are responsible for all content you post on SOCIATE. You retain ownership
          of your content but grant SOCIATE a license to display and distribute it.
        </p>

        <h2>4. Privacy</h2>
        <p>
          Your use of SOCIATE is also governed by our Privacy Policy. Please review our
          Privacy Policy to understand our practices.
        </p>

        <h2>5. Modifications</h2>
        <p>
          SOCIATE reserves the right to modify these terms at any time. Your continued use
          of the service constitutes acceptance of any changes.
        </p>
      </div>
    </div>
  );
};

export default Terms;

