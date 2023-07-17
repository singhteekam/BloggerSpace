import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import LoginPage from "../components/LoginPage/LoginPage.js";

const LoginPageModal = ({ show, handleClose }) => {


  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Login</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <LoginPage />
      </Modal.Body>
    </Modal>
  );
};

export default LoginPageModal;
