import axios from "axios";
import React, { useEffect, useState } from "react";
import { Card, Button, Container, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import PreLoader from "utils/PreLoader";
import ImageCompressor from "image-compressor.js";

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageURL, setImageURL] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }
    setIsDisable(true);

    if (selectedFile.size > 0.064 * 1024 * 1024) {
      try {
        // Compress the image to a maximum of 64KB
        const compressedFile = await new ImageCompressor().compress(selectedFile, {
          quality: 0.6, // Adjust the quality as per your preference
          maxWidth: 800, // Adjust the maximum width as per your preference
          maxHeight: 800, // Adjust the maximum height as per your preference
          maxSizeMB: 0.064, // Maximum size in MB (64KB)
        });

        console.log(
          "Compressed Image Size: ",
          compressedFile.size / 1024 + " KB"
        );
        setSelectedFile(compressedFile);
        toast.info("File compressed to: " + compressedFile.size / 1024 + " KB")
      } catch (error) {
        console.error("Error compressing image:", error);
        toast.error("Error compressing image");
      }
    }

    // 1. Get the file details and prepare for GitHub upload
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Call backend API to push file to GitHub
      const response = await axios.post("/api/users/fileupload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // const data = await response.json();

      console.log(response.data.success);
      console.log(response.data.imageUrl);

      setIsDisable(false);

      if (response.data.success) {
        setImageURL(response.data.imageUrl); // GitHub raw image URL
        // navigator.clipboard.writeText(imageURL);
        // toast.success("Link Copied!!!");
      } else {
        toast.error("Upload failed.");
      }
    } catch (error) {
      setIsDisable(false);
      toast.error("Error uploading the file:", error);
    }
  };

  useEffect(() => {
    const fetchUploadedFiles = async () => {
      try {
        const response = await axios.get("/api/users/uploadedfiles/fetch");

        if (response.data.success) {
          console.log(response.data.images);
          setFiles(response.data.images);
        } else {
          toast.error("Failed to fetch images");
        }
      } catch (error) {
        toast.error("Error fetching uploaded files:", error);
      }
    };
    fetchUploadedFiles();
  }, [imageURL]);

  return (
    <div>
      <ToastContainer />
      <h5 className="color-teal-green ">Upload Files:</h5>
      <small>
        Upload local files to the server and use the File Link in your blog.
      </small>
      <br />
      <input type="file" onChange={handleFileChange} />
      <Button
        variant="success"
        size="sm"
        onClick={handleUpload}
        disabled={isDisable}
      >
        {isDisable ? "Uploading..." : "Upload File"}
      </Button>
      <Button
        className="bs-button mx-2"
        size="sm"
        onClick={() => setShowConfirmModal(true)}
      >
        Uploaded Files
      </Button>
      <br />
      {isDisable && <i>Please wait while the file is uploading to server...</i>}
      {imageURL && (
        <div>
          <h6>
            Link:{" "}
            <Link
              href="#"
              onClick={() => {
                navigator.clipboard.writeText(imageURL);
                toast.success("Link Copied");
              }}
            >
              {imageURL}
            </Link>
          </h6>
          <Button
            className="bs-button"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(imageURL);
              toast.success("Link Copied!!");
            }}
          >
            Copy Link
          </Button>
          <h6>Preview file:</h6>
          <img src={imageURL} alt={imageURL} height="auto" width="200" />
        </div>
      )}
      <Modal
        size="xl"
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Uploaded Files</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <input type="file" onChange={handleFileChange} />
            <Button
              variant="success"
              size="sm"
              onClick={handleUpload}
              disabled={isDisable}
            >
              {isDisable ? "Uploading..." : "Upload File"}
            </Button>
            {isDisable && (
              <i>Please wait while the file is uploading to server...</i>
            )}
          </div>
          {files.length === 0 ? (
            <PreLoader isLoading={true} />
          ) : (
            <div className="savedblogs-items">
              {files?.map((file) => (
                <Card className="fileupload-card">
                  <Card.Body>
                    <Card.Subtitle className="mt-1 text-muted">
                      File Name: {file.fileName}
                    </Card.Subtitle>
                    <img
                      className="card-image"
                      src={file.filePreview}
                      alt={file.fileName}
                      height="200px"
                      width="200px"
                    />
                  </Card.Body>
                  <Card.Footer
                    className="card-footer-button"
                    onClick={() => {
                      navigator.clipboard.writeText(file.fileUrl);
                      toast.success("Link Copied");
                    }}
                  >
                    <b>Copy Link</b>
                  </Card.Footer>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default FileUpload;
