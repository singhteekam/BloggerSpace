import React, { useState } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  FloatingLabel,
} from "react-bootstrap";
import { MdEmail, MdFacebook } from "react-icons/md";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { Link } from "react-router-dom";

const ContactUs = () => {
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (email.trim() === "" || message.trim() === "") {
      toast.info("Please fill mandatory fields");
      return;
    }
    if (mobileNo < 0 || mobileNo.length < 10) {
      toast.info("Please enter a valid mobile number");
      return;
    }
    try {
      const response = await axios.post("/api/users/contactus", {
        email,
        mobileNo,
        message,
      });
      toast.success("Congrats! Your feedback is shared with BloggerSpace.");
      setEmail("");
      setMobileNo(0);
      setMessage("");
    } catch (error) {
      toast.error("Error occured when sending details");
    }
  };
  return (
    <div>
      <div>
        <section className="page-new-section">
          {/* <ToastContainer /> */}
          <Container>
            <h3 className="new-section-heading text-center">Contact Us</h3>
            <div className="heading-underline mx-auto mb-3"></div>
            <Card className="shadow bgcolor-mint">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Contact Us</h6>
                    <hr />
                    <Form>
                      <Form.Group controlId="email">
                        <FloatingLabel
                          controlId="floatingInput"
                          label="Enter your email"
                          className="mb-3"
                          key="email101"
                        >
                          <Form.Control
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </FloatingLabel>
                      </Form.Group>
                      <Form.Group controlId="mobile">
                        <FloatingLabel
                          controlId="floatingInput"
                          label="Enter your mobile no(Optional)"
                          className="mb-3"
                          key="mobile101"
                        >
                          <Form.Control
                            type="number"
                            placeholder="Enter mobile"
                            value={mobileNo}
                            onChange={(e) => setMobileNo(e.target.value)}
                          />
                        </FloatingLabel>
                      </Form.Group>
                      <Form.Group controlId="message">
                        <FloatingLabel
                          controlId="floatingInput"
                          label="Your message"
                          className="mb-3"
                          key="message101"
                        >
                          <Form.Control
                            type="textarea"
                            placeholder="Enter your message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                          />
                        </FloatingLabel>
                      </Form.Group>

                      <Link
                        className="w-100 my-2 btn bs-button"
                        block
                        onClick={handleSubmit}
                      >
                        Send Message
                      </Link>
                    </Form>
                  </Col>
                  <Col md={6} className="border-start">
                    <h5 className="section2heading">Contact Information</h5>
                    <div className="underline"></div>
                    <div>
                      <b>
                        <MdEmail size="25px" /> Email:{" "}
                        <Link to={"mailto:singhteekam.in@gmail.com"}>
                          singhteekam.in@gmail.com
                        </Link>
                      </b>
                      {/* <br /> */}
                      <Button
                        className="bs-button-outline mx-2"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "singhteekam.in@gmail.com"
                          );
                          toast.success("Email Copied to clipboard");
                        }}
                      >
                        Copy Email
                      </Button>
                    </div>

                    <div className="mt-2">
                      <b>
                        <MdFacebook size="25px" /> Facebook page:{" "}
                        <Link
                          to={
                            "https://www.facebook.com/profile.php?id=61573089591301&mibextid=JRoKGi"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Facebook Page
                        </Link>
                      </b>
                      <Button
                        className="bs-button-outline mx-2"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "https://www.facebook.com/profile.php?id=61573089591301&mibextid=JRoKGi"
                          );
                          toast.success("Email Copied to clipboard");
                        }}
                      >
                        Copy Email
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Container>
        </section>
      </div>
    </div>
  );
};

export default ContactUs;
