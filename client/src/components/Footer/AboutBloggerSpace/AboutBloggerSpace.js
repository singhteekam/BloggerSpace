import React from "react";
import { Container, Stack } from "react-bootstrap";
import bsImg from "assets/BLOGGERSPACE.png";
import { Link } from "react-router-dom";
import { BsBoxArrowUpRight } from "react-icons/bs";

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
        <hr />
        <h4 className="about-bloggerspace">
          <b>Panels:</b>
        </h4>
        <div className="about-bloggerspace">
          <div>
            <Link to={"/newblog"}>
              Writing Panel <BsBoxArrowUpRight />
            </Link>
            <ul>
              <li>Can view any blog</li>
              <li>Can write new blog(should be logged in)</li>
              <li>Can create new community post(should be logged in)</li>
              <li>Like/comment on any blog</li>
              <li>
                Give feedback to the developer of BloggerSpace and give
                suggestions(if any)
              </li>
            </ul>
          </div>
          <div>
            <div>
              <Link
                to={"https://reviewbloggerspace.singhteekam.in/"}
                target="_blank"
              >
                Reviewer Panel <BsBoxArrowUpRight />
              </Link>
              <ul>
                <li>Eligible to review the assigned blogs</li>
                <li>Provide the blog rating(only visible to reviewer/admin)</li>
                <li>Directly contact with the Admin if facing any query</li>
              </ul>
            </div>
          </div>
          <div>
            <div>
              <Link to={"https://reviewbloggerspace.singhteekam.in/"}>
                Admin Panel <BsBoxArrowUpRight />
              </Link>
              <ul>
                <li>Assign new blogs to reviewers for review.</li>
                <li>Publish blogs after 3 stage review process</li>
                <li>Remove any user/reviewer</li>
                <li>Appreciate users/reviewers via Email time to time</li>
                <li>
                  Remove any blog/post which don't follow the mentioned
                  guidelines.
                </li>
                <li>Create the Admin Blogs.</li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutBloggerSpace;
