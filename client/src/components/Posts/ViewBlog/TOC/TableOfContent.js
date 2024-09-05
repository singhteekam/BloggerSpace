import { useEffect, useState } from "react";
import "./TableOfContent.css";

import { useHeadsObserver } from "./TocCustomHook";

function TableOfContent() {
  const {activeId} = useHeadsObserver()
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    // Select all h2, h3, h4 elements
    const elements = Array.from(document.querySelectorAll("h2, h3, h4")).map(
      (elem, index) => {
        // If the element doesn't have an id, assign one dynamically
        if (!elem.id) {
          const uniqueId = `heading-${index}`; // Create unique id
          elem.id = uniqueId; // Assign the id to the element
        }

        return {
          id: elem.id,
          text: elem.innerText,
          level: Number(elem.nodeName.charAt(1)),
        };
      }
    );
    setHeadings(elements);
  }, []);

  const getClassName = (level) => {
    switch (level) {
      case 2:
        return "head2";
      case 3:
        return "head3";
      case 4:
        return "head4";
      default:
        return null;
    }
  };

  const scrollWithOffset = (element) => {
    const offset = 80; // Adjust this to match the height of your navbar
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  return (
    <div className="tocnav">
      <h5 className="color-teal-green">Table of Content:</h5>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id} className={getClassName(heading.level)}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector(`#${heading.id}`);
                if (element) {
                  scrollWithOffset(element); // Use the custom scroll function
                }
              }}
              style={{
                fontWeight: activeId === heading.id ? "bold" : "normal" ,
                textDecoration: "none"
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TableOfContent;
