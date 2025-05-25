import React from "react";
import { motion } from "framer-motion";
import { Container, Row, Col } from "react-bootstrap";
import { marqueVariants } from "utils/motionVariants/variants";

const TechStackData = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/2300px-React-icon.svg.png",
  "https://cdn.buttercms.com/4XpulFfySpWyYTXuaVL2",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/2560px-Node.js_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/MongoDB_Logo.svg/2560px-MongoDB_Logo.svg.png",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa5ZSJpLPqVsS-3h_GuNL6MVQWOq822oOzO9bx8BEuYQ&s",
];

const TechStack = () => {
  const duplicatedTechStack = [...TechStackData, ...TechStackData];
  return (
    <section className="page-new-section">
      <Container>
        <h3 className="new-section-heading text-center">Tech Stack used</h3>
        <div className="heading-underline mx-auto mb-3"></div>
        <div className="logos">
          <motion.div
            variants={marqueVariants}
            animate="animate"
            className="logos-slide"
          >
            {duplicatedTechStack.map((logo, index) => (
              <img src={logo} alt="tech-stack" />
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default TechStack;
