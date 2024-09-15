import React from 'react'
import { Carousel } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { carouselVariant } from 'utils/motionVariants/variants';
import {LatestUpdates} from './LatestUpdates';


const CarouselSection = () => {
  return (
    <section>
        <Carousel>
          {LatestUpdates.map((item)=>(
            <Carousel.Item>
            <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <motion.h3
                variants={carouselVariant}
                initial="hidden"
                animate="visible"
              >
                {item.title}
              </motion.h3>
              <motion.p
                variants={carouselVariant}
                initial="hidden"
                animate="visible"
              >
                {item.description}
              </motion.p>
              <br /> 
              {item.link && <Link className="btn bs-button" to={item.link} target='_blank'>
                {item.linkTitle}<i className="fas fa-chevron-right"></i>
              </Link>}
            </Carousel.Caption>
          </Carousel.Item>
          ))}
        </Carousel>
      </section>
  )
}

export default CarouselSection
