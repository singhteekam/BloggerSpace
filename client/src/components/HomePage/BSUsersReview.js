import React from "react";
import { motion } from "framer-motion";
import {
  marqueUserReviewVar,
  marqueVariants,
} from "utils/motionVariants/variants";
import { Container, Card, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import mohitsharmaImg from "assets/users/mohit.jpeg";
import sakshamImg from "assets/users/saksham.jpeg";
import swaraImg from "assets/users/swara.jpeg";
import abhayImg from "assets/users/abhay.jpeg";
import harendraImg from "assets/users/hs.jpeg";

const UsersReviewData = [
  {
    name: "Mohit Sharma",
    image: mohitsharmaImg,
    publicURL: "https://bloggerspace.singhteekam.in/profile/mohitnsr882",
    review:
      "❝ My experience as a reviewer and writer has reached new heights. The platform’s draft and editing tools feature allowing me to focus on creating high-quality content. ❞",
  },
  {
    name: "Saksham Kumar",
    image: sakshamImg,
    publicURL: "https://bloggerspace.singhteekam.in/profile/kums6765",
    review:
      "❝ BloggerSpace has exceeded my expectations with its exceptional writing features and user-friendly interface. ❞",
  },
  {
    name: "Swaranjali",
    image: swaraImg,
    publicURL: "https://bloggerspace.singhteekam.in/profile/drswaranjalii",
    review:
      "❝ The platform's focus on enhancing the writing process through innovative features sets it apart in the blogging landscape. ❞",
  },
  {
    name: "Abhay Chaudhary",
    image: abhayImg,
    publicURL: "https://bloggerspace.singhteekam.in/profile/abhayc041",
    review:
      "❝ The supportive community further enhance the overall experience, making BloggerSpace a standout choice. ❞",
  },
  {
    name: "Harendra Singh",
    image: harendraImg,
    publicURL: "https://bloggerspace.singhteekam.in/profile/harendrasingh2021",
    review:
      "❝ My experience with BloggerSpace has been nothing short of exceptional. The platform's user-friendly interface and advanced features have made blogging a breeze. ❞",
  },
  // {
  //   name: "Priya Singh",
  //   image: "https://via.placeholder.com/150",
  //   review:
  //     "❝ The advanced editing tools, collaborative features, and powerful SEO capabilities have transformed my blogging experience, making it more productive and enjoyable. ❞",
  // },
];

const BSUsersReview = () => {
  const duplicatedCards = [...UsersReviewData, ...UsersReviewData];
  return (
    <section className="page-new-section">
      <Container>
        <h3 className="new-section-heading text-center">
          Reviews from the Users
        </h3>
        <div className="heading-underline mx-auto mb-3"></div>
        <div className="usersreview-container">
          <motion.div
            variants={marqueUserReviewVar}
            animate="animate"
            className="usersreview-container-slide d-flex gap-3"
          >
            {duplicatedCards.map((user, index) => (
              <Card className="bgcolor-mint" style={{ width: "18rem" }}>
                <Card.Img
                  src={user.image}
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <b>
                    {user.name}
                    <Link
                      to={user.publicURL}
                      className="btn bs-button-outline mx-1"
                      style={{ fontSize: "0.8rem" }}
                    >
                      View Profile
                    </Link>
                  </b>
                  <div className="heading-underline"></div>

                  <p>
                    <cite className="users-review-text">{user.review}</cite>
                  </p>
                </Card.Body>
                {/* <Card.Footer>
                  <Link to="#" className="btn bs-button-outline">
                    View Profile
                  </Link>
                </Card.Footer> */}
              </Card>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default BSUsersReview;
