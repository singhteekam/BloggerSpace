import React from "react";
import { Container } from "react-bootstrap";
function PreLoader(props) {
  return <>
    <Container className="loading-container">
        <div className={props.isLoading ? "loader" : "loader-none"}>
        </div>
    </Container>
  </>
}

export default PreLoader;