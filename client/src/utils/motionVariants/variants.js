
export const carouselVariant = {
    hidden: {
      opacity: 0,
      x: -50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        delay: 0.5,
        duration: 2,
      },
    },
  };
  export const imageHoverVariant = {
    hover: {
      scale: 1.2,
      fontWeight: "bold",
      // originX: 0,
      // textShadow:"0px 0px 8px rgb(255,255,255)",
      // boxShadow:"0px 0px 8px rgb(255,255,255)",
      transition: {
        type: "spring",
        stiffness: 300,
        yoyo: Infinity, // We can give any value like 100 etc
      },
    },
  };
  
  export const buttonVariant = {
    hover: {
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 300,
        yoyo: Infinity, // We can give any value like 100 etc
      },
    },
  };
  
  export const marqueVariants = {
    animate: {
      x: [-25, -1000],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 6,
          ease: "linear",
          stiffness: 500,
        },
      },
    },
  };