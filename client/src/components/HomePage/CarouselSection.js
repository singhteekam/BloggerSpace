import React from 'react'
import { Carousel } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { carouselVariant } from 'utils/motionVariants/variants';

const CarouselSection = () => {
  return (
    <section>
        <Carousel>
          <Carousel.Item>
            <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <motion.h3
                variants={carouselVariant}
                initial="hidden"
                animate="visible"
              >
                Welcome to BloggerSpace
              </motion.h3>
              <motion.p
                variants={carouselVariant}
                initial="hidden"
                animate="visible"
              >
                Write on any topic of your choice. Please refer the basic
                guidelines so that we can review your blog and publish it.
              </motion.p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
          <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <h3>Features to explore</h3>
              <p>
                Create new blog, save as draft the blog, Change password, Email
                verification for new users, View public profile of users, etc
              </p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
          <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <h4>Explore Reviewer Panel </h4>
              <small>
                If you want to review blogs written by other authors then
                register yourself and verify your account. After successful
                verification, Admin will approve your request within a day.
              </small>{" "}
              <br />
              <Link className="btn bs-button">
                Go to Reviewer Panel<i className="fas fa-chevron-right"></i>
              </Link>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
          <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <h4>Community</h4>
              <small>
                If you want to share your opinion or want to ask any question
                then post it on Community page. There is no review process. The
                submitted posts will be published immediately.
              </small>{" "}
              <br />
              <Link className="btn bs-button">
                Go to Community<i className="fas fa-chevron-right"></i>
              </Link>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </section>
  )
}

export default CarouselSection
