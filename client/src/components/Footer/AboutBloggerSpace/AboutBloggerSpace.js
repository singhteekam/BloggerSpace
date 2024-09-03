import React from "react";
import { Container } from "react-bootstrap";
import bsImg from "assets/BLOGGERSPACE.png";

const AboutBloggerSpace = () => {
  return (
    <section className="newpage-section">
      <Container>
        <div>
          <h2 className="page-title mx-3">About</h2>
          <div className="heading-underline mx-3"></div>
        </div>
        <div className="about-bloggerspace">
          <div>
            <img
              // src="https://github.com/singhteekam/BloggerSpace/blob/main/client/public/BLOGGERSPACE.png?raw=true"
              src={bsImg}
              alt="BloggerSpace Logo"
              width="300px"
            />
          </div>
          <div>
            <h4>BloggerSpace</h4>
            <ul>
              <li>
                A blogging website where users can write a blog on any topic.
                There are two panels: Writing and Reviewing panel. In writing
                panel, anyone can signup and start writing blogs.
              </li>
              <li>
                The reviewer requests would be sent to admin for approval and
                then user can start reviewing the assigned blogs. The admin can
                delete any user, revoke/grant reviewer access.
              </li>
              <li>
                Features: View all published blogs, Create new blog, save as
                draft the blog, Change password, Email verification for new
                users, View public profile of any user, Change username, like
                and comment, visitors count, admin dashboard. Used nodemailer
                API to send emails.
              </li>
              <li>
                Ex: Email will be sent when the blog is under review, discarded,
                published.
              </li>
              <li>
                Review stages: Pending for Review-Under review-In
                Review-Awaiting author (if need modification)-Publish
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutBloggerSpace;
