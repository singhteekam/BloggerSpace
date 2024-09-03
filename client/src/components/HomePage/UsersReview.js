import React from 'react'
import { Container, Card, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import mohitsharmaImg from "assets/users/mohit.jpeg";
import swaraImg from "assets/users/swara.jpeg";
import sakshamImg from "assets/users/saksham.jpeg";

const UsersReview = () => {
  return (
    <section className="page-new-section">
        <Container>
          <Row>
            <Col md={12} className="text-center mb-3">
              <h3 className="new-section-heading">Reviews from the Users</h3>
              <div className="heading-underline mx-auto"></div>
            </Col>
            <Col md={4}>
              <Card className="bgcolor-mint">
                <Card.Img
                  src={mohitsharmaImg}
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Mohit Sharma</h6>
                  <div className="heading-underline"></div>
                  <p>
                    <cite>
                      ❝ My experience as a reviewer and writer has reached new
                      heights. The platform’s draft and editing tools feature
                      allowing me to focus on creating high-quality content. The
                      supportive community further enhance the overall
                      experience, making BloggerSpace a standout choice.❞
                    </cite>
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link to="#" className="btn bs-button-outline">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="bgcolor-mint">
                <Card.Img
                  src={swaraImg}
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Swaranjali</h6>
                  <div className="heading-underline"></div>
                  <p>
                    <cite>
                      ❝ As a dedicated blogger who values both creativity and
                      efficiency, my experience with BloggerSpace has been
                      exceptional. The platform's focus on enhancing the writing
                      process through innovative features sets it apart in the
                      crowded world of blogging tools.❞
                    </cite>
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link to="#" className="btn bs-button-outline">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="bgcolor-mint">
                <Card.Img
                  src={sakshamImg}
                  // src="https://source.unsplash.com/random/100×100"
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Saksham Kumar</h6>
                  <div className="heading-underline"></div>
                  <p>
                    <cite>
                      ❝ BloggerSpace has exceeded my expectations with its
                      exceptional writing features and user-friendly interface.
                      The advanced editing tools, collaborative features, and
                      powerful SEO capabilities have transformed my blogging
                      experience, making it more productive and enjoyable.❞
                    </cite>
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link to="#" className="btn bs-button-outline">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
  )
}

export default UsersReview
